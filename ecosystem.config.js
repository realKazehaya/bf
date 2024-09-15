module.exports = {
    apps: [
      {
        name: 'app',
        script: './app.js',
        env: {
          PORT: 10000
        }
      },
      {
        name: 'bot',
        script: './bot.js',
        env: {
          PORT: 10000
        }
      }
    ]
  };
  