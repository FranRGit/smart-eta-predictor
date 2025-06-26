require('dotenv').config(); 
const { procesarMensajeMQTT, procesarUbicacionMQTT } = require('./mqttData');

const mqtt = require('mqtt');

let client;

function startMqttClient(){
    const options={
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    port: process.env.MQTT_PORT,
    protocol: 'mqtts'
}
    client = mqtt.connect(process.env.MQTT_HOST, options); //Crear cliente

    client.on('connect', () => {
        console.log(`Conectado a HiveMQ broker`)
        client.subscribe(process.env.MQTT_TOPIC1, (err) => {
            if (!err) {
                console.log(`Suscrito al tópico de BUSES: ${process.env.MQTT_TOPIC1}`);
            } else {
                console.error('Error al suscribirse:', err.message);
            }
        })
    })

    
    client.on('connect', () => {
        console.log(`Conectado a HiveMQ broker`)
        client.subscribe(process.env.MQTT_TOPIC2, (err) => {
            if (!err) {
                console.log(`Suscrito al tópico de PARADEROS: ${process.env.MQTT_TOPIC2}`);
            } else {
                console.error('Error al suscribirse:', err.message);
            }
        })
    })

    client.on('message', async (topic, message) => {
        try {
            const data = JSON.parse(message.toString());

            if (topic === 'bus/paradero') {
                await procesarMensajeMQTT(data);
            } else if (topic === 'bus/ubicacion') {
                await procesarUbicacionMQTT(data);
            } else {
                console.warn(`[MQTT] Tema no reconocido: ${topic}`);
            }
        } catch (error) {
            console.error('[MQTT] Error procesando mensaje:', error.message);
        }
    });

    client.on('error', (error) => {
        console.error('Error de conexión MQTT:', error.message);
    });    
}

module.exports = { startMqttClient,
    getClient: () => client };
