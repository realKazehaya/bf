const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// Load user data
async function loadUserData() {
  try {
    const data = await fs.readJSON(DATA_FILE);
    return data;
  } catch (err) {
    return {};
  }
}

// Save user data
async function saveUserData(users) {
  try {
    await fs.writeJSON(DATA_FILE, users);
  } catch (err) {
    console.error('Error saving user data:', err);
  }
}

// Configure session
app.use(session({
  secret: process.env.FLASK_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport
passport.use(new Strategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/discord/callback`,
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  const users = await loadUserData();
  let user = users[profile.id];
  if (!user) {
    user = {
      discordId: profile.id,
      username: profile.username,
      email: profile.email,
      visits: 0,
      description: '',
      socialLinks: {
        twitter: '',
        facebook: '',
        instagram: ''
      }
    };
    users[profile.id] = user;
    await saveUserData(users);
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.discordId);
});

passport.deserializeUser(async (id, done) => {
  const users = await loadUserData();
  const user = users[id];
  done(null, user);
});

// Middleware to count profile visits
async function countProfileVisits(req, res, next) {
  if (req.isAuthenticated()) {
    const users = await loadUserData();
    const user = users[req.user.discordId];
    if (user) {
      user.visits += 1;
      await saveUserData(users);
    }
  }
  next();
}

// Middleware to send Discord notifications
async function sendDiscordNotification(message) {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content: message });
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

// Routes
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    res.render('index', { user: req.user });
  }
});

app.get('/perfil', countProfileVisits, async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    res.render('perfil', { user: req.user });
  }
});

app.get('/ajustes', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    res.render('ajustes', { user: req.user });
  }
});

app.post('/ajustes', express.urlencoded({ extended: true }), async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    const { description, twitter, facebook, instagram } = req.body;
    const users = await loadUserData();
    const user = users[req.user.discordId];
    if (user) {
      user.description = description;
      user.socialLinks.twitter = twitter;
      user.socialLinks.facebook = facebook;
      user.socialLinks.instagram = instagram;
      await saveUserData(users);

      // Notify Discord channel
      await sendDiscordNotification(`User ${user.username} updated their profile settings.`);
    }
    res.redirect('/ajustes');
  }
});

app.get('/login', (req, res) => {
  res.redirect('/auth/discord');
});

app.get('/auth/discord',
  passport.authenticate('discord'));

app.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// View engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
