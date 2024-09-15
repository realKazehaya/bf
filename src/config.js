// config/config.js

module.exports = {
    development: {
      username: 'ffd',
      password: 'hiEd0L615EAPNhsvZPNjSjtv8dbd3tHV',
      database: 'ffd',
      host: 'dpg-crj2qtm8ii6s73fc2qfg-a.oregon-postgres.render.com',
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Para permitir certificados auto-firmados si es necesario
        }
      }
    },
    // Configuración para otros entornos...
  };
  