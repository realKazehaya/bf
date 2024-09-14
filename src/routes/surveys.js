const express = require('express');
const router = express.Router();

// Ruta para mostrar la página de encuestas
router.get('/surveys', (req, res) => {
  res.render('surveys');
});

module.exports = router;
