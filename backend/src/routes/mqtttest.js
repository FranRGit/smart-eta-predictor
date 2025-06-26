    const express = require('express');
    const router = express.Router();
    const { getClient } = require('../services/mqttService');
    router.get('/test-mqtt', (req, res) => {
    const client = getClient();

    if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT no conectado' });
    }

    const testData = {
        nombre: "B-001",
        paradero: "P-001",
        day: 19,
        month: 6,
        year: 2025,
        hour: 15,
        minute: 30,
        second: 0
    };

    client.publish(process.env.MQTT_TOPIC2, JSON.stringify(testData), {}, (err) => {
        if (err) {
        console.error('❌ Error al publicar en MQTT:', err.message);
        return res.status(500).json({ message: 'Error al publicar' });
        }

        console.log('✅ Mensaje MQTT de prueba enviado');
        res.status(200).json({ message: 'Mensaje MQTT enviado con éxito', data: testData });
    });
    });

router.get('/test-mqtt-ubicacion', (req, res) => {
    const client = getClient();

    if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT no conectado' });
    }

    const testData = {
        nombre: "B-001",
        latitud: -12.0464,
        longitud: -77.0428,
        day: 26,
        month: 6,
        year: 2025,
        hour: 16,
        minute: 45,
        second: 30
    };

    client.publish("bus/ubicacion", JSON.stringify(testData), {}, (err) => {
        if (err) {
            console.error('❌ Error al publicar en MQTT:', err.message);
            return res.status(500).json({ message: 'Error al publicar' });
        }

        console.log('✅ Mensaje MQTT de ubicación enviado');
        res.status(200).json({ message: 'Mensaje MQTT enviado con éxito', data: testData });
    });
});


module.exports = router;
