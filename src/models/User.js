const { Sequelize, DataTypes } = require('sequelize');

// Configuración de Sequelize con SSL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Cambia esto a `true` en producción si usas un certificado válido
    }
  }
});

const User = sequelize.define('User', {
  freefire_id: { // Cambié el nombre del campo a freefire_id
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  diamonds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = User;
