const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(); // Render gestiona las credenciales de la base de datos a través de variables de entorno

app.use(bodyParser.json());
app.use(express.static('public'));

// Variables de stock
let stock = true;

// Maneja el login del usuario
app.post('/login', async (req, res) => {
  const { ffId, region } = req.body;
  try {
    await pool.query('INSERT INTO users (ffId, region) VALUES ($1, $2) ON CONFLICT (ffId) DO NOTHING', [ffId, region]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener el perfil del usuario
app.get('/profile/:ffId', async (req, res) => {
  const { ffId } = req.params;
  try {
    const userResult = await pool.query('SELECT balance FROM users WHERE ffId = $1', [ffId]);
    const withdrawResult = await pool.query('SELECT * FROM withdraws WHERE ffId = $1', [ffId]);
    res.json({
      balance: userResult.rows[0] ? userResult.rows[0].balance : 0,
      withdraws: withdrawResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
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
  // El cierre de sesión puede ser gestionado del lado del cliente (limpiar localStorage, etc.)
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
