module.exports = {
    apps: [
      {
        name: 'app',
        script: './app.js',
        watch: true,
        env: {
          NODE_ENV: 'production',
          PORT: 3000
        }
      },
      {
        name: 'bot',
        script: './bot.js',
        watch: true,
        env: {
          NODE_ENV: 'production',
          DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN
        }
      }
    ]
  };
  