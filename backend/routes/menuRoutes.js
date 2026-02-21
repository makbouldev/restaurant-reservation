const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { specials } = require('../data/menuData');
const { all, get, run } = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
const defaultCategories = ['Main', 'Starter', 'Street', 'Dessert', 'Drink', 'Offres speciales'];

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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

function parseImages(row) {
  try {
    const parsed = row.images_json ? JSON.parse(row.images_json) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    // Fallback below for legacy rows.
  }

  if (row.image) return [row.image];
  return [];
}

function formatMenuRow(row) {
  const images = parseImages(row);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    spicyLevel: row.spicy_level,
    image: images[0] || '',
    images
  };
}

function deleteLocalFileIfUpload(filePath) {
  if (!filePath || typeof filePath !== 'string' || !filePath.startsWith('/uploads/')) return;

  const absolute = path.join(__dirname, '..', filePath.replace('/uploads/', 'uploads/'));
  fs.unlink(absolute, () => {});
}

function parseKeepImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string');
  } catch (error) {
    return [];
  }
}

function normalizeCategoryName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

router.get('/menu', async (req, res) => {
  try {
    const { category } = req.query;

    const rows = category
      ? await all('SELECT * FROM menu_items WHERE LOWER(category) = LOWER(?) ORDER BY id DESC', [category])
      : await all('SELECT * FROM menu_items ORDER BY id DESC');

    return res.json(rows.map(formatMenuRow));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch menu items.' });
  }
});

router.get('/menu/categories', async (req, res) => {
  try {
    const managedRows = await all('SELECT name FROM menu_categories ORDER BY name ASC');
    const rows = await all('SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
    const managed = managedRows.map((row) => row.name);
    const fromDb = rows.map((row) => row.category);
    const unique = [...new Set([...managed, ...fromDb])];
    if (unique.length === 0) {
      return res.json(defaultCategories);
    }
    return res.json(unique);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

router.post('/menu/categories', requireAdmin, async (req, res) => {
  try {
    const name = normalizeCategoryName(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    await run(
      `INSERT INTO menu_categories (name) VALUES (?)
       ON CONFLICT(name) DO NOTHING`,
      [name]
    );

    return res.status(201).json({ message: 'Category created.', category: name });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create category.' });
  }
});

router.delete('/menu/categories/:name', requireAdmin, async (req, res) => {
  try {
    const name = normalizeCategoryName(decodeURIComponent(req.params.name || ''));
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const inUse = await get('SELECT id FROM menu_items WHERE LOWER(category) = LOWER(?) LIMIT 1', [name]);
    if (inUse) {
      return res.status(409).json({ message: 'Category is used by one or more plates.' });
    }

    const allCategories = await all('SELECT name FROM menu_categories');
    if (allCategories.length <= 1) {
      return res.status(409).json({ message: 'At least one category is required.' });
    }

    const result = await run('DELETE FROM menu_categories WHERE LOWER(name) = LOWER(?)', [name]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    return res.json({ message: 'Category deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
});

router.get('/menu/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Plate not found.' });

    return res.json(formatMenuRow(row));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch plate.' });
  }
});

router.post('/menu', requireAdmin, upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, spicyLevel = 0 } = req.body;
    const category = normalizeCategoryName(req.body?.category);

    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({ message: 'Missing required plate fields.' });
    }

    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
    if (uploadedImages.length > 4) {
      uploadedImages.forEach(deleteLocalFileIfUpload);
      return res.status(400).json({ message: 'Maximum 4 photos per plate.' });
    }

    const result = await run(
      `INSERT INTO menu_items (name, description, category, price, spicy_level, image, images_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        category,
        Number(price),
        Number(spicyLevel),
        uploadedImages[0] || '',
        JSON.stringify(uploadedImages)
      ]
    );

    await run(
      `INSERT INTO menu_categories (name) VALUES (?)
       ON CONFLICT(name) DO NOTHING`,
      [category]
    );

    const created = await get('SELECT * FROM menu_items WHERE id = ?', [result.id]);
    return res.status(201).json({ message: 'Plate created.', plate: formatMenuRow(created) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create plate.' });
  }
});

router.put('/menu/:id', requireAdmin, upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, spicyLevel = 0 } = req.body;
    const category = normalizeCategoryName(req.body?.category);

    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({ message: 'Missing required plate fields.' });
    }

    const existing = await get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Plate not found.' });

    const currentImages = parseImages(existing);
    const requestedKeepImages = parseKeepImages(req.body.keepImages);
    const keepImages = requestedKeepImages.filter((image) => currentImages.includes(image));
    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const mergedImages = [...keepImages, ...uploadedImages];

    if (mergedImages.length > 4) {
      uploadedImages.forEach(deleteLocalFileIfUpload);
      return res.status(400).json({ message: 'Maximum 4 photos per plate.' });
    }

    await run(
      `UPDATE menu_items
       SET name = ?, description = ?, category = ?, price = ?, spicy_level = ?, image = ?, images_json = ?
       WHERE id = ?`,
      [
        name,
        description,
        category,
        Number(price),
        Number(spicyLevel),
        mergedImages[0] || '',
        JSON.stringify(mergedImages),
        req.params.id
      ]
    );

    await run(
      `INSERT INTO menu_categories (name) VALUES (?)
       ON CONFLICT(name) DO NOTHING`,
      [category]
    );

    const removedImages = currentImages.filter((image) => !mergedImages.includes(image));
    removedImages.forEach(deleteLocalFileIfUpload);

    const updated = await get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Plate updated.', plate: formatMenuRow(updated) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update plate.' });
  }
});

router.delete('/menu/:id', requireAdmin, async (req, res) => {
  try {
    const row = await get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Plate not found.' });

    const images = parseImages(row);
    const result = await run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);

    if (result.changes === 0) return res.status(404).json({ message: 'Plate not found.' });

    images.forEach(deleteLocalFileIfUpload);
    return res.json({ message: 'Plate deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete plate.' });
  }
});

router.get('/specials', (req, res) => {
  res.json(specials);
});

module.exports = router;
