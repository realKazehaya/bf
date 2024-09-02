const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg'); // Import PostgreSQL client
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
client.connect();

// Passport setup
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/discord/callback`,
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Store user profile in database
    await client.query(
      'INSERT INTO users (id, username, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email',
      [profile.id, profile.username, profile.email]
    );
    return done(null, profile);
  } catch (err) {
    console.error('Database error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  res.redirect(`/profile/${req.user.id}`);
});

app.get('/login', passport.authenticate('discord'));

app.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

app.get('/profile/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  
  try {
    const userId = req.params.id;
    const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) {
      res.status(404).send('Profile not found');
      return;
    }
    const user = rows[0];
    
    // Increment profile views
    await client.query('UPDATE users SET views = views + 1 WHERE id = $1', [userId]);
    
    res.render('profile', { user });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/settings', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  res.render('settings', { user: req.user });
});

app.post('/settings', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }

  const { description, socialLinks } = req.body;
  try {
    await client.query(
      'UPDATE users SET description = $1, social_links = $2 WHERE id = $3',
      [description, socialLinks, req.user.id]
    );
    // Notify about the changes
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: `User ${req.user.username} updated their profile.`
    });
    res.redirect(`/profile/${req.user.id}`);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
