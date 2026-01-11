require('dotenv').config();
const express = require('express');
const cors = require('cors');
const lineasRoutes = require('./routes/lineas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/lineas', lineasRoutes);

// Ruta de salud
app.get('/', (req, res) => {
  res.json({
    servicio: 'API de Líneas de Captura',
    version: '1.0.0',
    estado: 'activo',
    endpoints: {
      generar: 'POST /api/lineas/generar',
      disponibles: 'GET /api/lineas/disponibles',
      validar: 'GET /api/lineas/:codigo/validar',
      usar: 'POST /api/lineas/:codigo/usar',
      consultar: 'GET /api/lineas/:codigo'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🏦 API de Líneas de Captura corriendo en puerto ${PORT}`);
});
