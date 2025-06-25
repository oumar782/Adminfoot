import express from 'express';
const router = express.Router();
import db from '../../db.js';

// Validation des données de partenariat
const validatePartnershipData = (data, isUpdate = false) => {
  const errors = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isUpdate || data.hasOwnProperty('nom')) {
    if (!data.nom || data.nom.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('type')) {
    const validTypes = ['Sponsoring', 'Collaboration', 'Partenariat stratégique', 'Autre'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push(`Type invalide. Options: ${validTypes.join(', ')}`);
    }
  }

  if (!isUpdate || data.hasOwnProperty('date_debut')) {
    if (!data.date_debut || isNaN(new Date(data.date_debut).getTime())) {
      errors.push('Date de début invalide');
    }
  }

  if (!isUpdate || data.hasOwnProperty('date_fin')) {
    if (!data.date_fin || isNaN(new Date(data.date_fin).getTime())) {
      errors.push('Date de fin invalide');
    } else if (data.date_debut && new Date(data.date_debut) > new Date(data.date_fin)) {
      errors.push('La date de fin doit être après la date de début');
    }
  }

  if (!isUpdate || data.hasOwnProperty('contact')) {
    if (!data.contact || data.contact.trim().length < 3) {
      errors.push('Le contact doit contenir au moins 3 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('statut')) {
    if (!data.statut || !['active', 'inactive'].includes(data.statut)) {
      errors.push('Statut invalide. Doit être "active" ou "inactive"');
    }
  }

  return errors;
};

// Fonction utilitaire pour valider un ID
const isValidId = (id) => {
  if (!id && id !== 0) return false;
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && num <= 2147483647; // INT PostgreSQL max
};

// CREATE
router.post('/', async (req, res) => {
  try {
    const errors = validatePartnershipData(req.body);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const { nom, type, date_debut, date_fin, contact, statut } = req.body;

    const formattedDateDebut = new Date(date_debut).toISOString();
    const formattedDateFin = new Date(date_fin).toISOString();

    const result = await db.query(
      `INSERT INTO partenariat 
       (nom, type, date_debut, date_fin, contact, statut) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [nom, type, formattedDateDebut, formattedDateFin, contact, statut]
    );

    res.status(201).json({
      success: true,
      message: 'Partenariat créé avec succès',
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

// GET Statistics - Cette route doit être placée avant les routes paramétrées
router.get('/statsp', async (req, res) => {
  try {
    const [activeResult, inactiveResult, totalResult] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'active'`),
      db.query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'inactive'`),
      db.query(`SELECT COUNT(*) FROM partenariat`)
    ]);

    const active = parseInt(activeResult.rows[0].count);
    const inactive = parseInt(inactiveResult.rows[0].count);
    const total = parseInt(totalResult.rows[0].count);

    res.json({
      success: true,
      data: {
        active,
        inactive,
        total,
        activePercentage: Math.round((active / total) * 100) || 0,
        inactivePercentage: Math.round((inactive / total) * 100) || 0
      }
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
});

// READ ALL with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, name, type, status } = req.query;
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres de pagination invalides. Page doit être ≥ 1 et limite entre 1 et 100'
      });
    }

    let query = `SELECT * FROM partenariat`;
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (name) {
      whereClauses.push(`nom ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (type) {
      whereClauses.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`statut = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ` ORDER BY id_partenariat DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    const countResult = await db.query(
      `SELECT COUNT(*) FROM partenariat ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}`,
      queryParams.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].count);

    const formattedResults = result.rows.map(row => ({
      ...row,
      date_debut: row.date_debut?.toISOString().split('T')[0] || null,
      date_fin: row.date_fin?.toISOString().split('T')[0] || null
    }));

    res.status(200).json({
      success: true,
      data: formattedResults,
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

// GET BY ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partenariat invalide',
        details: {
          raison: 'Doit être un nombre entier positif entre 1 et 2147483647',
          type_reçu: typeof id,
          valeur_reçue: id
        }
      });
    }

    const result = await db.query(
      `SELECT * FROM partenariat WHERE id_partenariat = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucun partenariat trouvé avec l'ID ${id}`
      });
    }

    const formattedData = {
      ...result.rows[0],
      date_debut: result.rows[0].date_debut?.toISOString().split('T')[0] || null,
      date_fin: result.rows[0].date_fin?.toISOString().split('T')[0] || null
    };

    res.status(200).json({
      success: true,
      data: formattedData
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

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partenariat invalide',
        details: {
          raison: 'Doit être un nombre entier positif entre 1 et 2147483647',
          type_reçu: typeof id,
          valeur_reçue: id
        }
      });
    }

    const errors = validatePartnershipData(req.body, true);

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const { nom, type, date_debut, date_fin, contact, statut } = req.body;

    const result = await db.query(
      `UPDATE partenariat 
       SET 
         nom = COALESCE($1, nom),
         type = COALESCE($2, type),
         date_debut = COALESCE($3, date_debut),
         date_fin = COALESCE($4, date_fin),
         contact = COALESCE($5, contact),
         statut = COALESCE($6, statut)
       WHERE id_partenariat = $7
       RETURNING *`,
      [
        nom, 
        type,
        date_debut ? new Date(date_debut).toISOString() : null,
        date_fin ? new Date(date_fin).toISOString() : null,
        contact,
        statut,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucun partenariat trouvé avec l'ID ${id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Partenariat mis à jour avec succès',
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


router.get('/statsp', async (req, res) => {
  try {
      const [activeResult, inactiveResult, totalResult] = await Promise.all([
          query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'active'`),
          query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'inactive'`),
          query(`SELECT COUNT(*) FROM partenariat`)
      ]);

      const active = parseInt(activeResult.rows[0].count);
      const inactive = parseInt(inactiveResult.rows[0].count);
      const total = parseInt(totalResult.rows[0].count);

      res.json({
          success: true,
          data: {
              active,
              inactive,
              total,
              activePercentage: Math.round((active / total) * 100) || 0,
              inactivePercentage: Math.round((inactive / total) * 100) || 0
          }
      });
  } catch (err) {
      console.error('Erreur:', err);
      res.status(500).json({ 
          success: false, 
          message: 'Erreur serveur',
          error: err.message 
      });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partenariat invalide',
        details: {
          raison: 'Doit être un nombre entier positif entre 1 et 2147483647',
          type_reçu: typeof id,
          valeur_reçue: id
        }
      });
    }

    const result = await db.query(
      `DELETE FROM partenariat
       WHERE id_partenariat = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucun partenariat trouvé avec l'ID ${id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Partenariat supprimé avec succès',
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