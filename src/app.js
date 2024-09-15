const { Sequelize } = require('sequelize');
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg'); // Importa Pool de pg
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const withdrawRoutes = require('./routes/withdraw');
const faqRoutes = require('./routes/faq');
const surveysRoutes = require('./routes/surveys');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos con SSL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Cambia esto a true si tienes un certificado válido en producción
    }
  },
  logging: false
});

// Crear un pool de conexiones pg
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cambia esto a true si tienes un certificado válido en producción
  }
});

// Verifica la conexión a la base de datos
sequelize.authenticate()
  .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
  .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configuración de sesión con PostgreSQL
const sessionStore = new pgSession({
  pool: pgPool, // Usar el pool de conexiones pg
  tableName: 'session' // Nombre de la tabla para almacenar sesiones
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Ajustar según sea necesario
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
  res.status(404).render('404'); // Asegúrate de tener una vista 404.ejs
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
