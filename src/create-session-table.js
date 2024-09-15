const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Crear una instancia del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cambia esto a `true` en producción si usas un certificado válido
  }
});

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, 'create-session-table.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

const createSessionTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Tabla "session" creada o ya existe.');
  } catch (error) {
    console.error('Error al crear la tabla de sesiones:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

createSessionTable();
