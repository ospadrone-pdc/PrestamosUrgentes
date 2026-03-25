const { poolPromise } = require('./db');

async function migrate() {
  const pool = await poolPromise;
  if (!pool) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }

  try {
    console.log('Creando tabla valuations con soporte de geolocalización...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS valuations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        propertyid UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        referrerid UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Pending',
        requestedamount DECIMAL(15, 2),
        approvedamount DECIMAL(15, 2),
        centralnotes TEXT,
        photos TEXT, -- JSON string
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creando tabla loaninvestors...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loaninvestors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        loanid UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
        partnerid UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        percentage DECIMAL(5, 2) NOT NULL,
        createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Migración completada con éxito.');
  } catch (err) {
    console.error('Error durante la migración:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
