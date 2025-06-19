require('dotenv').config(); 
const mqtt = require('mqtt');

let client;

function startMqttClient(){
    const options={
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    port: process.env.MQTT_PORT,
    protocol: 'mqtts'
}
    const client = mqtt.connect(process.env.MQTT_HOST, options); //Crear cliente

    client.on('connect', () => {
        console.log(`Conectado a HiveMQ broker`)
        client.subscribe(process.env.MQTT_TOPIC, (err) => {
            if (!err) {
                console.log(`Suscrito al tópico: ${process.env.MQTT_TOPIC}`);
            } else {
                console.error('Error al suscribirse:', err.message);
            }
        })
    })

    client.on('message', (topic, message) => {
        console.log(`Dato obtenido de Capa Fisica '${topic}':`);
        console.log(message.toString());
    });

    client.on('error', (error) => {
        console.error('Error de conexión MQTT:', error.message);
    });    
}

module.exports = { startMqttClient };
