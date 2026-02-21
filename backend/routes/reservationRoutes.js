const express = require('express');
const { all, get, run } = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();
const allowedStatus = ['pending', 'confirmed', 'cancelled'];
const allowedCommentStatus = ['pending', 'approved', 'rejected'];

function formatReservation(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    guests: row.guests,
    date: row.date,
    time: row.time,
    note: row.note,
    status: row.status,
    seenAdmin: Boolean(row.seen_admin),
    createdAt: row.created_at
  };
}

function formatComment(row) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    text: row.text,
    status: row.status,
    createdAt: row.created_at
  };
}

function formatContactMessage(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    seenAdmin: Boolean(row.seen_admin),
    createdAt: row.created_at
  };
}

router.get('/reservations', requireAdmin, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM reservations ORDER BY id DESC');
    return res.json(rows.map(formatReservation));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reservations.' });
  }
});

router.post('/reservations', async (req, res) => {
  try {
    const { name, phone, guests, date, time, note = '' } = req.body;

    if (!name || !phone || !guests || !date || !time) {
      return res.status(400).json({ message: 'Missing required reservation fields.' });
    }

    const result = await run(
      `INSERT INTO reservations (name, phone, guests, date, time, note, status, seen_admin)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [name, phone, Number(guests), date, time, note]
    );

    const created = await get('SELECT * FROM reservations WHERE id = ?', [result.id]);
    return res.status(201).json({
      message: 'Reservation created successfully.',
      reservation: formatReservation(created)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create reservation.' });
  }
});

router.put('/reservations/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const result = await run('UPDATE reservations SET status = ?, seen_admin = 1 WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Reservation not found.' });

    const updated = await get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Reservation status updated.', reservation: formatReservation(updated) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update reservation status.' });
  }
});

router.put('/reservations/:id/seen', requireAdmin, async (req, res) => {
  try {
    const result = await run('UPDATE reservations SET seen_admin = 1 WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Reservation not found.' });

    const updated = await get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Reservation marked as seen.', reservation: formatReservation(updated) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark reservation as seen.' });
  }
});

router.put('/reservations/mark-seen/all', requireAdmin, async (req, res) => {
  try {
    await run('UPDATE reservations SET seen_admin = 1 WHERE seen_admin = 0');
    return res.json({ message: 'All reservations marked as seen.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark reservations as seen.' });
  }
});

router.delete('/reservations/:id', requireAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Reservation not found.' });

    return res.json({ message: 'Reservation deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete reservation.' });
  }
});

router.get('/comments', async (req, res) => {
  try {
    const rows = await all(
      `SELECT * FROM comments WHERE status = 'approved' ORDER BY id DESC LIMIT 30`
    );
    return res.json(rows.map(formatComment));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch comments.' });
  }
});

router.post('/comments', async (req, res) => {
  try {
    const { name, rating, text } = req.body || {};
    const normalizedRating = Number(rating);

    if (!name || !text || !Number.isInteger(normalizedRating)) {
      return res.status(400).json({ message: 'Missing comment fields.' });
    }

    if (normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const result = await run(
      `INSERT INTO comments (name, rating, text, status) VALUES (?, ?, ?, 'pending')`,
      [String(name).trim().slice(0, 80), normalizedRating, String(text).trim().slice(0, 700)]
    );

    const created = await get('SELECT * FROM comments WHERE id = ?', [result.id]);
    return res.status(201).json({
      message: 'Comment submitted for moderation.',
      comment: formatComment(created)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit comment.' });
  }
});

router.get('/admin/comments', requireAdmin, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM comments ORDER BY id DESC');
    return res.json(rows.map(formatComment));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch comments.' });
  }
});

router.put('/admin/comments/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!allowedCommentStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid comment status.' });
    }

    const existing = await get('SELECT id, status FROM comments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Comment not found.' });
    if (existing.status === 'approved' && status !== 'approved') {
      return res.status(409).json({ message: 'Approved comment is locked and cannot be changed.' });
    }

    const result = await run('UPDATE comments SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Comment not found.' });

    const updated = await get('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Comment status updated.', comment: formatComment(updated) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update comment status.' });
  }
});

router.delete('/admin/comments/:id', requireAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM comments WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Comment not found.' });
    return res.json({ message: 'Comment deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete comment.' });
  }
});

router.post('/contact-messages', async (req, res) => {
  try {
    const { name, email, phone = '', message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Missing contact fields.' });
    }

    const result = await run(
      `INSERT INTO contact_messages (name, email, phone, message, seen_admin)
       VALUES (?, ?, ?, ?, 0)`,
      [
        String(name).trim().slice(0, 90),
        String(email).trim().slice(0, 140),
        String(phone || '').trim().slice(0, 40),
        String(message).trim().slice(0, 1200)
      ]
    );

    const created = await get('SELECT * FROM contact_messages WHERE id = ?', [result.id]);
    return res.status(201).json({
      message: 'Contact message sent.',
      contactMessage: formatContactMessage(created)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send contact message.' });
  }
});

router.get('/admin/contact-messages', requireAdmin, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM contact_messages ORDER BY id DESC');
    return res.json(rows.map(formatContactMessage));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch contact messages.' });
  }
});

router.put('/admin/contact-messages/:id/seen', requireAdmin, async (req, res) => {
  try {
    const result = await run('UPDATE contact_messages SET seen_admin = 1 WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Contact message not found.' });

    const updated = await get('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Contact message marked as seen.', contactMessage: formatContactMessage(updated) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update contact message.' });
  }
});

router.delete('/admin/contact-messages/:id', requireAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Contact message not found.' });

    return res.json({ message: 'Contact message deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete contact message.' });
  }
});

module.exports = router;
