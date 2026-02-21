const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { menuItems } = require('./data/menuData');
const { hashPassword } = require('./security');

const dbPath = path.join(__dirname, 'data', 'restaurant.db');
const db = new sqlite3.Database(dbPath);
const defaultClassicServices = [
  {
    kicker: 'Diner prive',
    title: 'Table privee premium',
    text: 'Un espace reserve pour anniversaires, rendez-vous et soirees exclusives.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Evenements entreprise',
    title: 'Evenements entreprise',
    text: 'Menus adaptes, accueil VIP et coordination complete pour vos equipes.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Experience chef',
    title: 'Show cooking live',
    text: 'Experience immersive avec chef en direct et presentation artistique des plats.',
    image: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?auto=format&fit=crop&w=1200&q=80'
  }
];
const defaultSpecialOffers = [
  {
    kicker: 'Eclat anniversaire',
    title: 'Pack Anniversaire Premium',
    text: 'Gateau signature, mise en scene lumineuse et coin photo dedie.',
    badge: '-15% groupe 6+',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Soiree duo',
    title: 'Diner Duo Signature',
    text: 'Menu 3 services, mocktail duo et table romantique reservee.',
    badge: 'Edition soiree',
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Apres-travail',
    title: 'Accords tapas et boissons',
    text: 'Assiettes tapas + boissons a prix doux entre 17h et 20h.',
    badge: 'Du lundi au jeudi',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
  }
];
const defaultRestaurantInfo = {
  restaurantName: 'NeonBite',
  phone: '+212 6 12 34 56 78',
  whatsappPhone: '212612345678',
  email: 'contact@neonbite.ma',
  address: 'Boulevard de la Corniche, Casablanca',
  openingHours: 'Ouvert tous les jours 12:00 - 01:00',
  mapUrl: 'https://maps.google.com/?q=Boulevard+de+la+Corniche+Casablanca',
  mapEmbedUrl: 'https://www.google.com/maps?q=Boulevard%20de%20la%20Corniche%20Casablanca&output=embed',
  heroKicker: 'Experience {{restaurantName}}',
  heroTitle: 'La cuisine devient un spectacle vivant',
  heroText: 'Lumieres immersives, saveurs intenses et assiettes qui arrivent comme une scene de theatre.',
  contactHeadline: 'Creons votre prochaine experience',
  contactDescription: 'Evenements, diners prives, collaborations ou simples questions. Ecrivez-nous, nous repondons rapidement.',
  footerNote: 'Reservez votre table et vivez pleinement l experience NeonBite.'
};
const defaultSiteImages = {
  heroBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80',
  reservationPanelBackground: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  contactBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1500&q=80'
};

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

async function seedMenuIfEmpty() {
  const row = await get('SELECT COUNT(*) AS count FROM menu_items');
  if (row.count > 0) return;

  for (const item of menuItems) {
    const images = item.image ? JSON.stringify([item.image]) : JSON.stringify([]);
    await run(
      `INSERT INTO menu_items (name, description, category, price, spicy_level, image, images_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.description, item.category, item.price, item.spicyLevel, item.image, images]
    );
  }
}

async function seedMenuCategories() {
  const defaults = ['Main', 'Starter', 'Street', 'Dessert', 'Drink', 'Offres speciales'];
  const countRow = await get('SELECT COUNT(*) AS count FROM menu_categories');
  if (Number(countRow?.count || 0) === 0) {
    for (const category of defaults) {
      await run(
        `INSERT INTO menu_categories (name) VALUES (?)
         ON CONFLICT(name) DO NOTHING`,
        [category]
      );
    }
  }

  const rows = await all('SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL AND category != ""');
  for (const row of rows) {
    const name = String(row.category || '').trim();
    if (!name) continue;
    await run(
      `INSERT INTO menu_categories (name) VALUES (?)
       ON CONFLICT(name) DO NOTHING`,
      [name]
    );
  }
}

async function backfillImagesJson() {
  const rows = await all('SELECT id, image, images_json FROM menu_items');

  for (const row of rows) {
    if (row.images_json) continue;
    const images = row.image ? [row.image] : [];
    await run('UPDATE menu_items SET images_json = ? WHERE id = ?', [JSON.stringify(images), row.id]);
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      spicy_level INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      guests INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      message TEXT NOT NULL,
      seen_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL DEFAULT ''
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      name TEXT PRIMARY KEY
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admin_account (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await ensureColumn('menu_items', 'images_json', 'images_json TEXT');
  await ensureColumn('reservations', 'seen_admin', 'seen_admin INTEGER NOT NULL DEFAULT 0');
  await run('UPDATE reservations SET seen_admin = 0 WHERE seen_admin IS NULL');
  await ensureColumn('contact_messages', 'seen_admin', 'seen_admin INTEGER NOT NULL DEFAULT 0');
  await run('UPDATE contact_messages SET seen_admin = 0 WHERE seen_admin IS NULL');

  const defaultAdminEmail = process.env.ADMIN_EMAIL || 'admin@neonbite.com';
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const existingAdmin = await get('SELECT id FROM admin_account WHERE id = 1');
  if (!existingAdmin) {
    const { hash, salt } = hashPassword(defaultAdminPassword);
    await run(
      'INSERT INTO admin_account (id, email, password_hash, password_salt) VALUES (1, ?, ?, ?)',
      [defaultAdminEmail, hash, salt]
    );
  }

  const logoSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['site_logo']);
  if (!logoSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['site_logo', '']);
  }
  const logoSizeSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['site_logo_size']);
  if (!logoSizeSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['site_logo_size', '32']);
  }
  const brandNameSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['site_brand_name']);
  if (!brandNameSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['site_brand_name', 'NeonBite']);
  }
  const brandNameVisibleSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['site_brand_name_visible']);
  if (!brandNameVisibleSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['site_brand_name_visible', '1']);
  }
  const adminDisplayNameSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['admin_display_name']);
  if (!adminDisplayNameSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['admin_display_name', 'Admin NeonBite']);
  }
  const adminProfilePhotoSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['admin_profile_photo']);
  if (!adminProfilePhotoSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['admin_profile_photo', '']);
  }
  const classicServicesSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['classic_services']);
  if (!classicServicesSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['classic_services', JSON.stringify(defaultClassicServices)]);
  }
  const specialOffersSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['special_offers']);
  if (!specialOffersSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['special_offers', JSON.stringify(defaultSpecialOffers)]);
  }
  const restaurantInfoSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['restaurant_info']);
  if (!restaurantInfoSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['restaurant_info', JSON.stringify(defaultRestaurantInfo)]);
  }
  const siteImagesSetting = await get('SELECT setting_key FROM app_settings WHERE setting_key = ?', ['site_images']);
  if (!siteImagesSetting) {
    await run('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', ['site_images', JSON.stringify(defaultSiteImages)]);
  }

  await seedMenuIfEmpty();
  await backfillImagesJson();
  await seedMenuCategories();
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
