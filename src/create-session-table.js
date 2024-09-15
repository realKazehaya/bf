const { Pool } = require('pg');

const pool = new Pool({
  user: 'ffd',
  host: 'dpg-crj2qtm8ii6s73fc2qfg-a', 
  database: 'ffd',
  password: 'hiEd0L615EAPNhsvZPNjSjtv8dbd3tHV',
  port: 5432,
  ssl: false // Desactiva SSL para la configuración local
});

const createSessionTable = async () => {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid varchar NOT NULL,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      );
    `);
    client.release();
    console.log('Session table created');
  } catch (err) {
    console.error('Error creating session table:', err);
  }
};

createSessionTable();
