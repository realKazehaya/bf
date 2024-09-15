module.exports = {
    apps: [
      {
        name: 'app', // Nombre del proceso para tu aplicación principal
        script: './app.js', // Ruta al archivo app.js
        watch: true, // Reiniciar automáticamente si hay cambios en los archivos
        env: {
          NODE_ENV: 'production', // Modo de producción
          PORT: 3000 // Puerto en el que se ejecutará app.js
        }
      },
      {
        name: 'bot', // Nombre del proceso para tu bot de Discord
        script: './bot.js', // Ruta al archivo bot.js
        watch: true, // Reiniciar automáticamente si hay cambios en los archivos
        env: {
          NODE_ENV: 'production', // Modo de producción
          DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN // Token del bot de Discord desde las variables de entorno
        }
      }
    ]
  };
  