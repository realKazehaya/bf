const { Client, Intents } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.once('ready', () => {
  console.log('Bot de Discord conectado.');
});

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports.notifyWithdraw = (freefire_id, region, amount, date, transaction_id) => {
  const channelId = '1281796727296495757'; // Reemplaza con tu canal de Discord
  const message = `Nuevo retiro pendiente:\nID: ${freefire_id}\nRegión: ${region}\nCantidad: ${amount}\nFecha: ${date}\nTransacción: ${transaction_id}`;
  
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(message);
  } else {
    console.error('Canal no encontrado.');
  }
};
