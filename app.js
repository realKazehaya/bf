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
      discord_id VARCHAR(255) UNIQUE,
      avatar VARCHAR(255),
      background VARCHAR(255),
      cursor VARCHAR(255),
      audio VARCHAR(255)
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

// Middleware to make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/', authRoutes);
app.use('/profile', profileRoutes);
app.use('/settings', settingsRoutes);
app.use('/upload', uploadRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
