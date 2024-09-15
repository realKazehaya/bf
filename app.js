const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session'); // Para el manejo de sesiones
const app = express();
const port = process.env.PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');

// Configuración de body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de la sesión
app.use(session({
  secret: 'secret-key', // Cambia esto por una clave segura
  resave: false,
  saveUninitialized: true
}));

// Base de datos SQLite
const db = new sqlite3.Database('./db/database.db', (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos", err);
  } else {
    console.log("Conectado a la base de datos SQLite.");
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freefire_id TEXT UNIQUE,
      diamonds INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS withdraws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freefire_id TEXT,
      region TEXT,
      amount INTEGER,
      status TEXT DEFAULT 'pendiente',
      date TEXT,
      transaction_id TEXT
    )`);
  }
});

// Ruta de inicio de sesión (GET)
app.get('/login', (req, res) => {
  res.render('login');
});

// Manejo del formulario de inicio de sesión (POST)
app.post('/login', (req, res) => {
  const freefire_id = req.body.freefire_id;

  // Verifica si el usuario ya existe
  db.get('SELECT * FROM users WHERE freefire_id = ?', [freefire_id], (err, user) => {
    if (user) {
      // Si existe, iniciar sesión
      req.session.user = user; // Guarda el usuario en la sesión
      res.redirect(`/profile/${user.id}`);
    } else {
      // Si no existe, crear un nuevo usuario
      db.run('INSERT INTO users (freefire_id) VALUES (?)', [freefire_id], function(err) {
        if (err) {
          res.status(500).send("Error al crear el usuario");
        } else {
          req.session.user = { id: this.lastID, freefire_id: freefire_id }; // Guarda el nuevo usuario en la sesión
          res.redirect(`/profile/${this.lastID}`);
        }
      });
    }
  });
});

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Ruta de perfil del usuario (GET) - Protegida
app.get('/profile/:id', isAuthenticated, (req, res) => {
  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      res.status(500).send("Error al recuperar el perfil del usuario");
    } else {
      db.all('SELECT * FROM withdraws WHERE freefire_id = ?', [user.freefire_id], (err, withdraws) => {
        res.render('profile', { user, withdraws });
      });
    }
  });
});

// Ruta de seguimiento en redes sociales
app.post('/follow-social', isAuthenticated, (req, res) => {
  const { freefire_id, social } = req.body;
  db.get('SELECT diamonds FROM users WHERE freefire_id = ?', [freefire_id], (err, user) => {
    if (user) {
      const newDiamonds = user.diamonds + 10;
      db.run('UPDATE users SET diamonds = ? WHERE freefire_id = ?', [newDiamonds, freefire_id], (err) => {
        if (err) {
          res.status(500).send("Error al actualizar los diamantes");
        } else {
          res.redirect(`/profile/${user.id}`);
        }
      });
    } else {
      res.status(400).send("Usuario no encontrado");
    }
  });
});

// Ruta de solicitud de retiro de diamantes (GET)
app.get('/withdraw', isAuthenticated, (req, res) => {
  res.render('withdraw');
});

// Manejo del formulario de retiro (POST)
app.post('/withdraw', isAuthenticated, (req, res) => {
  const { freefire_id, region, amount, transaction_id } = req.body;
  const date = new Date().toLocaleDateString();
  db.run(`INSERT INTO withdraws (freefire_id, region, amount, date, transaction_id) VALUES (?, ?, ?, ?, ?)`, 
    [freefire_id, region, amount, date, transaction_id], (err) => {
      if (err) {
        res.status(500).send("Error al procesar el retiro");
      } else {
        // Llama a la función para enviar la notificación a Discord
        require('./bot').notifyWithdraw(freefire_id, region, amount, date, transaction_id);
        res.redirect(`/profile/${req.session.user.id}`);
      }
    });
});

// Ruta de encuestas
app.get('/surveys', (req, res) => {
  res.render('surveys');
});

// Ruta de preguntas frecuentes
app.get('/faq', (req, res) => {
  res.render('faq');
});

// Ruta de logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Ruta principal
app.get('/', (req, res) => {
  res.render('index');
});

// Servidor en ejecución
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
