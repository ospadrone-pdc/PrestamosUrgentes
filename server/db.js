const sql = require('mssql');
require('dotenv').config();

const rawServer = process.env.DB_SERVER || 'localhost';
const serverParts = rawServer.split(/\\+/); // Split by one or more backslashes

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: serverParts[0] || 'localhost',
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        instanceName: serverParts[1] // SQL Server Express instance name
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server Express');
        return pool;
    })
    .catch(err => {
        console.error('Error de conexión a la base de datos: ', err.message);
        return null; // Return null so poolPromise resolves to null instead of throwing
    });

module.exports = {
    sql, poolPromise
};
