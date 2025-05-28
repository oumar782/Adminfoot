import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './connexion.js';
import demons from './Gestionnaire/Demonstration/demonstration.js';

dotenv.config();

const app = express();

// ✅ Origines autorisées pour le frontend (dev + prod)
const allowedOrigins = [
  'https://foot-admin-suite.vercel.app', // prod
  'http://localhost:5173'                // dev local
];

// ✅ Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS bloqué : ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Log simple pour chaque requête
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Routes principales
app.use('/api/auth', (req, res, next) => {
  console.log('➡️ Accès à /api/auth');
  next();
}, authRoutes);

app.use('/api/demonstrations', (req, res, next) => {
  console.log('➡️ Accès à /api/demonstrations');
  next();
}, demons);

// ✅ Route de test (optionnelle)
app.get('/', (req, res) => {
  res.send("🚀 API Foot Admin Suite opérationnelle");
});

// ✅ Gestion d’erreurs globale
app.use((err, req, res, next) => {
  console.error('❌ Erreur attrapée :', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// ✅ Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur backend en marche : http://localhost:${PORT}`);
});
