const express = require('express');
const session = require('express-session');
const { Sequelize } = require('sequelize');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');
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

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', './views');

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
app.use(express.static('public'));

// Rutas
app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/', withdrawRoutes);
app.use('/', faqRoutes);
app.use('/', surveysRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
