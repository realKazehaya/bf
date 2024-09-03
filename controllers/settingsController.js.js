const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect();

exports.getSettings = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('settings', { user: req.user });
};

exports.updateSettings = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  const { description, socialLinks, discordId } = req.body;

  try {
    let socialLinksObj;
    try {
      socialLinksObj = JSON.parse(socialLinks);
    } catch (error) {
      return res.status(400).send('Invalid social links format');
    }

    await client.query(
      'UPDATE users SET description = $1, social_links = $2, discord_id = $3 WHERE id = $4',
      [description, JSON.stringify(socialLinksObj), discordId, req.user.id]
    );

    return res.redirect(`/profile/${req.user.custom_username || req.user.id}`);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
};
