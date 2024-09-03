const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/login', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), async (req, res) => {
  try {
    const userRes = await client.query('SELECT custom_username FROM users WHERE id = $1', [req.user.id]);
    const customUsername = userRes.rows[0]?.custom_username;
    if (customUsername) {
      return res.redirect(`/profile/${customUsername}`);
    } else {
      return res.redirect('/choose-username');
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
