const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ruta para la página principal
router.get('/', (req, res) => {
  // Redirigir al formulario de inicio de sesión
  res.redirect('/login');
});

// Ruta para mostrar el formulario de inicio de sesión
router.get('/login', (req, res) => {
  res.render('login'); // Asegúrate de tener login.ejs en tu carpeta views
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
    return res.redirect('/login'); // Si no hay sesión, redirige a login
  }

  try {
    const user = await User.findByPk(userId); // Busca el usuario por su ID
    res.render('profile', { user }); // Asegúrate de tener profile.ejs en views
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).send('Error en el servidor');
    }
    res.redirect('/login'); // Redirige a la página de inicio de sesión
  });
});

module.exports = router;
