const express = require('express');
const router = express.Router();

// Ruta para mostrar la página de FAQ
router.get('/faq', (req, res) => {
  res.render('faq');
});

module.exports = router;
