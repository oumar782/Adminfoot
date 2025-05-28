import express from 'express';
import db from './db.js';
// import bcrypt from 'bcrypt'; // si tu veux hasher les mots de passe

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, motdepasse } = req.body;

    if (!email || !motdepasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont requis'
      });
    }

    const result = await db.query(
      `SELECT * FROM utilisateur WHERE email = $1 AND motdepasse = $2`,
      [email, motdepasse]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    const user = result.rows[0];

    // Si mot de passe haché :
    // const isMatch = await bcrypt.compare(motdepasse, user.motdepasse);
    // if (!isMatch) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Mot de passe incorrect'
    //   });
    // }

    res.json({
      success: true,
      message: 'Connexion réussie',
      user
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification'
    });
  }
});

export default router;
