const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { menuItems } = require('./data/menuData');
const { hashPassword } = require('./security');

const dbPath = path.join(__dirname, 'data', 'restaurant.db');
const db = new sqlite3.Database(dbPath);
const defaultClassicServices = [
  {
    kicker: 'Livraison',
    title: 'Livraison rapide a domicile',
    text: 'Commande en ligne et livraison soignee pour garder la qualite des plats chauds et froids.',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Reservation groupe',
    title: 'Tables de groupe',
    text: 'Organisation simple pour familles et groupes avec placement adapte et service fluide.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Click & Collect',
    title: 'Retrait sur place',
    text: 'Preparez votre commande en avance et recuperez-la rapidement sans attente.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Anniversaire',
    title: 'Pack anniversaire',
    text: 'Table decoree, dessert anniversaire et service dedie pour votre celebration.',
    image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Traiteur',
    title: 'Service traiteur evenement',
    text: 'Buffet et menu personnalise pour reunions, receptions et fetes privees.',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Entreprise',
    title: 'Formules entreprise',
    text: 'Menus midi adaptes aux equipes avec facturation simple et livraison ponctuelle.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'
  }
];
const defaultSpecialOffers = [
  {
    kicker: 'Happy Hour',
    title: 'Boissons -20%',
    text: 'Chaque jour de 17h a 19h, profitez d une reduction sur notre selection de boissons.',
    badge: '17h - 19h',
    image: 'https://images.unsplash.com/photo-1514361892635-6d33c65d8d4d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Menu midi',
    title: 'Formule dejeuner',
    text: 'Entree + plat + boisson a prix special du lundi au vendredi.',
    badge: 'Lun - Ven',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Soiree duo',
    title: 'Menu duo romantique',
    text: 'Menu partage, dessert duo et table reservee pour deux personnes.',
    badge: 'Sur reservation',
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Weekend famille',
    title: 'Offre famille week-end',
    text: 'Menus enfants + plat partage avec boisson offerte pour 4 personnes.',
    badge: 'Sam - Dim',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Etudiants',
    title: 'Reduction etudiant',
    text: 'Presentation carte etudiante = reduction immediate sur les plats selectionnes.',
    badge: 'Mardi',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Anniversaire',
    title: 'Dessert offert',
    text: 'Pour toute reservation anniversaire, dessert signature offert par la maison.',
    badge: 'Groupe 4+',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80'
  }
];
const defaultRestaurantInfo = {
  restaurantName: 'NeonBite',
  phone: '+212725572550',
  whatsappPhone: '212725572550',
  email: 'contact@neonbite.ma',
  address: 'Boulevard de la Corniche, Casablanca',
  openingHours: 'Ouvert tous les jours 12:00 - 01:00',
  mapUrl: 'https://maps.google.com/?q=Boulevard+de+la+Corniche+Casablanca',
  mapEmbedUrl: 'https://www.google.com/maps?q=Boulevard%20de%20la%20Corniche%20Casablanca&output=embed',
  heroKicker: 'Bienvenue chez {{restaurantName}}',
  heroTitle: 'Des plats frais, un service chaleureux, des moments a partager',
  heroText: 'Profitez d une cuisine simple et savoureuse dans une ambiance conviviale, en famille ou entre amis.',
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
