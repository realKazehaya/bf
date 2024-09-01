const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

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
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    res.render('index', { user: req.user });
  }
});

app.get('/perfil', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
  } else {
    res.render('perfil', { user: req.user });
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
