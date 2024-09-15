const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const User = sequelize.define('User', {
  freefire_id: {
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
