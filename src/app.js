const { Sequelize } = require('sequelize');
const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const withdrawRoutes = require('./routes/withdraw');
const faqRoutes = require('./routes/faq');
const surveysRoutes = require('./routes/surveys');
const User = require('./models/User'); // Importar el modelo User

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos con SSL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Crear un pool de conexiones pg
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar la conexión a la base de datos
sequelize.authenticate()
  .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
  .catch(err => console.error('No se pudo conectar a la base de datos:', err));

// Sincronizar modelos con la base de datos
sequelize.sync({ force: false }) // Cambia a `true` solo si deseas recrear las tablas
  .then(() => console.log('Tablas sincronizadas'))
  .catch(err => console.error('Error al sincronizar tablas:', err));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configuración de sesión con PostgreSQL
const sessionStore = new pgSession({
  pool: pgPool,
  tableName: 'session'
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
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
  res.status(404).render('404');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
