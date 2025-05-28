import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration adaptative qui utilise DATABASE_URL si disponible (pour le cloud)
// ou les variables individuelles si non disponible (pour le local)
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.query('SELECT NOW()')
    .then(() => console.log('✅ Connecté à PostgreSQL'))
    .catch(err => console.error('❌ Erreur de connexion DB:', err));

export default pool;