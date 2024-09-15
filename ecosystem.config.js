module.exports = {
    apps: [
      {
        name: 'app',
        script: './app.js',
        env: {
          PORT: 3000
        }
      },
      {
        name: 'bot',
        script: './bot.js',
        env: {
          PORT: 3000
        }
      }
    ]
  };
  