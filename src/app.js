const express = require('express');
const session = require('express-session');
const { Sequelize } = require('sequelize');
const path = require('path');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const withdrawRoutes = require('./routes/withdraw');
const faqRoutes = require('./routes/faq');
const surveysRoutes = require('./routes/surveys');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Verifica la conexión a la base de datos
sequelize.authenticate()
  .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
  .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesión
app.use(session({
  secret: 'freefire_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Middleware para procesar el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware estático
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', authRoutes);
app.use('/profile', profileRoutes);
app.use('/withdraw', withdrawRoutes);
app.use('/faq', faqRoutes);
app.use('/surveys', surveysRoutes);

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).render('404'); // Crea una vista 404.ejs si aún no existe
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
