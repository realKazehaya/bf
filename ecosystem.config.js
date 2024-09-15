module.exports = {
    apps: [
      {
        name: 'app', // Nombre del proceso de tu aplicación
        script: './app.js', // Ruta al archivo principal de tu aplicación
        instances: 1, // Número de instancias para balanceo de carga (puedes ajustar según necesites)
        exec_mode: 'fork', // Modo de ejecución (puede ser 'fork' o 'cluster')
        env: {
          NODE_ENV: 'production', // Entorno de ejecución
          PORT: process.env.PORT || 3000, // Puerto en el que se ejecutará la aplicación
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
      {
        name: 'bot', // Nombre del proceso de tu bot
        script: './bot.js', // Ruta al archivo principal de tu bot
        instances: 1, // Número de instancias para el bot (ajustar según necesidad)
        exec_mode: 'fork', // Modo de ejecución
        env: {
          NODE_ENV: 'production',
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  