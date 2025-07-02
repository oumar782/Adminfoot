import express from 'express';
const router = express.Router();
import db from '../../db.js';

// Validation des données
const validateReservationData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.hasOwnProperty('formule')) {
    const validFormules = ['Starter', 'Pro', 'Enterprise'];
    if (!data.formule || !validFormules.includes(data.formule)) {
      errors.push(`Formule invalide. Options: ${validFormules.join(', ')}`);
    }
  }

  if (!isUpdate || data.hasOwnProperty('nom_complet')) {
    if (!data.nom_complet || data.nom_complet.trim().length < 2) {
      errors.push('Le nom complet doit contenir au moins 2 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('entreprise')) {
    if (!data.entreprise || data.entreprise.trim().length < 2) {
      errors.push('Le nom de l\'entreprise doit contenir au moins 2 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('prix')) {
    if (!data.prix || isNaN(parseFloat(data.prix)) || parseFloat(data.prix) < 0) {
      errors.push('Le prix doit être un nombre positif valide');
    }
  }

  if (!isUpdate || data.hasOwnProperty('prix_perso')) {
    if (!data.prix_perso || isNaN(parseFloat(data.prix_perso)) || parseFloat(data.prix_perso) < 0) {
      errors.push('Le prix personnalisé doit être un nombre positif valide');
    }
  }

  if (!isUpdate || data.hasOwnProperty('date')) {
    if (!data.date || isNaN(new Date(data.date).getTime())) {
      errors.push('Date invalide');
    }
  }

  if (!isUpdate || data.hasOwnProperty('statut')) {
    const validStatuts = ['signé', 'perdu', 'en_attente'];
    if (!data.statut || !validStatuts.includes(data.statut)) {
      errors.push(`Statut invalide. Options: ${validStatuts.join(', ')}`);
    }
  }

  return errors;
};

// CREATE
router.post('/', async (req, res) => {
  try {
    const errors = validateReservationData(req.body);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const {
      formule,
      prix,
      prix_perso,
      nom_complet,
      entreprise,
      type_perso = [],
      fonctionnalite = [],
      email,
      date,
      statut
    } = req.body;

    // Calcul du total
    const total = (parseFloat(prix) || 0) + (parseFloat(prix_perso) || 0);

    const result = await db.query(
      `INSERT INTO reservation 
       (formule, prix, prix_perso, nom_complet, entreprise, type_perso, fonctionnalite, email, total, date, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        formule,
        prix,
        prix_perso,
        nom_complet,
        entreprise,
        JSON.stringify(type_perso),
        JSON.stringify(fonctionnalite),
        email,
        total,
        new Date(date).toISOString(),
        statut
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création',
      error: err.message
    });
  }
});

// READ ALL avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, name, formule, email, statut } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM reservation`;
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (name) {
      whereClauses.push(`nom_complet ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (formule) {
      whereClauses.push(`formule = $${paramIndex}`);
      queryParams.push(formule);
      paramIndex++;
    }

    if (email) {
      whereClauses.push(`email ILIKE $${paramIndex}`);
      queryParams.push(`%${email}%`);
      paramIndex++;
    }

    if (statut) {
      whereClauses.push(`statut = $${paramIndex}`);
      queryParams.push(statut);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ` ORDER BY id_reservation DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Compte total
    let countQuery = 'SELECT COUNT(*) FROM reservation';
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    // Calcul des statistiques
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN formule = 'Starter' THEN 1 END) as starter,
        COUNT(CASE WHEN formule = 'Pro' THEN 1 END) as pro,
        COUNT(CASE WHEN formule = 'Enterprise' THEN 1 END) as enterprise,
        COUNT(CASE WHEN statut = 'signé' THEN 1 END) as signe,
        COUNT(CASE WHEN statut = 'perdu' THEN 1 END) as perdu,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
        COALESCE(SUM(CASE WHEN statut = 'signé' THEN total ELSE 0 END), 0) as chiffre_affaire
      FROM reservation
      ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
    `;
    const statsResult = await db.query(statsQuery, queryParams.slice(0, -2));

    res.status(200).json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération',
      error: err.message
    });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    const result = await db.query(
      `SELECT * FROM reservation WHERE id_reservation = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération',
      error: err.message
    });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    const errors = validateReservationData(req.body, true);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const {
      formule,
      prix,
      prix_perso,
      nom_complet,
      entreprise,
      type_perso,
      fonctionnalite,
      email,
      date,
      statut
    } = req.body;

    // Calcul du total mis à jour
    const total = (parseFloat(prix) || 0) + (parseFloat(prix_perso) || 0);

    const result = await db.query(
      `UPDATE reservation
       SET 
         formule = COALESCE($1, formule),
         prix = COALESCE($2, prix),
         prix_perso = COALESCE($3, prix_perso),
         nom_complet = COALESCE($4, nom_complet),
         entreprise = COALESCE($5, entreprise),
         type_perso = COALESCE($6, type_perso),
         fonctionnalite = COALESCE($7, fonctionnalite),
         email = COALESCE($8, email),
         total = COALESCE($9, total),
         date = COALESCE($10, date),
         statut = COALESCE($11, statut)
       WHERE id_reservation = $12
       RETURNING *`,
      [
        formule,
        prix,
        prix_perso,
        nom_complet,
        entreprise,
        type_perso ? JSON.stringify(type_perso) : null,
        fonctionnalite ? JSON.stringify(fonctionnalite) : null,
        email,
        total,
        date ? new Date(date).toISOString() : null,
        statut,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Réservation mise à jour avec succès',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour',
      error: err.message
    });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    const result = await db.query(
      `DELETE FROM reservation
       WHERE id_reservation = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Réservation supprimée avec succès',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      error: err.message
    });
  }
});

export default router;