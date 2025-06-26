
// 1. Cargar variables de entorno
require('dotenv').config({ path: '../../.env' });
require('./config/firebaseConfig'); 

// 2. Dependencias principales
const express = require('express');
const bodyParser = require('body-parser');
const { startMqttClient } = require('./services/mqttService');

// 3. Rutas
const dataRoutes = require('./routes/dataRoutes');
const busRoutes = require('./routes/busRoutes');
const rutaRoutes = require('./routes/rutaRoutes');
const paraderoRoutes = require('./routes/paraderoRoutes');
const mqttTest = require('./routes/mqtttest');

// 4. Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// 5. Middlewares
app.use(bodyParser.json());                           
app.use(bodyParser.urlencoded({ extended: true }));   

// 6. Endpoints
app.get('/', (req, res) => {
  res.send('Backend del sistema de telemetría en funcionamiento.\n\n👉 Visita /data/export-dataset para generar el CSV.');
});
app.use('/data', dataRoutes); 
app.use('/bus', busRoutes); 
app.use('/ruta', rutaRoutes); 
app.use('/paradero', paraderoRoutes); 
app.use('/mqtt', mqttTest); 

// 8. Iniciar servicios
startMqttClient(); 

app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});
