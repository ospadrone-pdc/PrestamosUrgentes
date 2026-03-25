const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('Error: DATABASE_URL no está definida en el archivo .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false // Requerido para Render/Supabase
        }
    });

    try {
        console.log('Conectando a la base de datos...');
        await client.connect();
        console.log('Conexión exitosa.');

        // El esquema está en la raíz del proyecto, un nivel arriba de /server
        const schemaPath = path.join(__dirname, '..', 'postgresql_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Ejecutando esquema SQL...');
        await client.query(sql);
        console.log('¡Base de datos inicializada con éxito!');

    } catch (err) {
        console.error('Error inicializando la base de datos:', err.message);
    } finally {
        await client.end();
    }
}

initDB();
