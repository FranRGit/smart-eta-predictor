// src/app.js
require('dotenv').config({path: '../../.env'}); // Cargar variables de entorno al inicio
const express = require('express');
const bodyParser = require('body-parser');
const { startMqttClient } = require('./services/mqttClienteService');
const dataRoutes = require('./routes/dataRoutes');

// Asegurar que Firebase se inicialice al inicio
require('./config/firebaseConfig');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json()); // Para parsear cuerpos JSON en peticiones HTTP
app.use(bodyParser.urlencoded({ extended: true })); // Para parsear URLs codificadas

// Rutas
app.use('/data', dataRoutes); // Prefijo /data para las rutas de datos

app.get('/', (req, res) => {
  res.send('Backend del sistema de telemetría de buses en funcionamiento. Visita /data/export-dataset para generar el CSV.');
});

// Iniciar el cliente MQTT
startMqttClient();

// Iniciar el servidor Express
app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
  console.log(`Accede a http://localhost:${port}/data/export-dataset para descargar el CSV.`);
});