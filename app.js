const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { Client } = require('pg');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const dotenv = require('dotenv');
const path = require('path');
const ejs = require('ejs');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize Redis client
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Initialize database
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255),
      email VARCHAR(255),
      description TEXT,
      social_links JSONB,
      views INT DEFAULT 0,
      badges TEXT[] DEFAULT '{}',
      presence VARCHAR(255),
      custom_username VARCHAR(255) UNIQUE,
      discord_id VARCHAR(255) UNIQUE
    );
  `;
  try {
    await client.query(createTableQuery);
    console.log('Database schema initialized.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
  }
};

// Connect to PostgreSQL and initialize the database
client.connect().then(() => initializeDatabase()).catch(err => console.error('Database connection error:', err));

// Passport setup
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/discord/callback`,
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
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
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  try {
    const userRes = await client.query('SELECT custom_username FROM users WHERE id = $1', [req.user.id]);
    const customUsername = userRes.rows[0]?.custom_username;
    if (!customUsername) {
      return res.redirect('/choose-username');
    } else {
      return res.redirect(`/profile/${customUsername}`);
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/login', passport.authenticate('discord'));

app.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), async (req, res) => {
  try {
    const userRes = await client.query('SELECT custom_username FROM users WHERE id = $1', [req.user.id]);
    const customUsername = userRes.rows[0]?.custom_username;
    if (!customUsername) {
      return res.redirect('/choose-username');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/choose-username', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('choose-username', { error: null });
});

app.post('/choose-username', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  const { customUsername } = req.body;
  try {
    const existingUser = await client.query('SELECT * FROM users WHERE custom_username = $1', [customUsername]);
    if (existingUser.rows.length > 0) {
      return res.render('choose-username', { error: 'Username already taken' });
    }
    await client.query('UPDATE users SET custom_username = $1 WHERE id = $2', [customUsername, req.user.id]);
    return res.redirect('/');
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/profile/:username', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
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
});

app.get('/settings', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('settings', { user: req.user });
});

app.post('/settings', async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
