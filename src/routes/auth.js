const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ruta para mostrar el formulario de inicio de sesión
router.get('/login', (req, res) => {
  res.render('login');
});

// Ruta para manejar el inicio de sesión
router.post('/login', async (req, res) => {
  const { freefire_id } = req.body;

  try {
    // Busca al usuario en la base de datos
    let user = await User.findOne({ where: { freefire_id } });

    if (!user) {
      // Si el usuario no existe, lo crea
      user = await User.create({ freefire_id });
    }

    // Guarda el ID del usuario en la sesión
    req.session.userId = user.id;
    res.redirect('/profile');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para mostrar el perfil
router.get('/profile', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findByPk(userId);
    res.render('profile', { user });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
