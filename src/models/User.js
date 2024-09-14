const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const User = sequelize.define('User', {
  freefire_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  diamonds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = User;
