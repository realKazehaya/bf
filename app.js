const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Passport
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/discord/callback`,
    scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Middleware
app.use(session({
    secret: process.env.FLASK_SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1279633587494322258/E-cVxbD0uuBBDI1HtbAM2crWXK7ymnilujVwExR5yEHH-IDIMKBhzN-tFLzeE8Xgid6p';

const sendWebhookMessage = (content) => {
    axios.post(DISCORD_WEBHOOK_URL, {
        content: content
    }).catch(err => console.error('Error sending webhook:', err));
};

// Routes
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/discord/login');
    }
    const user = req.user;
    sendWebhookMessage(`User ${user.profile.username} has logged in.`);
    res.render('index.ejs', { user });
});

app.get('/discord/login', passport.authenticate('discord'));

app.get('/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/');
});

app.get('/perfil', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/discord/login');
    }

    const user = req.user;
    const filePath = path.join(__dirname, 'user_profiles.json');
    let profileInfo = {};

    if (fs.existsSync(filePath)) {
        const profiles = fs.readJSONSync(filePath);
        profileInfo = profiles[user.profile.id] || {};
    }

    res.render('perfil.ejs', { user, profileInfo });
});

app.post('/perfil/update', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/discord/login');
    }

    const user = req.user;
    const { description, socialLinks } = req.body;
    const filePath = path.join(__dirname, 'user_profiles.json');
    
    let profiles = {};
    if (fs.existsSync(filePath)) {
        profiles = fs.readJSONSync(filePath);
    }

    if (!profiles[user.profile.id]) {
        profiles[user.profile.id] = {};
    }
    profiles[user.profile.id].description = description;
    profiles[user.profile.id].socialLinks = socialLinks;

    fs.writeJSONSync(filePath, profiles);

    sendWebhookMessage(`User ${user.profile.username} has updated their profile.`);
    
    res.redirect('/perfil');
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
