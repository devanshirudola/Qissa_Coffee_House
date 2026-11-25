import Category from '../models/Category.js'
import Product from '../models/Product.js'

const sampleProducts = [
  { slug: 'saffron-latte', name: 'Saffron cloud latte', category: 'Hot coffee', price: 260, description: 'Velvety espresso, steamed milk and a delicate saffron finish.', image: 'photo-1461023058943-07fcbe16d735', badge: 'HOUSE FAVOURITE', isFeatured: true },
  { slug: 'cold-brew', name: 'Slow Sunday cold brew', category: 'Cold coffee', price: 220, description: 'A patient 18-hour steep, served over a generous pour of ice.', image: 'photo-1517701550927-30cf4ba1dba5', badge: 'SLOW STEEPED', isFeatured: true },
  { slug: 'rose-chai', name: 'Rose & cardamom chai', category: 'Tea & more', price: 180, description: 'A familiar cup with a soft floral note and crushed cardamom.', image: 'photo-1576092768241-dec231879fc3', badge: 'COMFORT IN A CUP', isFeatured: true },
  { slug: 'brioche-toast', name: 'Honey butter brioche', category: 'Something to eat', price: 240, description: 'Golden brioche, whipped cultured butter and wildflower honey.', image: 'photo-1509440159596-0249088772ff', badge: 'BAKED TODAY' },
  { slug: 'chocolate-tart', name: 'Dark chocolate tart', category: 'Something sweet', price: 290, description: 'Silky dark chocolate in a crisp cocoa shell, finished with salt.', image: 'photo-1488477181946-6428a0291777', badge: 'A LITTLE INDULGENCE' },
  { slug: 'iced-mocha', name: 'The Qissa iced mocha', category: 'Cold coffee', price: 250, description: 'Double espresso, bittersweet chocolate and cold milk.', image: 'photo-1461023058943-07fcbe16d735', badge: 'CHOCOLATE & COFFEE' },
  { slug: 'iced-coffee', name: 'Iced coffee', category: 'Cold coffee', price: 210, description: 'A chilled coffee served over ice.', image: 'photo-1517701550927-30cf4ba1dba5', badge: 'INSTAGRAM FEATURE', sourceLabel: 'instagram_reference' },
  { slug: 'vada-pav', name: 'Vada Pav', category: 'Qissa specials', price: 180, description: 'A Mumbai-style potato fritter tucked into pav, shown in Qissa’s Mumbai food pop-up post.', image: 'photo-1606491956689-2ea866880c84', badge: 'PAST POP-UP SPECIAL', isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'chai', name: 'Chai', category: 'Tea & more', price: 150, description: 'Chai is listed on Qissa’s Mumbai food pop-up poster. Recipe details are not confirmed.', image: 'photo-1576092768241-dec231879fc3', badge: 'PAST POP-UP SPECIAL', isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'bombay-banta', name: 'Bombay Banta', category: 'Tea & more', price: 120, description: 'Named as a pairing on Qissa’s Mumbai food pop-up poster. Flavor details are not confirmed.', image: 'photo-1513558161293-cdaf765edfd7', badge: 'PAST POP-UP SPECIAL', isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'keema-pav', name: 'Keema Pav', category: 'Qissa specials', price: 320, description: 'A weekend special shown in a Qissa post; sample description and price.', image: 'photo-1604908176997-125f25cc6f3d', badge: 'PAST WEEKEND SPECIAL', isVegetarian: false, isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'ramen-bowl', name: 'Ramen Bowl', category: 'Limited specials', price: 390, description: 'A limited Friday special shown on the Qissa Instagram grid. Ingredients are not confirmed.', image: 'photo-1569718212165-3a8278d5f624', badge: 'PAST FRIDAY SPECIAL', isVegetarian: false, isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'smashed-mutton-burger', name: 'Smashed Mutton Burger', category: 'Limited specials', price: 390, description: 'A limited Friday special shown on the Qissa Instagram grid. Ingredients are not confirmed.', image: 'photo-1568901346375-23c9450c58cd', badge: 'PAST FRIDAY SPECIAL', isVegetarian: false, isAvailable: false, sourceLabel: 'instagram_reference' },
  { slug: 'mini-burger-sliders', name: 'Mini burger sliders', category: 'Something to eat', price: 290, description: 'Small burgers served with fries, pictured on the Qissa Instagram grid.', image: 'photo-1571091718767-18b5b1457add', badge: 'INSTAGRAM FEATURE', isVegetarian: false, sourceLabel: 'instagram_reference' },
  { slug: 'cinnamon-rolls', name: 'Cinnamon rolls', category: 'Bakery', price: 190, description: 'Swirled cinnamon rolls pictured among Qissa’s baked goods.', image: 'photo-1509365465985-25d11c17e812', badge: 'FRESH BAKES', sourceLabel: 'instagram_reference' },
  { slug: 'biscotti', name: 'Biscotti', category: 'Bakery', price: 150, description: 'Crisp biscotti pictured as a coffee-time bake.', image: 'photo-1558961363-fa8fdf82db35', badge: 'COFFEE COMPANION', sourceLabel: 'instagram_reference' },
  { slug: 'chocolate-chip-cookie', name: 'Chocolate chip cookie', category: 'Bakery', price: 120, description: 'Chocolate chip cookies pictured on the Qissa Instagram grid.', image: 'photo-1499636136210-6f4ee915583e', badge: 'FRESH BAKES', sourceLabel: 'instagram_reference' },
  { slug: 'croissant', name: 'Croissant', category: 'Bakery', price: 170, description: 'A golden crescent pastry pictured among Qissa’s baked goods.', image: 'photo-1555507036-ab1f4038808a', badge: 'FRESH BAKES', sourceLabel: 'instagram_reference' },
  { slug: 'fresh-bread-loaf', name: 'Fresh bread loaf', category: 'Bakery', price: 220, description: 'A house-style loaf pictured on the Qissa Instagram grid.', image: 'photo-1509440159596-0249088772ff', badge: 'BAKED IN HOUSE', sourceLabel: 'instagram_reference' },
  { slug: 'chocolate-cake', name: 'Chocolate cake', category: 'Cakes & sweets', price: 260, description: 'Chocolate cake pictured in Qissa’s cake posts.', image: 'photo-1578985545062-69928b1d9587', badge: 'CAKE COUNTER', sourceLabel: 'instagram_reference' },
  { slug: 'mango-celebration-cake', name: 'Mango celebration cake', category: 'Cakes & sweets', price: 280, description: 'A mango-topped celebration cake pictured on the Qissa Instagram grid.', image: 'photo-1578985545062-69928b1d9587', badge: 'CAKE COUNTER', sourceLabel: 'instagram_reference' },
  { slug: 'berry-cheesecake', name: 'Berry cheesecake', category: 'Cakes & sweets', price: 260, description: 'A slice of berry-topped cheesecake pictured on the Qissa Instagram grid.', image: 'photo-1533134242443-d4fd215305ad', badge: 'CAKE COUNTER', sourceLabel: 'instagram_reference' },
  { slug: 'oreo-cupcake', name: 'Oreo cupcake', category: 'Cakes & sweets', price: 160, description: 'A cupcake topped with an Oreo cookie, pictured on the Qissa Instagram grid.', image: 'photo-1486427944299-d1955d23e34d', badge: 'CAKE COUNTER', sourceLabel: 'instagram_reference' },
  { slug: 'celebration-cake', name: 'Celebration cake', category: 'Cakes & sweets', price: 450, description: 'Decorated celebration cakes pictured on the Qissa Instagram grid. Design and flavour vary.', image: 'photo-1535141192574-5d4897c12636', badge: 'MADE FOR A CELEBRATION', sourceLabel: 'instagram_reference' },
]

export async function seedSampleMenu() {
  await Product.updateMany(
    { slug: { $in: ['saffron-cloud-latte', 'slow-sunday-cold-brew', 'rose-cardamom-chai', 'honey-butter-brioche', 'dark-chocolate-tart', 'qissa-iced-mocha'] }, isSample: true },
    { $set: { isAvailable: false, isPublished: false } },
  )
  const instagramSamples = sampleProducts.filter(product => product.sourceLabel === 'instagram_reference')
  await Product.bulkWrite(instagramSamples.map(product => ({
    updateOne: {
      filter: { slug: product.slug, isSample: true, sourceLabel: { $exists: false } },
      update: { $set: {
        sourceLabel: 'instagram_reference',
        isAvailable: product.isAvailable ?? true,
        isVegetarian: product.isVegetarian ?? true,
        badge: product.badge,
        description: product.description,
      } },
    },
  })), { ordered: false })
  const categoryNames = [...new Set(sampleProducts.map(product => product.category))]
  const categories = await Promise.all(categoryNames.map((name, sortOrder) => Category.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, slug: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), sortOrder, isActive: true } },
    { upsert: true, new: true },
  )))
  const categoryByName = new Map(categories.map(category => [category.name, category._id]))
  const existingSlugs = new Set(await Product.find({ slug: { $in: sampleProducts.map(product => product.slug) } }).distinct('slug'))
  const additions = sampleProducts.filter(product => !existingSlugs.has(product.slug))
  if (!additions.length) return

  await Product.insertMany(additions.map(({ category, image, ...product }) => ({
    ...product,
    category: categoryByName.get(category),
    imageUrl: `https://images.unsplash.com/${image}?auto=format&fit=crop&w=900&q=85`,
    ingredients: [],
    isAvailable: product.isAvailable ?? true,
    isVegetarian: product.isVegetarian ?? true,
    isSample: true,
    sourceLabel: product.sourceLabel || 'development_sample',
  })))
  console.info(`Added ${additions.length} new sample menu items`)
}
