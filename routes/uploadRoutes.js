const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

router.post('/assets', uploadController.uploadAssets);

module.exports = router;
