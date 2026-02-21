const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { all, get, run } = require('../db');
const { requireAdmin, getAdminProfile, isValidAdminCredentials, updateAdminCredentials, clearAllTokens } = require('../auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
const DEFAULT_CLASSIC_SERVICES = [
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
const DEFAULT_SPECIAL_OFFERS = [
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
const DEFAULT_RESTAURANT_INFO = {
  restaurantName: 'NeonBite',
  phone: '+212 6 12 34 56 78',
  whatsappPhone: '212612345678',
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
const DEFAULT_SITE_IMAGES = {
  heroBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80',
  reservationPanelBackground: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  contactBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1500&q=80'
};

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed.'));
  }
});

function deleteLocalFileIfUpload(filePath) {
  if (!filePath || typeof filePath !== 'string' || !filePath.startsWith('/uploads/')) return;
  const absolute = path.join(__dirname, '..', filePath.replace('/uploads/', 'uploads/'));
  fs.unlink(absolute, () => {});
}

function parseServiceList(rawValue, fallback, withBadge = false) {
  try {
    const parsed = Array.isArray(rawValue) ? rawValue : JSON.parse(String(rawValue || ''));
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    return parsed
      .slice(0, 12)
      .map((item) => {
        const next = {
          kicker: String(item?.kicker || '').trim().slice(0, 70),
          title: String(item?.title || '').trim().slice(0, 120),
          text: String(item?.text || '').trim().slice(0, 320),
          image: String(item?.image || '').trim().slice(0, 500)
        };
        if (withBadge) next.badge = String(item?.badge || '').trim().slice(0, 80);
        return next;
      })
      .filter((item) => item.kicker && item.title && item.text && item.image);
  } catch (error) {
    return fallback;
  }
}

function toGoogleMapsLink(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
}

function toGoogleMapsEmbedUrl(value, fallbackEmbedUrl) {
  const raw = String(value || '').trim();
  if (!raw) return fallbackEmbedUrl;
  if (raw.includes('output=embed')) return raw;

  const fallbackQuery = `https://www.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`;
  try {
    const parsed = new URL(raw);
    const readParam = (...keys) => {
      for (const key of keys) {
        const next = parsed.searchParams.get(key);
        if (next && String(next).trim()) return String(next).trim();
      }
      return '';
    };
    const qParam = readParam('q', 'query', 'destination', 'll');
    if (qParam) {
      return `https://www.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed`;
    }

    const atMatch = parsed.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return `https://www.google.com/maps?q=${encodeURIComponent(`${atMatch[1]},${atMatch[2]}`)}&output=embed`;
    }

    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/i);
    if (placeMatch && placeMatch[1]) {
      const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    const searchMatch = parsed.pathname.match(/\/search\/([^/]+)/i);
    if (searchMatch && searchMatch[1]) {
      const search = decodeURIComponent(searchMatch[1]).replace(/\+/g, ' ');
      return `https://www.google.com/maps?q=${encodeURIComponent(search)}&output=embed`;
    }
  } catch (error) {
    return fallbackQuery;
  }
  return fallbackQuery;
}

function parseRestaurantInfo(rawValue) {
  const toFlatText = (value, fallback, maxLength) => {
    const sanitize = (input) => String(input || '').trim().slice(0, maxLength);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return sanitize(value.fr || value.en || value.ar || fallback);
    }
    return sanitize(value || fallback);
  };
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    const info = { ...DEFAULT_RESTAURANT_INFO, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    const mapUrl = toGoogleMapsLink(info.mapUrl).slice(0, 500);
    return {
      restaurantName: String(info.restaurantName || DEFAULT_RESTAURANT_INFO.restaurantName).trim().slice(0, 80),
      phone: String(info.phone || '').trim().slice(0, 40),
      whatsappPhone: String(info.whatsappPhone || '').replace(/[^\d]/g, '').slice(0, 20),
      email: String(info.email || '').trim().slice(0, 140),
      address: String(info.address || '').trim().slice(0, 180),
      openingHours: toFlatText(info.openingHours, DEFAULT_RESTAURANT_INFO.openingHours, 120),
      mapUrl,
      mapEmbedUrl: toGoogleMapsEmbedUrl(mapUrl, DEFAULT_RESTAURANT_INFO.mapEmbedUrl).slice(0, 700),
      heroKicker: toFlatText(info.heroKicker, DEFAULT_RESTAURANT_INFO.heroKicker, 120),
      heroTitle: toFlatText(info.heroTitle, DEFAULT_RESTAURANT_INFO.heroTitle, 180),
      heroText: toFlatText(info.heroText, DEFAULT_RESTAURANT_INFO.heroText, 420),
      contactHeadline: String(info.contactHeadline || '').trim().slice(0, 120),
      contactDescription: String(info.contactDescription || '').trim().slice(0, 420),
      footerNote: toFlatText(info.footerNote, DEFAULT_RESTAURANT_INFO.footerNote, 220)
    };
  } catch (error) {
    return { ...DEFAULT_RESTAURANT_INFO };
  }
}

function parseSiteImages(rawValue) {
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    const merged = { ...DEFAULT_SITE_IMAGES, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    return {
      heroBackground: String(merged.heroBackground || '').trim().slice(0, 700),
      reservationPanelBackground: String(merged.reservationPanelBackground || '').trim().slice(0, 700),
      contactBackground: String(merged.contactBackground || '').trim().slice(0, 700)
    };
  } catch (error) {
    return { ...DEFAULT_SITE_IMAGES };
  }
}

router.get('/settings/public', async (req, res) => {
  try {
    const logo = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo']);
    const logoSize = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo_size']);
    const brandName = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_brand_name']);
    const brandNameVisible = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_brand_name_visible']);
    const restaurantInfo = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['restaurant_info']);
    const siteImages = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_images']);
    const classicServices = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['classic_services']);
    const specialOffers = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['special_offers']);
    const galleryRows = await all('SELECT id, image_path FROM gallery_images ORDER BY id DESC LIMIT 60');
    return res.json({
      logoPath: logo?.setting_value || '',
      logoSize: Math.max(20, Math.min(80, Number(logoSize?.setting_value || 32))),
      brandName: String(brandName?.setting_value ?? ''),
      brandNameVisible: String(brandNameVisible?.setting_value || '0') !== '0',
      restaurantInfo: parseRestaurantInfo(restaurantInfo?.setting_value),
      siteImages: parseSiteImages(siteImages?.setting_value),
      galleryImages: galleryRows.map((row) => row.image_path).filter(Boolean),
      classicServices: parseServiceList(classicServices?.setting_value, DEFAULT_CLASSIC_SERVICES),
      specialOffers: parseServiceList(specialOffers?.setting_value, DEFAULT_SPECIAL_OFFERS, true)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch public settings.' });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    const rows = await all('SELECT id, image_path, created_at FROM gallery_images ORDER BY id DESC LIMIT 120');
    return res.json(rows.map((row) => ({
      id: row.id,
      imagePath: row.image_path,
      createdAt: row.created_at
    })));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch gallery images.' });
  }
});

router.get('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const profile = await getAdminProfile();
    const logoSize = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo_size']);
    const brandName = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_brand_name']);
    const brandNameVisible = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_brand_name_visible']);
    const restaurantInfo = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['restaurant_info']);
    const siteImages = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_images']);
    const classicServices = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['classic_services']);
    const specialOffers = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['special_offers']);
    const galleryRows = await all('SELECT id, image_path, created_at FROM gallery_images ORDER BY id DESC LIMIT 120');
    return res.json({
      email: profile.email,
      logoPath: profile.logoPath,
      logoSize: Math.max(20, Math.min(80, Number(logoSize?.setting_value || 32))),
      brandName: String(brandName?.setting_value ?? ''),
      brandNameVisible: String(brandNameVisible?.setting_value || '0') !== '0',
      restaurantInfo: parseRestaurantInfo(restaurantInfo?.setting_value),
      siteImages: parseSiteImages(siteImages?.setting_value),
      displayName: profile.displayName,
      profilePhotoPath: profile.profilePhotoPath,
      classicServices: parseServiceList(classicServices?.setting_value, DEFAULT_CLASSIC_SERVICES),
      specialOffers: parseServiceList(specialOffers?.setting_value, DEFAULT_SPECIAL_OFFERS, true),
      galleryImages: galleryRows.map((row) => ({
        id: row.id,
        imagePath: row.image_path,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch admin settings.' });
  }
});

router.put('/admin/settings/account', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword, newDisplayName } = req.body || {};
    if (!currentPassword || !newEmail || !newDisplayName) {
      return res.status(400).json({ message: 'Current password, email and display name are required.' });
    }

    const profile = await getAdminProfile();
    const validCurrentPassword = await isValidAdminCredentials(profile.email, currentPassword);
    if (!validCurrentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const normalizedNewPassword = String(newPassword || '').trim();
    if (normalizedNewPassword && normalizedNewPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    await updateAdminCredentials({
      nextEmail: newEmail,
      nextPassword: normalizedNewPassword || ''
    });
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('admin_display_name', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [String(newDisplayName).trim().slice(0, 80)]
    );

    clearAllTokens();
    return res.json({ message: 'Account settings updated. Please login again.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update account settings.' });
  }
});

router.put('/admin/settings/profile', requireAdmin, async (req, res) => {
  try {
    const displayName = String(req.body?.displayName || '').trim().slice(0, 80);
    if (!displayName) {
      return res.status(400).json({ message: 'Display name is required.' });
    }

    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('admin_display_name', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [displayName]
    );

    return res.json({ message: 'Profile updated.', displayName });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update profile.' });
  }
});

router.put('/admin/settings/services', requireAdmin, async (req, res) => {
  try {
    const classicServices = parseServiceList(req.body?.classicServices, [], false);
    const specialOffers = parseServiceList(req.body?.specialOffers, [], true);
    if (!classicServices.length || !specialOffers.length) {
      return res.status(400).json({ message: 'Classic services and special offers are required.' });
    }

    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('classic_services', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [JSON.stringify(classicServices)]
    );
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('special_offers', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [JSON.stringify(specialOffers)]
    );

    return res.json({
      message: 'Services content updated.',
      classicServices,
      specialOffers
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update services content.' });
  }
});

router.put('/admin/settings/brand-name', requireAdmin, async (req, res) => {
  try {
    const brandName = String(req.body?.brandName || '').trim().slice(0, 60);
    const brandNameVisible = brandName ? Boolean(req.body?.brandNameVisible) : false;

    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_brand_name', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [brandName]
    );
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_brand_name_visible', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [brandNameVisible ? '1' : '0']
    );

    return res.json({
      message: 'Brand label updated.',
      brandName,
      brandNameVisible
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update brand label.' });
  }
});

router.put('/admin/settings/restaurant-info', requireAdmin, async (req, res) => {
  try {
    const restaurantInfo = parseRestaurantInfo(req.body?.restaurantInfo || {});
    const currentBrandNameRow = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_brand_name']);
    const currentBrandName = String(currentBrandNameRow?.setting_value ?? '').trim();
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('restaurant_info', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [JSON.stringify(restaurantInfo)]
    );
    if (!currentBrandName || currentBrandName.toLowerCase() === 'neonbite') {
      await run(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_brand_name', ?)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
        [restaurantInfo.restaurantName]
      );
      await run(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_brand_name_visible', ?)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
        [restaurantInfo.restaurantName ? '1' : '0']
      );
    }
    return res.json({ message: 'Restaurant info updated.', restaurantInfo });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update restaurant info.' });
  }
});

router.put('/admin/settings/site-images', requireAdmin, async (req, res) => {
  try {
    const siteImages = parseSiteImages(req.body?.siteImages || {});
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_images', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [JSON.stringify(siteImages)]
    );
    return res.json({ message: 'Site images updated.', siteImages });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update site images.' });
  }
});

router.post('/admin/settings/site-image', requireAdmin, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Site image is required.' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    return res.json({ message: 'Site image uploaded.', imagePath });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to upload site image.' });
  }
});

router.post('/admin/settings/service-image', requireAdmin, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Service image is required.' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    return res.json({ message: 'Service image uploaded.', imagePath });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to upload service image.' });
  }
});

router.post('/admin/settings/logo', requireAdmin, imageUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo image is required.' });
    }

    const nextLogoPath = `/uploads/${req.file.filename}`;
    const previous = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo']);
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_logo', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [nextLogoPath]
    );

    deleteLocalFileIfUpload(previous?.setting_value || '');
    return res.json({ message: 'Logo updated.', logoPath: nextLogoPath });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update logo.' });
  }
});

router.delete('/admin/settings/logo', requireAdmin, async (req, res) => {
  try {
    const previous = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo']);
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_logo', '')
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`
    );
    deleteLocalFileIfUpload(previous?.setting_value || '');
    return res.json({ message: 'Logo removed.', logoPath: '' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to remove logo.' });
  }
});

router.post('/admin/settings/profile-photo', requireAdmin, imageUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Profile photo is required.' });
    }

    const nextPhotoPath = `/uploads/${req.file.filename}`;
    const previous = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['admin_profile_photo']);
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('admin_profile_photo', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [nextPhotoPath]
    );
    deleteLocalFileIfUpload(previous?.setting_value || '');
    return res.json({ message: 'Profile photo updated.', profilePhotoPath: nextPhotoPath });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update profile photo.' });
  }
});

router.put('/admin/settings/logo-size', requireAdmin, async (req, res) => {
  try {
    const { size } = req.body || {};
    const numericSize = Number(size);
    if (!Number.isFinite(numericSize)) {
      return res.status(400).json({ message: 'Logo size must be a number.' });
    }
    const normalized = Math.max(20, Math.min(80, Math.round(numericSize)));
    await run(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('site_logo_size', ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
      [String(normalized)]
    );
    return res.json({ message: 'Logo size updated.', logoSize: normalized });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update logo size.' });
  }
});

router.post('/admin/gallery/images', requireAdmin, imageUpload.array('images', 12), async (req, res) => {
  try {
    const uploaded = (req.files || []).map((file) => `/uploads/${file.filename}`);
    if (!uploaded.length) {
      return res.status(400).json({ message: 'At least one image is required.' });
    }

    const currentCountRow = await get('SELECT COUNT(*) AS count FROM gallery_images');
    if ((Number(currentCountRow?.count || 0) + uploaded.length) > 120) {
      uploaded.forEach(deleteLocalFileIfUpload);
      return res.status(400).json({ message: 'Gallery limit reached (120 images).' });
    }

    for (const imagePath of uploaded) {
      await run('INSERT INTO gallery_images (image_path) VALUES (?)', [imagePath]);
    }

    const rows = await all('SELECT id, image_path, created_at FROM gallery_images ORDER BY id DESC LIMIT 120');
    return res.status(201).json({
      message: 'Gallery images added.',
      galleryImages: rows.map((row) => ({
        id: row.id,
        imagePath: row.image_path,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to add gallery images.' });
  }
});

router.delete('/admin/gallery/images/:id', requireAdmin, async (req, res) => {
  try {
    const row = await get('SELECT id, image_path FROM gallery_images WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Gallery image not found.' });

    await run('DELETE FROM gallery_images WHERE id = ?', [req.params.id]);
    deleteLocalFileIfUpload(row.image_path);
    return res.json({ message: 'Gallery image deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete gallery image.' });
  }
});

module.exports = router;
