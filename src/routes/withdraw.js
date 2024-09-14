const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');

// Ruta para mostrar el formulario de retiro
router.get('/withdraw', (req, res) => {
  res.render('withdraw');
});

// Ruta para manejar la solicitud de retiro
router.post('/withdraw', async (req, res) => {
  const { region, amount } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/login');
  }

  try {
    const transactionNumber = Math.floor(Math.random() * 1000000).toString();
    await Withdrawal.create({
      userId,
      region,
      amount,
      transactionNumber
    });
    res.redirect('/profile');
  } catch (error) {
    console.error('Error al solicitar retiro:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
