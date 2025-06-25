// Import d'Express et création d'un routeur Express
import express from 'express';
const router = express.Router();

// Import de la connexion à la base de données (db.js)
import db from '../../db.js';

/**
 * Fonction de validation des données du client
 * Vérifie si tous les champs obligatoires sont présents et valides
 */
const validateClientData = (data) => {
  const errors = [];
  // Nom est requis
  if (!data.nom_client?.trim()) errors.push('Le nom est requis');
  // Prénom est requis
  if (!data.prenom?.trim()) errors.push('Le prénom est requis');
  // Email est requis et doit être au format valide
  if (!data.email?.trim()) errors.push('Email est requis');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email invalide');
  // Statut est requis
  if (!data.statut?.trim()) errors.push('Statut est requis');
  return errors; // Retourne un tableau d'erreurs s'il y en a
};

/**
 * Route GET /stats : Récupère des statistiques sur les clients
 */
router.get('/stats', async (req, res) => {
  try {
    // Requêtes SQL pour compter les clients actifs, inactifs et le total
    const activeQuery = `SELECT COUNT(*) FROM client WHERE statut = 'active'`;
    const inactiveQuery = `SELECT COUNT(*) FROM client WHERE statut = 'inactive'`;
    const totalQuery = `SELECT COUNT(*) FROM client`;

    // Exécution parallèle des requêtes avec Promise.all()
    const [activeResult, inactiveResult, totalResult] = await Promise.all([
      db.query(activeQuery),
      db.query(inactiveQuery),
      db.query(totalQuery)
    ]);

    // Conversion des résultats en nombres entiers
    const active = parseInt(activeResult.rows[0].count);
    const inactive = parseInt(inactiveResult.rows[0].count);
    const total = parseInt(totalResult.rows[0].count);

    // Calcul d'une tendance approximative par minute (sur 60 minutes)
    const activePerMinute = Math.round((active / 60) * 100) / 100;
    const inactivePerMinute = Math.round((inactive / 60) * 100) / 100;
    const totalPerMinute = Math.round((total / 60) * 100) / 100;

    // Réponse JSON avec les statistiques calculées
    res.json({
      success: true,
      data: {
        active,
        inactive,
        total,
        activePerMinute,
        inactivePerMinute,
        totalPerMinute
      }
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Route POST / : Création d'un nouveau client
 */
router.post('/', async (req, res) => {
  // Validation des données envoyées
  const errors = validateClientData(req.body);
  if (errors.length > 0) return res.status(400).json({ success: false, errors });

  try {
    // Extraction des données du corps de la requête
    const { nom_client, prenom, email, statut } = req.body;

    // Insertion du client dans la base de données
    const result = await db.query(
      `INSERT INTO client (nom_client, prenom, email, statut) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_client, nom_client, prenom, email, statut`,
      [nom_client, prenom, email, statut]
    );

    // Réponse avec le client inséré
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Route GET / : Liste tous les clients avec pagination, filtres et tri
 */
router.get('/', async (req, res) => {
  try {
    // Extraction des paramètres de requête
    const { search, statut, page = 1, limit = 5, sort = 'nom_client-asc' } = req.query;
    const offset = (page - 1) * limit; // Calcul de l'offset pour la pagination

    let baseQuery = `FROM client`;
    const filters = []; // Tableau pour stocker les conditions WHERE
    const params = [];  // Paramètres pour les requêtes SQL

    // Ajout d'un filtre de recherche (recherche globale)
    if (search) {
      filters.push(`(nom_client ILIKE $${params.length + 1} OR prenom ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    // Filtre par statut
    if (statut && statut !== 'all') {
      filters.push(`statut = $${params.length + 1}`);
      params.push(statut);
    }

    // Si des filtres existent, on les ajoute à la requête
    if (filters.length > 0) {
      baseQuery += ` WHERE ` + filters.join(' AND ');
    }

    // Gestion du tri (champ et ordre)
    const [sortField, sortOrder] = sort.split('-');
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    // Construction des requêtes finale (données paginées et comptage total)
    const dataQuery = `SELECT id_client, nom_client, prenom, email, statut ${baseQuery} ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;

    // Exécution parallèle des deux requêtes
    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);

    // Réponse avec les données et les informations de pagination
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

/**
 * Route GET /:id : Récupère un client spécifique par son ID
 */
router.get('/:id', async (req, res) => {
  try {
    // Requête SQL pour récupérer un client
    const result = await db.query(
      `SELECT id_client, nom_client, prenom, email, statut FROM client WHERE id_client = $1`,
      [req.params.id]
    );

    // Si aucun client n'est trouvé, renvoyer une erreur 404
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    // Sinon, renvoyer le client trouvé
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Route PUT /:id : Met à jour un client existant
 */
router.put('/:id', async (req, res) => {
  // Valider les données reçues
  const errors = validateClientData(req.body);
  if (errors.length > 0) return res.status(400).json({ success: false, errors });

  try {
    // Extraction des données du corps de la requête
    const { nom_client, prenom, email, statut } = req.body;

    // Mise à jour du client dans la base de données
    const result = await db.query(
      `UPDATE client SET nom_client = $1, prenom = $2, email = $3, statut = $4 WHERE id_client = $5 RETURNING *`,
      [nom_client, prenom, email, statut, req.params.id]
    );

    // Si aucun client n'est trouvé après mise à jour, erreur 404
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    // Renvoyer le client mis à jour
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Route DELETE /:id : Supprime un client par son ID
 */
router.delete('/:id', async (req, res) => {
  try {
    // Requête SQL pour supprimer un client et retourner ses données
    const result = await db.query(
      'DELETE FROM client WHERE id_client = $1 RETURNING id_client, nom_client',
      [req.params.id]
    );

    // Si aucun client n'a été supprimé, erreur 404
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    // Sinon, renvoyer les données du client supprimé
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Export du routeur configuré
export default router;