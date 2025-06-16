import express from 'express';
const router = express.Router();
import db from '../../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Optionnel pour l'authentification

// Validation des données
const validateUserData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.hasOwnProperty('nom')) {
    if (!data.nom || data.nom.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Email invalide');
    }
  }

  if (!isUpdate || data.hasOwnProperty('motdepasse')) {
    if (!data.motdepasse || data.motdepasse.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
  }

  if (!isUpdate || data.hasOwnProperty('role')) {
    const validRoles = ['Administrateur', 'Gestionnaire'];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push(`Rôle invalide. Options: ${validRoles.join(', ')}`);
    }
  }

  if (!isUpdate || data.hasOwnProperty('statut')) {
    const validStatus = ['actif', 'inactif', 'suspendu'];
    if (data.statut && !validStatus.includes(data.statut)) {
      errors.push(`Statut invalide. Options: ${validStatus.join(', ')}`);
    }
  }

  return errors;
};

// CREATE - Créer un nouvel utilisateur
router.post('/', async (req, res) => {
  try {
    const errors = validateUserData(req.body);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const { nom, email, motdepasse, role, statut } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await db.query(
      'SELECT * FROM utilisateur WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(motdepasse, 10);

    const result = await db.query(
      `INSERT INTO utilisateur 
       (nom, email, motdepasse, role, statut)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_utilisateur, nom, email, role, statut`,
      [nom, email, hashedPassword, role, statut]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
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

// READ ALL - Liste des utilisateurs avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, nom, email, role, statut } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id_utilisateur, nom, email, role, statut FROM utilisateur`;
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (nom) {
      whereClauses.push(`nom ILIKE $${paramIndex}`);
      queryParams.push(`%${nom}%`);
      paramIndex++;
    }

    if (email) {
      whereClauses.push(`email ILIKE $${paramIndex}`);
      queryParams.push(`%${email}%`);
      paramIndex++;
    }

    if (role) {
      whereClauses.push(`role = $${paramIndex}`);
      queryParams.push(role);
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

    query += ` ORDER BY id_utilisateur DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Compte total
    let countQuery = 'SELECT COUNT(*) FROM utilisateur';
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: result.rows,
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

// READ ONE - Récupérer un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const result = await db.query(
      `SELECT id_utilisateur, nom, email, role, statut 
       FROM utilisateur 
       WHERE id_utilisateur = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
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

// UPDATE - Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const errors = validateUserData(req.body, true);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    const { nom, email, motdepasse, role, statut } = req.body;

    // Vérifier si l'email existe déjà pour un autre utilisateur
    if (email) {
      const existingUser = await db.query(
        'SELECT * FROM utilisateur WHERE email = $1 AND id_utilisateur != $2',
        [email, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Un autre utilisateur avec cet email existe déjà'
        });
      }
    }

    let hashedPassword;
    if (motdepasse) {
      hashedPassword = await bcrypt.hash(motdepasse, 10);
    }

    const result = await db.query(
      `UPDATE utilisateur
       SET 
         nom = COALESCE($1, nom),
         email = COALESCE($2, email),
         motdepasse = COALESCE($3, motdepasse),
         role = COALESCE($4, role),
         statut = COALESCE($5, statut)
       WHERE id_utilisateur = $6
       RETURNING id_utilisateur, nom, email, role, statut`,
      [
        nom,
        email,
        hashedPassword,
        role,
        statut,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
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

// DELETE - Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const result = await db.query(
      `DELETE FROM utilisateur
       WHERE id_utilisateur = $1
       RETURNING id_utilisateur, nom, email, role, statut`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
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

// Optionnel: Endpoint de login
router.post('/login', async (req, res) => {
  try {
    const { email, motdepasse } = req.body;

    if (!email || !motdepasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const result = await db.query(
      'SELECT * FROM utilisateur WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentification échouée'
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(motdepasse, user.motdepasse);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Authentification échouée'
      });
    }

    // Créer un token JWT (optionnel)
    const token = jwt.sign(
      { userId: user.id_utilisateur, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      token,
      user: {
        id_utilisateur: user.id_utilisateur,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification',
      error: err.message
    });
  }
});

export default router;