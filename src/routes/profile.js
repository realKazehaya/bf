const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Ruta para mostrar el perfil
router.get('/profile', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findByPk(userId);
    const withdrawals = await Withdrawal.findAll({ where: { userId } });
    res.render('profile', { user, withdrawals });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
