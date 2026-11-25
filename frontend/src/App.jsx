import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiClock, FiInstagram, FiMapPin, FiMenu, FiMinus, FiPhone, FiPlus, FiSearch, FiShoppingBag, FiX } from 'react-icons/fi'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import AdminRoute from './components/admin/AdminRoute.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx'
import AdminMenuPage from './pages/admin/AdminMenuPage.jsx'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'
import { menuService } from './services/menuService.js'
import { orderService } from './services/orderService.js'
import ReservationsPage from './pages/ReservationsPage.jsx'
import AdminReservationsPage from './pages/admin/AdminReservationsPage.jsx'
import { useMenu } from './hooks/useMenu.js'

const CartContext = createContext(null)
const photo = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const cafeAddress = 'Shastri Nagar, Holta, near Kapila Nursing Home, Palampur, Himachal Pradesh 176061, India'
const mapDirections = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafeAddress)}`

const formatPrice = (price) => `₹${price}`

function useCart() { return useContext(CartContext) }

function Header() {
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const count = items.reduce((total, item) => total + item.quantity, 0)
  const close = () => setOpen(false)

  return <>
    <div className="announcement"><span>GOOD COFFEE, BETTER STORIES</span><span className="announcement-right">A little corner for your everyday pause <span>✳</span></span></div>
    <header className="site-header">
      <Link to="/" className="brand" onClick={close} aria-label="Qissa Coffee House home"><span className="brand-mark">q.</span><span className="brand-copy"><b>QISSA</b><small>COFFEE HOUSE</small></span></Link>
      <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        <NavLink to="/" onClick={close}>Home</NavLink><NavLink to="/menu" onClick={close}>The menu</NavLink><NavLink to="/our-story" onClick={close}>Our story</NavLink><NavLink to="/reservations" onClick={close}>Find a table</NavLink>
        <div className="mobile-nav-actions"><Link to="/account" onClick={close}>My account</Link><Link to="/cart" onClick={close}>Your bag ({count})</Link></div>
      </nav>
      <div className="header-actions"><Link className="account-link" to="/account">Sign in</Link><Link className="bag-link" to="/cart" aria-label={`Shopping bag, ${count} items`}><FiShoppingBag/><span>Bag</span><b>{count}</b></Link><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <FiX/> : <FiMenu/>}</button></div>
    </header>
    {location.pathname !== '/' && <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>{location.pathname.slice(1).replaceAll('-', ' ') || 'Home'}</span></div>}
  </>
}

function Footer() {
  return <footer className="footer"><div className="footer-main"><div className="footer-brand"><Link to="/" className="brand"><span className="brand-mark">q.</span><span className="brand-copy"><b>QISSA</b><small>COFFEE HOUSE</small></span></Link><p>For the conversations that run long<br/>and the cups that make them better.</p><a href="https://www.instagram.com/qissacoffeehouse/" className="social-link" aria-label="Instagram"><FiInstagram/> Follow along</a></div><div><p className="footer-label">COME ON IN</p><address className="footer-address"><a href={mapDirections} target="_blank" rel="noreferrer">Shastri Nagar, Holta,<br/>near Kapila Nursing Home,<br/>Palampur, Himachal Pradesh 176061, India <FiArrowUpRight/></a></address><a className="footer-contact" href="tel:+918894295359"><FiPhone/> +91 88942 95359</a><Link className="footer-link" to="/reservations">Plan a visit <FiArrowUpRight/></Link></div><div><p className="footer-label">TAKE YOUR TIME</p><Link to="/menu">Explore the menu</Link><Link to="/our-story">Our story</Link><Link to="/reservations">Reservations</Link></div><div className="footer-note"><span className="tiny-flower">✳</span><p>Made for slow mornings<br/>and stories worth sharing.</p></div></div><div className="footer-bottom"><span>© 2026 Qissa Coffee House</span><span>Thoughtfully brewed, always.</span><Link to="/account">Customer account</Link></div></footer>
}

function Home() {
  const { products, loading, error } = useMenu({ featured: true })
  return <>
    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/>A PLACE TO PAUSE</div><h1>Every cup<br/>has a <em>story.</em></h1><p>Somewhere between the first sip and the last page, the day starts to feel like yours again.</p><div className="hero-buttons"><Link className="button button-dark" to="/menu">Explore the menu <FiArrowRight/></Link><Link className="text-button" to="/our-story">A little about us <FiArrowUpRight/></Link></div><div className="hero-footnote"><span>01 — SLOW DOWN</span><span>02 — STAY AWHILE</span></div></div><div className="hero-image-wrap"><img className="hero-image" src={photo('photo-1445116572660-236099ec97a0', 1500)} alt="Warm, sunlit neighbourhood coffee shop"/><div className="hero-image-caption"><span>YOUR TABLE IS WAITING</span><span>✳</span></div><div className="round-stamp"><span>BREWED WITH<br/>A LITTLE MORE<br/>HEART</span><b>✳</b></div></div><div className="hero-index">EST. FOR GOOD CONVERSATIONS&nbsp; · &nbsp;01/04</div></section>

      <section className="intro section-pad"><div className="section-kicker">A GOOD THING, MADE SLOWLY</div><div className="intro-grid"><h2>A little warmth<br/>in the middle<br/>of <em>everything.</em></h2><div className="intro-text"><p>Qissa means story. We think the best ones begin with no particular plan: a familiar face, a second cup, another five minutes before you have to go.</p><Link className="underlined-link" to="/our-story">Get to know Qissa <FiArrowUpRight/></Link></div><div className="intro-photo"><img src={photo('photo-1495474472287-4d71bcdd2085', 800)} alt="Freshly brewed coffee on a wooden counter"/><span>THE GOOD PART OF YOUR DAY, RIGHT HERE.</span></div></div></section>

      <section className="menu-preview section-pad"><div className="section-heading"><div><div className="section-kicker">A FEW HOUSE FAVOURITES</div><h2>Made for the <em>moment.</em></h2></div><Link className="button button-outline" to="/menu">See the full menu <FiArrowRight/></Link></div>{products.some(item => item.isSample) && <p className="sample-note">Sample menu for preview · items and prices are illustrative.</p>}{error ? <div className="menu-load-error">{error}</div> : loading ? <p className="menu-loading">Bringing the menu to the table…</p> : products.length ? <div className="product-grid">{products.slice(0,3).map((item, index) => <ProductCard key={item.id} item={item} index={index}/>)}</div> : <p className="menu-loading">Our featured menu is being prepared.</p>}</section>

      <section className="story-band"><div className="story-photo"><img src={photo('photo-1442512595331-e89e73853f31', 1200)} alt="Barista preparing a cup of coffee"/></div><div className="story-copy"><div className="section-kicker">THE ART OF STAYING A LITTLE LONGER</div><h2>Not just a coffee.<br/>A <em>little chapter.</em></h2><p>Good coffee is a lovely start. It’s the easy conversation, the familiar corner and the permission to take your time that make a place feel like yours.</p><Link className="button button-light" to="/our-story">Read our story <FiArrowRight/></Link><span className="story-doodle">✳</span></div></section>

      <section className="visit-section section-pad"><div className="visit-copy"><div className="section-kicker">MAKE A LITTLE ROOM FOR YOURSELF</div><h2>We’ll put the<br/>kettle <em>on.</em></h2><p>Come in for your usual, meet someone new, or bring the book you keep meaning to finish.</p><div className="visit-contact"><a href={mapDirections} target="_blank" rel="noreferrer"><FiMapPin/><span>Shastri Nagar, Holta<br/>Near Kapila Nursing Home,<br/>Palampur 176061</span><FiArrowUpRight/></a><a href="tel:+918894295359"><FiPhone/> +91 88942 95359</a></div><Link className="button button-dark" to="/reservations">Find a table <FiArrowRight/></Link></div><div className="visit-image"><img src={photo('photo-1501339847302-ac426a4a7cbb', 1100)} alt="Cosy coffee house seating by the window"/><div className="visit-image-tag"><FiClock/><span>STAY AS LONG<br/>AS YOU LIKE</span></div></div></section>

      <section className="quote-section"><span className="quote-mark">“</span><blockquote>There is always time for one<br/>more good cup.</blockquote><span className="quote-byline">A SMALL QISSA HOUSE THOUGHT</span></section>
    </main>
  </>
}

function ProductCard({ item, index = 0 }) {
  const { addItem } = useCart()
  return <motion.article className="product-card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08, duration: .45 }}><Link className="product-image" to={'/menu?item=' + item.id}><img src={item.imageUrl || photo(item.image, 700)} alt={item.name}/>{item.tag && <span className="product-tag">{item.tag}</span>}<span className="product-quick">View details <FiArrowUpRight/></span></Link><div className="product-info"><div><span className="product-category">{item.categoryName || item.category}</span><h3>{item.name}</h3></div><div className="product-bottom"><p>{item.description}</p><div className="product-order"><b>{formatPrice(item.price)}</b><button disabled={!item.isAvailable} onClick={() => { addItem(item); toast.success(`${item.name} added to your bag`) }} aria-label={item.isAvailable ? `Add ${item.name} to bag` : `${item.name} is unavailable`}>{item.isAvailable ? <FiPlus/> : 'Unavailable'}</button></div></div></div></motion.article>
}

function MenuPage() {
  const { addItem } = useCart()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [quantity, setQuantity] = useState(1)
  const { products, loading, error } = useMenu()
  const [categories, setCategories] = useState([])
  useEffect(() => { menuService.categories().then(setCategories).catch(() => setCategories([])) }, [])
  const selected = products.find(item => item.id === searchParams.get('item'))
  const categoryNames = ['All', ...categories.map(item => item.name)]
  const filtered = products.filter(item => (category === 'All' || item.categoryName === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="page-main"><section className="page-hero menu-page-hero"><div><div className="section-kicker">SOMETHING GOOD IS BREWING</div><h1>A menu for<br/><em>your kind of day.</em></h1><p>Come for a familiar favourite. Stay for something you haven’t tried yet.</p></div><div className="menu-hero-art"><img src={photo('photo-1509042239860-f550ce710b93', 900)} alt="A freshly brewed cup of coffee"/><span>BREWED WITH<br/>A LITTLE MORE<br/>HEART&nbsp; ✳</span></div></section><section className="menu-browser"><div className="menu-toolbar"><p className="sample-note">{products.some(item => item.isSample) ? 'Sample menu for preview · prices are illustrative and not confirmed.' : 'Menu items are currently available to order.'}</p><label className="search-box"><FiSearch/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find your favourite…" aria-label="Search menu"/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><FiX/></button>}</label></div><div className="category-tabs" role="tablist">{categoryNames.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'category-tab active' : 'category-tab'}>{item}</button>)}</div>{error ? <div className="menu-load-error">{error}</div> : loading ? <p className="menu-loading">Bringing the menu to the table…</p> : filtered.length ? <div className="product-grid">{filtered.map((item,index) => <ProductCard key={item.id} item={item} index={index}/>)}</div> : <div className="empty-state"><span>✳</span><h2>Nothing on the table yet.</h2><p>Try a different search or browse another category.</p></div>}<div className="menu-footnote">Allergen and dietary information will be confirmed with the final menu. Please ask our team before ordering.</div></section>{selected && <div className="modal-backdrop" role="presentation" onClick={() => { setSearchParams({}); setQuantity(1) }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Close product details" onClick={() => { setSearchParams({}); setQuantity(1) }}><FiX/></button><img src={selected.imageUrl} alt={selected.name}/><div className="product-modal-copy"><span className="product-category">{selected.categoryName}{selected.isSample ? ' · SAMPLE ITEM' : ''}</span><h2 id="detail-title">{selected.name}</h2><p>{selected.description}</p><div className="detail-note"><span>{selected.ingredients?.length ? 'INGREDIENTS' : 'A NOTE FROM QISSA'}</span><p>{selected.ingredients?.length ? selected.ingredients.join(', ') : selected.isSample ? 'This is an illustrative menu item. Ingredient details are awaiting café confirmation.' : 'Ingredient information will be confirmed with the café.'}</p></div><div className="modal-order"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus/></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><FiPlus/></button></div><button className="button button-dark" disabled={!selected.isAvailable} onClick={() => { for (let index = 0; index < quantity; index++) addItem(selected); toast.success(`${selected.name} added to your bag`); setSearchParams({}); setQuantity(1) }}>{selected.isAvailable ? `Add · ${formatPrice(selected.price * quantity)}` : 'Currently unavailable'} <FiArrowRight/></button></div>{selected.isSample && <span className="form-note">Sample price · this item is not a confirmed café offering.</span>}</div></section></div>}</main>
}

function StoryPage() {
  return <main className="page-main"><section className="story-page-hero"><div className="section-kicker">A PLACE BUILT AROUND A SIMPLE IDEA</div><h1>Everyone has<br/>a <em>Qissa.</em></h1><p>Some begin over coffee. The best ones don’t have to end when the cup is empty.</p><img src={photo('photo-1445116572660-236099ec97a0', 1500)} alt="The welcoming inside of a neighbourhood coffee house"/></section><section className="story-page-body section-pad"><div className="section-kicker">OUR LITTLE CORNER OF THE WORLD</div><h2>A slower kind<br/>of <em>everyday.</em></h2><div className="story-page-text"><p>Qissa is a place for the pause between plans. For the friend who says “just one coffee” and stays until the light changes. For the quiet table, the loud laugh and the stories that find their way out when nobody is in a hurry.</p><p>We’re building a neighbourhood coffee house around good cups, generous welcomes and the belief that ordinary days deserve a lovely little chapter, too.</p><span className="sample-note">Brand story shown here is introductory sample copy, pending the café’s official story.</span></div></section><section className="story-cta"><span>✳</span><h2>There’s room for<br/><em>your story, too.</em></h2><Link className="button button-light" to="/reservations">Plan a visit <FiArrowRight/></Link></section></main>
}



function AccountPage() {
  const { user, loading, login, register, logout } = useAuth()
  const [mode, setMode] = useState('login')
  const [submitting, setSubmitting] = useState(false)
  const isRegistering = mode === 'register'

  async function submitAccount(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form.entries())
    if (isRegistering && values.password !== values.confirmPassword) {
      toast.error('Those passwords don’t match.')
      return
    }
    setSubmitting(true)
    try {
      if (isRegistering) {
        await register({ name: values.name, email: values.email, phone: values.phone, password: values.password })
        toast.success('Your Qissa account is ready. Welcome in!')
      } else {
        await login({ email: values.email, password: values.password })
        toast.success('Welcome back.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'We couldn’t complete that request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="page-main account-page"><div className="account-image"><img src={photo('photo-1493857671505-72967e2e2760', 1200)} alt="A quiet table with coffee and a book"/><div><span>TAKE YOUR TIME.</span><span>✳</span></div></div><section className="account-card"><div className="section-kicker">YOUR QISSA, ALL IN ONE PLACE</div>{loading ? <><h1>Just a <em>moment.</em></h1><p>We’re checking your account.</p></> : user ? <><h1>Good to have<br/>you <em>here.</em></h1><p>Welcome, {user.name}. Your Qissa account is ready.</p><div className="account-links"><Link to="/orders">Your orders <FiArrowUpRight/></Link><Link to="/reservations">Your reservations <FiArrowUpRight/></Link>{user.role === 'admin' && <Link to="/admin">Admin dashboard <FiArrowUpRight/></Link>}</div><button className="button button-outline full-width" onClick={() => { logout(); toast.success('You’ve signed out.') }}>Sign out</button></> : <><h1>{isRegistering ? <>A little space<br/>for <em>your story.</em></> : <>Good to have<br/>you <em>here.</em></>}</h1><p>{isRegistering ? 'Create an account to keep your Qissa visits close at hand.' : 'Sign in or create an account to keep your orders and reservations close at hand.'}</p><form onSubmit={submitAccount}>{isRegistering && <><label>Your name<input name="name" autoComplete="name" minLength="2" maxLength="80" required placeholder="Your name"/></label><label>Phone number <span className="optional-label">OPTIONAL</span><input name="phone" autoComplete="tel" maxLength="30" type="tel" placeholder="Your number"/></label></>}<label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength="8" maxLength="72" required placeholder={isRegistering ? 'At least 8 characters' : 'Your password'}/></label>{isRegistering && <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" maxLength="72" required placeholder="Enter your password again"/></label>}<button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'One moment…' : isRegistering ? 'Create my account' : 'Sign in'} <FiArrowRight/></button></form><div className="account-divider"><span/>OR<span/></div><button className="button button-outline full-width" type="button" onClick={() => setMode(isRegistering ? 'login' : 'register')}>{isRegistering ? 'I already have an account' : 'Create an account'}</button><span className="form-note">Your password is encrypted before it is stored.</span></>}</section></main>
}

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart()
  const hasSample = items.some(item => item.isSample)
  return <main className="page-main cart-page"><div className="section-kicker">A FEW GOOD THINGS</div><h1>Your <em>bag.</em></h1>{hasSample && <p className="sample-note">Sample menu · illustrative items and prices only.</p>}{items.length ? <div className="cart-layout"><div className="cart-items">{items.map(item => <article className="cart-item" key={item.id}><img src={item.imageUrl || photo(item.image, 240)} alt=""/><div className="cart-item-copy"><span className="product-category">{item.categoryName || item.category}</span><h3>{item.name}</h3><button className="remove-link" onClick={() => removeItem(item.id)}>Remove</button></div><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, -1)}><FiMinus/></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => updateQuantity(item.id, 1)}><FiPlus/></button></div><b>{formatPrice(item.price * item.quantity)}</b></article>)}<Link className="underlined-link" to="/menu">← Back to the menu</Link></div><aside className="order-summary"><span className="section-kicker">THE LITTLE DETAILS</span><h2>Order summary</h2><div><span>Subtotal</span><b>{formatPrice(subtotal)}</b></div><div className="summary-total"><span>Pickup total</span><b>{formatPrice(subtotal)}</b></div><Link className="button button-dark full-width" to="/checkout">Continue to checkout <FiArrowRight/></Link>{hasSample && <p>Preview only. Sample orders are not sent to the café.</p>}</aside></div> : <div className="empty-state cart-empty"><span>✳</span><h2>Your bag is taking a little pause.</h2><p>There’s always something lovely on the menu.</p><Link className="button button-dark" to="/menu">Find a favourite <FiArrowRight/></Link></div>}</main>
}

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const hasSample = items.some(item => item.isSample)

  async function submitOrder(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      const order = await orderService.create({
        items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
        phone: String(form.get('phone') || ''),
        note: String(form.get('note') || ''),
      })
      clearCart()
      toast.success(order.isSample ? `Preview order ${order.orderNumber} saved.` : `Order ${order.orderNumber} placed.`)
      navigate('/orders')
    } catch (error) {
      toast.error(error.response?.data?.message || 'We couldn’t place your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) return <main className="page-main checkout-page"><div className="empty-state"><span>✳</span><h2>Your bag is empty.</h2><p>Add a little something before coming to checkout.</p><Link className="button button-dark" to="/menu">Explore the menu <FiArrowRight/></Link></div></main>
  if (authLoading) return <main className="page-main checkout-page"><p className="menu-loading">Checking your account…</p></main>
  if (!user) return <main className="page-main checkout-page"><div className="empty-state"><span>✳</span><h2>Sign in to place your order.</h2><p>Your order will be saved to your Qissa account.</p><Link className="button button-dark" to="/account">Sign in or create an account <FiArrowRight/></Link></div></main>

  return <main className="page-main checkout-page"><div className="section-kicker">ONE LAST LITTLE STEP</div><h1>Let’s make it <em>yours.</em></h1>{hasSample && <p className="sample-note">This sample menu creates a preview order only. It is not sent to the café.</p>}<form className="checkout-layout" onSubmit={submitOrder}><section className="checkout-fields"><div className="checkout-panel"><span className="section-kicker">01 — WHO’S PICKING UP?</span><h2>Your details</h2><p className="checkout-account-name">{user.name} · {user.email}</p><label>Phone number<input name="phone" type="tel" required defaultValue={user.phone || ''} placeholder="Your number" minLength="5" maxLength="30"/></label></div><div className="checkout-panel"><span className="section-kicker">02 — ORDER TYPE</span><h2>Pick up</h2><p className="checkout-account-name">Pay at the café when you collect your order.</p><label className="checkout-full-label">A note for the café <span className="optional-label">OPTIONAL</span><textarea name="note" rows="3" maxLength="500" placeholder="Anything we should know?"/></label></div></section><aside className="order-summary checkout-summary"><span className="section-kicker">THE LITTLE DETAILS</span><h2>Your order</h2>{items.map(item => <div key={item.id}><span>{item.quantity} × {item.name}</span><b>{formatPrice(item.price * item.quantity)}</b></div>)}<div className="summary-total"><span>Pickup total</span><b>{formatPrice(subtotal)}</b></div><button className="button button-dark full-width" type="submit" disabled={submitting}>{submitting ? 'Sending your order…' : 'Place pickup order'} <FiArrowRight/></button><p>{hasSample ? 'Illustrative total. This preview order is saved to your account only.' : 'Pay at the café on pickup. Online payments are not enabled yet.'}</p></aside></form></main>
}

function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (authLoading) return
    setOrders([])
    if (!user) { setLoading(false); return }
    setLoading(true)
    orderService.mine().then(setOrders).catch(() => setError('We couldn’t load your orders just now.')).finally(() => setLoading(false))
  }, [user, authLoading])
  if (authLoading || loading) return <main className="page-main orders-page"><p className="menu-loading">Finding your orders…</p></main>
  if (!user) return <main className="page-main orders-page"><div className="orders-card"><span className="orders-icon"><FiShoppingBag/></span><div className="section-kicker">YOUR QISSA ACCOUNT</div><h1>Sign in to see<br/><em>your orders.</em></h1><Link className="button button-dark" to="/account">Sign in <FiArrowRight/></Link></div></main>
  return <main className="page-main orders-page"><div className="orders-list-wrap"><div className="section-kicker">A LITTLE UPDATE</div><h1>Your <em>orders.</em></h1>{error ? <p>{error}</p> : orders.length ? <div className="orders-list">{orders.map(order => <article className="customer-order-card" key={order._id}><div className="customer-order-head"><div><span className="section-kicker">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleString()}</h2></div><span className="order-status">{order.status}</span></div>{order.items.map(item => <div className="customer-order-item" key={item.product}><span>{item.quantity} × {item.name}</span><b>{formatPrice(item.unitPrice * item.quantity)}</b></div>)}<div className="customer-order-total"><span>Pickup total · pay at café</span><b>{formatPrice(order.total)}</b></div>{order.isSample && <p className="sample-note">Preview order only · saved to your account, not sent to the café.</p>}</article>)}</div> : <div className="orders-card"><span className="orders-icon"><FiShoppingBag/></span><p>You haven’t placed an order yet.</p><Link className="button button-dark" to="/menu">Explore the menu <FiArrowRight/></Link></div>}<Link className="underlined-link orders-back" to="/menu">Order something lovely <FiArrowRight/></Link></div></main>
}

function NotFound() { return <main className="page-main not-found"><span>✳</span><h1>Looks like this<br/>story took <em>a turn.</em></h1><Link className="button button-dark" to="/">Back to the beginning <FiArrowRight/></Link></main> }

function AppRoutes() {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Header/>}
      <AnimatePresence mode="wait">
        <motion.div key={pathname} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .22 }}>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/menu" element={<MenuPage/>}/>
            <Route path="/our-story" element={<StoryPage/>}/>
            <Route path="/reservations" element={<ReservationsPage/>}/>
            <Route path="/account" element={<AccountPage/>}/>
            <Route path="/cart" element={<CartPage/>}/>
            <Route path="/checkout" element={<CheckoutPage/>}/>
            <Route path="/orders" element={<OrdersPage/>}/>
            <Route path="/admin/login" element={<AdminLoginPage/>}/>
            <Route path="/admin" element={<AdminRoute/>}>
              <Route element={<AdminLayout/>}>
                <Route index element={<AdminDashboardPage/>}/>
                <Route path="orders" element={<AdminOrdersPage/>}/>
                <Route path="reservations" element={<AdminReservationsPage/>}/>
                <Route path="customers" element={<AdminCustomersPage/>}/>
                <Route path="menu" element={<AdminMenuPage/>}/>
                <Route path="notifications" element={<AdminNotificationsPage/>}/>
                <Route path="settings" element={<AdminSettingsPage/>}/>
              </Route>
            </Route>
            <Route path="*" element={<NotFound/>}/>
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default function App() {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('qissa-cart') || '[]') } catch { return [] } })
  const cart = useMemo(() => ({ items, subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0), addItem: (product) => setItems(current => { const found = current.find(item => item.id === product.id); const next = found ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; localStorage.setItem('qissa-cart', JSON.stringify(next)); return next }), updateQuantity: (id, delta) => setItems(current => { const next = current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0); localStorage.setItem('qissa-cart', JSON.stringify(next)); return next }), removeItem: (id) => setItems(current => { const next = current.filter(item => item.id !== id); localStorage.setItem('qissa-cart', JSON.stringify(next)); return next }), clearCart: () => { localStorage.removeItem('qissa-cart'); setItems([]) } }), [items])
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <CartContext.Provider value={cart}>
            <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 2, fontFamily: 'DM Sans, sans-serif', background: '#34231c', color: '#fffaf4' } }}/>
            <AppRoutes/>
          </CartContext.Provider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
