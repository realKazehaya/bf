const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Cambia esto a `true` en producción si usas un certificado válido
    }
  }
});

const createSessionTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    console.log('Tabla "session" creada o ya existe.');
  } catch (error) {
    console.error('Error al crear la tabla de sesiones:', error);
  } finally {
    await sequelize.close();
  }
};

createSessionTable();
