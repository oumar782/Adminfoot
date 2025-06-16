import express from 'express';
const router = express.Router();
import db from '../../db.js';

const validateClientData = (data) => {
  const errors = [];
  if (!data.nom_client?.trim()) errors.push('Le nom est requis');
  if (!data.prenom?.trim()) errors.push('Le prénom est requis');
  if (!data.email?.trim()) errors.push('Email est requis');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email invalide');
  if (!data.statut?.trim()) errors.push('Statut est requis');
  return errors;
};

// CREATE
router.post('/', async (req, res) => {
  const errors = validateClientData(req.body);
  if (errors.length > 0) return res.status(400).json({ success: false, errors });
  try {
    const { nom_client, prenom, email, statut } = req.body;
    const result = await db.query(
      `INSERT INTO client (nom_client, prenom, email, statut) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_client, nom_client, prenom, email, statut`,
      [nom_client, prenom, email, statut]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const { search, statut, page = 1, limit = 5 } = req.query;
    let query = `SELECT id_client, nom_client, prenom, email, statut FROM client`;
    const params = [];
    if (search) {
      query += ` WHERE (nom_client ILIKE $1 OR prenom ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }
    if (statut && statut !== 'all') {
      query += params.length ? ' AND' : ' WHERE';
      query += ` statut = $${params.length + 1}`;
      params.push(statut);
    }

    const offset = (page - 1) * limit;
    const countQuery = `SELECT COUNT(*) FROM client${query.split('FROM client')[1]}`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(query, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id_client, nom_client, prenom, email, statut FROM client WHERE id_client = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const errors = validateClientData(req.body);
  if (errors.length > 0) return res.status(400).json({ success: false, errors });
  try {
    const { nom_client, prenom, email, statut } = req.body;
    const result = await db.query(
      `UPDATE client SET nom_client = $1, prenom = $2, email = $3, statut = $4 WHERE id_client = $5 RETURNING *`,
      [nom_client, prenom, email, statut, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM client WHERE id_client = $1 RETURNING id_client, nom_client',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;