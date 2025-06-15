require('dotenv').config(); // Cargar variables de entorno
const mqtt = require('mqtt');
const moment = require('moment-timezone'); // Para manejo de fechas
const { saveTelemetryData, getFirestoreDocument } = require('./firestoreService');

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const FIRESTORE_RAW_COLLECTION = process.env.FIRESTORE_RAW_COLLECTION;

let client; // Instancia del cliente MQTT

// Caché para configuraciones que no cambian a menudo
let cachedConfigs = {}; 
const CACHE_EXPIRATION_MINUTES = 60; // Recargar configs cada 60 minutos

async function loadConfigs() {
     const now = moment();
     if (cachedConfigs.lastLoaded && now.diff(cachedConfigs.lastLoaded, 'minutes') < CACHE_EXPIRATION_MINUTES) {
         console.log("[Config] Usando configuración de caché.");
         return;
     }

     console.log("[Config] Cargando configuraciones de Firebase...");
     const [horasPico, tiposDia] = await Promise.all([
         getFirestoreDocument('config', 'horas_pico'),
         getFirestoreDocument('config', 'tipos_dia')
     ]);
     cachedConfigs = {
         horas_pico: horasPico,
         tipos_dia: tiposDia,
         lastLoaded: now
     };
     if (!horasPico || !tiposDia) {
         console.warn("[Config] Advertencia: Configuraciones de horas pico o tipos de día no encontradas en Firestore 'config' colección.");
     }
 }

async function processAndValidateAndEnrichData(payload) {
    try {
        const data = JSON.parse(payload);
    
        if (!data.bus_id || !data.paradero_id || !data.timestamp_gps || data.lat === undefined || data.lon === undefined) {
            console.warn("[Validation] Datos MQTT incompletos o inválidos:", data);
            return null;
        }

        const eventTime = moment.tz(data.timestamp_gps, "YYYY-MM-DD HH:mm:ss", "America/Lima");
        if (!eventTime.isValid()) {
             console.warn("[Validation] Timestamp GPS inválido:", data.timestamp_gps);
             return null;
        }

        const latitud = parseFloat(data.lat);
        const longitud = parseFloat(data.lon);
        if (isNaN(latitud) || isNaN(longitud) || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
            console.warn("[Validation] Latitud o Longitud inválida:", data.lat, data.lon);
            return null;
        }

        await loadConfigs(); 

        const processedRecord = {
            BUS_ID: data.bus_id.toString().trim(),
            Paradero: data.paradero_id.toString().trim(),
            Tiempo_llegada: eventTime.toISOString(), // Almacenar en formato ISO 8601
            Latitud: latitud,
            Longitud: longitud,
            Ruta_ID: data.route_id ? data.route_id.toString().trim() : "DESCONOCIDA",
            Distancia: parseFloat(data.distance || 0), // Asumiendo distancia de ESP32 o 0
            Dia: eventTime.format('dddd'), 
            Hora_Pico: false, 
            Tipo_Dia: "Desconocido", 
            Clima: data.clima ? data.clima.toString().trim() : "Desconocido" // Opcional, si el ESP32 envía
        };
        
        const nowTime = eventTime.format('HH:mm');
        const todayISO = eventTime.format('YYYY-MM-DD');
        const dayOfWeek = eventTime.format('dddd');

        if (cachedConfigs.horas_pico) {
            processedRecord.Hora_Pico = 
                (nowTime >= cachedConfigs.horas_pico.manana_inicio && nowTime <= cachedConfigs.horas_pico.manana_fin) ||
                (nowTime >= cachedConfigs.horas_pico.tarde_inicio && nowTime <= cachedConfigs.horas_pico.tarde_fin);
        }

        if (cachedConfigs.tipos_dia) {
            if (cachedConfigs.tipos_dia.laboral && cachedConfigs.tipos_dia.laboral.includes(dayOfWeek)) {
                processedRecord.Tipo_Dia = "Laboral";
            } else if (cachedConfigs.tipos_dia.fin_semana && cachedConfigs.tipos_dia.fin_semana.includes(dayOfWeek)) {
                processedRecord.Tipo_Dia = "Fin de Semana";
            } else if (cachedConfigs.tipos_dia.feriados && cachedConfigs.tipos_dia.feriados.includes(todayISO)) {
                processedRecord.Tipo_Dia = "Feriado";
            }
        }

        return processedRecord;

    } catch (error) {
        console.error(`[MQTT Process Error] Fallo al procesar payload: ${payload}. Error: ${error.message}`);
        return null;
    }
}

function startMqttClient() {
    if (client && client.connected) {
        console.log("Cliente MQTT ya está conectado.");
        return;
    }

    console.log(`[MQTT] Conectando a MQTT broker: ${MQTT_BROKER_URL}...`);
    client = mqtt.connect(MQTT_BROKER_URL);

    client.on('connect', () => {
        console.log(`[MQTT] Conectado exitosamente al broker: ${MQTT_BROKER_URL}`);
        client.subscribe(MQTT_TOPIC, (err) => {
            if (!err) {
                console.log(`[MQTT] Suscrito al tema: ${MQTT_TOPIC}`);
            } else {
                console.error(`[MQTT Error] Fallo al suscribirse al tema ${MQTT_TOPIC}: ${err}`);
            }
        });
    });

    client.on('message', async (topic, message) => {
        const payload = message.toString();

        const processedData = await processAndValidateAndEnrichData(payload);

        if (processedData) {
            await saveTelemetryData(FIRESTORE_RAW_COLLECTION, processedData); // Envío a Firebase 
        } else {
            console.warn("[MQTT] Mensaje omitido debido a validación o procesamiento fallido.");
        }
    });

    client.on('error', (error) => {
        console.error(`[MQTT Error] Error de conexión o cliente MQTT: ${error.message}`);
    });

    client.on('close', () => {
        console.log('[MQTT] Desconectado del broker MQTT.');
    });

    client.on('offline', () => {
        console.warn('[MQTT] Cliente MQTT se ha desconectado del broker.');
    });

    client.on('reconnect', () => {
        console.info('[MQTT] Intentando reconectar al broker MQTT...');
    });
}

function stopMqttClient() {
    if (client) {
        client.end();
        console.log('[MQTT] Cliente MQTT detenido.');
    }
}

module.exports = {
    startMqttClient,
    stopMqttClient
};