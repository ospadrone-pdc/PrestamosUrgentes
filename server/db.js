const { Pool } = require('pg');
require('dotenv').config();

// En la nube (Render/Supabase/Railway), usamos DATABASE_URL.
// En local, podemos seguir usando variables individuales o una URL.
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER || 'localhost'}:5432/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const poolPromise = pool.connect()
    .then(client => {
        console.log('Conectado a PostgreSQL');
        client.release();
        return pool;
    })
    .catch(err => {
        console.error('Error de conexión a PostgreSQL: ', err.message);
        return null;
    });

module.exports = {
    pool,
    poolPromise
};
