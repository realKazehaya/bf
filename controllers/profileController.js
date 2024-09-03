const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect();

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { rows } = await client.query('SELECT * FROM users WHERE custom_username = $1', [username]);
    if (rows.length === 0) {
      return res.status(404).send('Profile not found');
    }
    const user = rows[0];
    await client.query('UPDATE users SET views = views + 1 WHERE custom_username = $1', [username]);
    return res.render('profile', { user });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
};
