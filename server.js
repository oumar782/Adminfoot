import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './connexion.js';
import demons from './Gestionnaire/Demonstration/demonstration.js';
import partenariats from './Gestionnaire/Partenariats/partenariats.js';
import clients from './Gestionnaire/Client/client.js';
import reservation from './Gestionnaire/Reservation/reservation.js';
import ajoutuser from './Gestionnaire/User/AjoutUser.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://foot-admin-suite.vercel.app', 
  'http://localhost:5173',
  'http://localhost:5175'
];

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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/demonstrations', demons);
app.use('/api/partenariats', partenariats);
app.use('/api/client', clients);
app.use('/api/reservation', reservation);
app.use('/api/ajoutuser', ajoutuser);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur backend en marche : http://localhost:${PORT}`);
  console.log(`🔄 Mode: ${process.env.NODE_ENV || 'development'}`);
});