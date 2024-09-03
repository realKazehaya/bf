const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController'); // Asegúrate de que la ruta sea correcta

// Rutas para manejar la configuración
router.get('/', (req, res) => {
  res.render('settings', { user: req.user });
});

router.post('/upload', settingsController.uploadAssets);

module.exports = router;
