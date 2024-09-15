const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configura la conexión a la base de datos
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('Conectado a la base de datos.');

    // Leer el archivo SQL
    const sql = fs.readFileSync(path.join(__dirname, 'create-session-table.sql'), 'utf8');

    // Ejecutar el comando SQL
    await client.query(sql);
    console.log('Tabla "session" creada o ya existe.');

  } catch (err) {
    console.error('Error al crear la tabla:', err);
  } finally {
    // Cerrar la conexión a la base de datos
    await client.end();
  }
}

// Ejecutar la función
createTable();
