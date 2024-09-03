const path = require('path');
const multer = require('multer');

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Carpeta para guardar los archivos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con timestamp
  }
});

const upload = multer({ storage });

// Función para manejar la carga de archivos
exports.uploadAssets = (req, res) => {
  upload.fields([
    { name: 'background', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'cursor', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(500).send('Error uploading files');
    }

    // Manejo adicional si es necesario
    res.send('Files uploaded successfully');
  });
};
