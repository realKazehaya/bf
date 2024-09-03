const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const ejs = require('ejs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

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

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

// Function to initialize database schema and add the custom_username column
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
      custom_username VARCHAR(255) UNIQUE
    );
  `;

  const addCustomUsernameColumnQuery = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'custom_username'
      ) THEN
        ALTER TABLE users 
        ADD COLUMN custom_username VARCHAR(255) UNIQUE;
      END IF;
    END $$;
  `;

  try {
    await client.query(createTableQuery);
    console.log('Database schema initialized.');

    await client.query(addCustomUsernameColumnQuery);
    console.log('Column custom_username ensured in users table.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
  }
};

// Connect to PostgreSQL and initialize the database
client.connect().then(() => {
  initializeDatabase();
}).catch(err => {
  console.error('Database connection error:', err);
});

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
    res.redirect('/login');
    return;
  }
  const userRes = await client.query('SELECT custom_username FROM users WHERE id = $1', [req.user.id]);
  const customUsername = userRes.rows[0]?.custom_username;

  if (!customUsername) {
    res.redirect('/choose-username');
  } else {
    res.redirect(`/profile/${customUsername}`);
  }
});

app.get('/login', passport.authenticate('discord'));

app.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), async (req, res) => {
  const userRes = await client.query('SELECT custom_username FROM users WHERE id = $1', [req.user.id]);
  const customUsername = userRes.rows[0]?.custom_username;

  if (!customUsername) {
    res.redirect('/choose-username');
  } else {
    res.redirect('/');
  }
});

app.get('/choose-username', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  res.render('choose-username');
});

app.post('/choose-username', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }

  const { customUsername } = req.body;
  try {
    const existingUser = await client.query('SELECT * FROM users WHERE custom_username = $1', [customUsername]);
    if (existingUser.rows.length > 0) {
      return res.render('choose-username', { error: 'Username already taken' });
    }

    await client.query('UPDATE users SET custom_username = $1 WHERE id = $2', [customUsername, req.user.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/profile/:username', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  
  try {
    const { username } = req.params;
    const { rows } = await client.query('SELECT * FROM users WHERE custom_username = $1', [username]);
    if (rows.length === 0) {
      res.status(404).send('Profile not found');
      return;
    }
    const user = rows[0];
    
    await client.query('UPDATE users SET views = views + 1 WHERE custom_username = $1', [username]);
    
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

  const { description, socialLinks, presence } = req.body;
  try {
    const socialLinksJson = JSON.stringify(socialLinks);

    await client.query(
      'UPDATE users SET description = $1, social_links = $2, presence = $3 WHERE id = $4',
      [description, socialLinksJson, presence, req.user.id]
    );
    
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: `User ${req.user.username} updated their profile.`
    });
    res.redirect(`/profile/${req.user.custom_username || req.user.id}`);
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
