import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Reservation from '../models/Reservation.js'
import ReservationSlot from '../models/ReservationSlot.js'
import Notification from '../models/Notification.js'
import { getDashboardStats } from '../controllers/adminDashboardController.js'
import { listAdminOrders, updateOrderStatus, updateOrderPayment } from '../controllers/adminOrderController.js'
import { listAdminReservations, updateAdminReservationStatus } from '../controllers/adminReservationController.js'
import { listAdminCustomers, getAdminCustomer } from '../controllers/adminCustomerController.js'
import { createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../controllers/adminProductController.js'
import { listNotifications, markAllNotificationsRead } from '../controllers/adminNotificationController.js'
import { notifyAdmin } from '../utils/notifyAdmin.js'

async function runE2ETests() {
  console.log('=== STARTING COMPLETE E2E INTEGRATION TESTS ===')
  // Ensure a proper test database connection (local or in‑memory).
  try {
    const { connectDatabase } = await import('../config/db.js');
    await connectDatabase();
  } catch (err) {
    console.error('❌ Unable to establish test database connection:', err.message);
    console.error('   Ensure a local MongoDB instance is running (e.g., `mongod`) or that the in‑memory server can start.');
    process.exit(1);
  }
  // Verify we are not unintentionally connecting to a production Atlas URI.
  if (!process.env.__MONGOD_INSTANCE && process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb.net')) {
    console.error('❌ Detected Atlas URI in test mode – aborting to protect production data.');
    process.exit(1);
  }

  // Ensure a test admin account exists in the test DB.
  const existingAdmin = await User.findOne({ email: 'admin@qissacoffee.com' }).select('+password');
  if (!existingAdmin) {
    await User.create({
      name: 'Test Admin',
      email: 'admin@qissacoffee.com',
      password: 'Admin@Qissa2026!', // will be hashed by pre‑save hook
      role: 'admin',
    });
    console.log('✓ Created test admin account');
  }


  // 1. ADMIN AUTHENTICATION TEST
  console.log('\n--- 1. Testing Admin Authentication ---')
  const admin = await User.findOne({ email: 'admin@qissacoffee.com' }).select('+password')
  if (!admin || admin.role !== 'admin') throw new Error('Admin account not found')
  const validPassword = await admin.comparePassword('Admin@Qissa2026!')
  if (!validPassword) throw new Error('Admin password authentication failed')
  const invalidPassword = await admin.comparePassword('WrongPassword123')
  if (invalidPassword) throw new Error('Security flaw: invalid password was accepted')
  console.log('✓ Admin credentials and password comparison verified')

  // 2. CUSTOMER & ORDER WORKFLOW TEST
  console.log('\n--- 2. Testing Customer Order & Notification Flow ---')
  let customer = await User.findOne({ email: 'testpatron@example.com' })
  if (!customer) {
    customer = await User.create({
      name: 'Devanshi Sharma',
      email: 'testpatron@example.com',
      phone: '+91 98765 43210',
      password: 'SecurePatronPassword123!',
      role: 'customer',
    })
  }

  const sampleProduct = await Product.findOne({ isAvailable: true, isPublished: { $ne: false } })
  if (!sampleProduct) throw new Error('No available products found to order')

  const testOrder = await Order.create({
    user: customer._id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    orderType: 'pickup',
    note: 'Extra napkin please',
    items: [{
      product: sampleProduct._id,
      name: sampleProduct.name,
      imageUrl: sampleProduct.imageUrl,
      unitPrice: sampleProduct.price,
      quantity: 2,
    }],
    subtotal: sampleProduct.price * 2,
    total: sampleProduct.price * 2,
    status: 'Pending',
    paymentMethod: 'pay_at_cafe',
    paymentStatus: 'unpaid',
  })
  console.log(`✓ Order placed: #${testOrder.orderNumber} for ₹${testOrder.total}`)

  // Trigger real-time notification
  const notif = await notifyAdmin({
    type: 'new_order',
    title: 'New Customer Order Placed',
    message: `Order #${testOrder.orderNumber} placed by ${testOrder.customerName} for ₹${testOrder.total}`,
    referenceId: testOrder._id,
    referenceModel: 'Order',
    data: { orderNumber: testOrder.orderNumber, total: testOrder.total },
  })
  if (!notif) throw new Error('Failed to record notification in MongoDB')
  console.log(`✓ Real-time notification saved in DB: "${notif.title}"`)

  // 3. ADMIN ORDER MANAGEMENT TEST
  console.log('\n--- 3. Testing Admin Order Operations ---')
  let orderListResult = null
  await listAdminOrders(
    { query: { search: testOrder.orderNumber } },
    { json: (d) => { orderListResult = d } },
    (e) => { throw e }
  )
  if (!orderListResult.data.orders.some(o => o.orderNumber === testOrder.orderNumber)) {
    throw new Error('Order not found via admin order search')
  }
  console.log(`✓ Admin successfully searched and retrieved order #${testOrder.orderNumber}`)

  // Status updates: Pending -> Confirmed -> Preparing -> Ready -> Completed
  let updatedOrder = null
  for (const nextStatus of ['Confirmed', 'Preparing', 'Ready', 'Completed']) {
    await updateOrderStatus(
      { params: { id: testOrder._id.toString() }, body: { status: nextStatus } },
      { json: (d) => { updatedOrder = d.data } },
      (e) => { throw e }
    )
    if (updatedOrder.status !== nextStatus) throw new Error(`Status update to ${nextStatus} failed`)
  }
  console.log('✓ Order lifecycle status transitions succeeded (Confirmed -> Preparing -> Ready -> Completed)')

  // Payment status update: unpaid -> paid
  let paidOrder = null
  await updateOrderPayment(
    { params: { id: testOrder._id.toString() }, body: { paymentStatus: 'paid' } },
    { json: (d) => { paidOrder = d.data } },
    (e) => { throw e }
  )
  if (paidOrder.paymentStatus !== 'paid') throw new Error('Payment status update failed')
  console.log('✓ Order payment status successfully marked as PAID')

  // 4. RESERVATIONS WORKFLOW & CAPACITY TEST
  console.log('\n--- 4. Testing Table Reservation & Capacity Flow ---')
  const bookingDate = '2026-12-15'
  const bookingTime = '11:00'
  const guests = 4

  let slot = await ReservationSlot.findOne({ bookingDate, bookingTime })
  if (!slot) {
    slot = await ReservationSlot.create({ bookingDate, bookingTime, capacity: 12, reservedGuests: 0 })
  }
  const initialReserved = slot.reservedGuests

  // Reserve slot
  await ReservationSlot.updateOne({ _id: slot._id }, { $inc: { reservedGuests: guests } })

  const testReservation = await Reservation.create({
    user: customer._id,
    slot: slot._id,
    customerName: customer.name,
    customerEmail: customer.email,
    phone: customer.phone,
    bookingDate,
    bookingTime,
    guests,
    specialRequests: 'Quiet window corner',
    status: 'Pending',
  })
  console.log(`✓ Reservation submitted: #${testReservation.reservationNumber} for ${guests} guests`)

  // Confirm booking
  let confirmedRes = null
  await updateAdminReservationStatus(
    { params: { id: testReservation._id.toString() }, body: { status: 'Confirmed' } },
    { json: (d) => { confirmedRes = d.data } },
    (e) => { throw e }
  )
  if (confirmedRes.status !== 'Confirmed') throw new Error('Failed to confirm reservation')
  console.log(`✓ Admin confirmed reservation #${confirmedRes.reservationNumber}`)

  // Cancel/Reject booking -> Verify capacity is released
  let rejectedRes = null
  await updateAdminReservationStatus(
    { params: { id: testReservation._id.toString() }, body: { status: 'Rejected' } },
    { json: (d) => { rejectedRes = d.data } },
    (e) => { throw e }
  )
  const updatedSlot = await ReservationSlot.findById(slot._id)
  if (updatedSlot.reservedGuests !== initialReserved) {
    throw new Error('Table capacity was not restored after reservation decline')
  }
  console.log('✓ Slot capacity properly restored on table rejection')

  // 5. CUSTOMER MANAGEMENT & AGGREGATION TEST
  console.log('\n--- 5. Testing Customer Management & Aggregations ---')
  let customerListResult = null
  await listAdminCustomers(
    { query: { search: customer.email } },
    { json: (d) => { customerListResult = d } },
    (e) => { throw e }
  )
  const foundCust = customerListResult.data.customers[0]
  if (!foundCust || foundCust.totalOrders < 1) throw new Error('Customer aggregation failed')
  console.log(`✓ Customer profile found: ${foundCust.name} (Orders: ${foundCust.totalOrders}, Spent: ₹${foundCust.totalSpent})`)

  // 6. MENU CRUD TEST
  console.log('\n--- 6. Testing Menu CRUD Operations ---')
  const category = await Category.findOne()
  let createdProduct = null
  await createAdminProduct(
    {
      body: {
        name: 'Automated Test Espresso',
        price: 190,
        description: 'Single-origin espresso with caramel notes',
        category: category._id.toString(),
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=85',
        badge: 'BARISTA SPECIAL',
        isVegetarian: true,
        isAvailable: true,
        isFeatured: false,
      },
    },
    { status: () => ({ json: (d) => { createdProduct = d.data } }) },
    (e) => { throw e }
  )
  console.log(`✓ Created menu item: "${createdProduct.name}" (Slug: ${createdProduct.slug}, Price: ₹${createdProduct.price})`)

  // Update item
  let updatedProduct = null
  await updateAdminProduct(
    {
      params: { id: createdProduct._id.toString() },
      body: { price: 210, isFeatured: true },
    },
    { json: (d) => { updatedProduct = d.data } },
    (e) => { throw e }
  )
  if (updatedProduct.price !== 210 || !updatedProduct.isFeatured) throw new Error('Product update failed')
  console.log('✓ Updated price and featured status successfully')

  // Delete item
  await deleteAdminProduct(
    { params: { id: createdProduct._id.toString() } },
    { json: () => {} },
    (e) => { throw e }
  )
  const checkDeleted = await Product.findById(createdProduct._id)
  if (checkDeleted) throw new Error('Product was not deleted')
  console.log('✓ Deleted test product successfully')

  // 7. NOTIFICATIONS TEST
  console.log('\n--- 7. Testing Notifications Center ---')
  let notifResult = null
  await listNotifications(
    { query: {} },
    { json: (d) => { notifResult = d.data } },
    (e) => { throw e }
  )
  console.log(`✓ Retrieved ${notifResult.notifications.length} notifications (Unread: ${notifResult.unreadCount})`)

  await markAllNotificationsRead(
    {},
    { json: (d) => {} },
    (e) => { throw e }
  )
  console.log('✓ Mark all notifications as read succeeded')

  // 8. DASHBOARD STATISTICS CALCULATION TEST
  console.log('\n--- 8. Testing Dashboard Statistics & Analytics Aggregation ---')
  let statsResult = null
  await getDashboardStats(
    {},
    { json: (d) => { statsResult = d.data } },
    (e) => { throw e }
  )
  console.log('✓ Core summary stats:', JSON.stringify(statsResult.summary))
  console.log(`✓ 7-day sales points: ${statsResult.dailySales.length}, 6-month revenue points: ${statsResult.monthlyRevenue.length}`)
  console.log(`✓ Popular items ranked: ${statsResult.popularItems.length}`)

  console.log('\n==================================================')
  console.log('🎉 ALL END-TO-END TESTS COMPLETED SUCCESSFULLY!')
  console.log('==================================================\n')
  await mongoose.disconnect()
  process.exit(0)
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err)
  process.exit(1)
})
