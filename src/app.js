const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool(); // Render gestiona las credenciales de la base de datos a través de variables de entorno

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-secret', // Usa una variable de entorno para el secreto de la sesión
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambiar a true si usas HTTPS
}));

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Variables de stock
let stock = true;

// Página de inicio
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/profile');
  } else {
    res.render('index');
  }
});

// Maneja el login del usuario
app.post('/login', async (req, res) => {
  const { ffId, region } = req.body;
  try {
    await pool.query('INSERT INTO users (ffId, region) VALUES ($1, $2) ON CONFLICT (ffId) DO NOTHING', [ffId, region]);
    req.session.user = { ffId, region }; // Guarda la sesión
    res.redirect('/profile');
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener el perfil del usuario
app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const { ffId } = req.session.user;
  try {
    const userResult = await pool.query('SELECT balance FROM users WHERE ffId = $1', [ffId]);
    const withdrawResult = await pool.query('SELECT * FROM withdraws WHERE ffId = $1', [ffId]);
    res.render('profile', {
      balance: userResult.rows[0] ? userResult.rows[0].balance : 0,
      withdraws: withdrawResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// Página de encuestas
app.get('/surveys', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('surveys');
});

// Maneja el retiro de diamantes
app.post('/withdraw', async (req, res) => {
  const { ffId, amount } = req.body;
  if (!stock) {
    return res.status(400).json({ success: false, message: 'No hay stock disponible' });
  }

  try {
    await pool.query('INSERT INTO withdraws (ffId, amount, status) VALUES ($1, $2, $3)', [ffId, amount, 'Pendiente']);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al solicitar el retiro' });
  }
});

// Cambia el estado del stock
app.post('/stock', async (req, res) => {
  const { status } = req.body;
  if (status === 'ON' || status === 'OFF') {
    stock = status === 'ON';
    res.json({ success: true, stock });
  } else {
    res.status(400).json({ success: false, message: 'Estado inválido' });
  }
});

// Marca un retiro como pagado
app.post('/payment', async (req, res) => {
  const { ffId, amount } = req.body;
  try {
    await pool.query('UPDATE withdraws SET status = $1 WHERE ffId = $2 AND amount = $3', ['Pagado', ffId, amount]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al marcar el pago' });
  }
});

// Maneja el cierre de sesión
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.redirect('/');
  });
});

// Configurar el servidor para escuchar en el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
