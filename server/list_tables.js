const { poolPromise } = require('./db');

async function listTables() {
  const pool = await poolPromise;
  if (!pool) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }

  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tablas encontradas:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

listTables();
