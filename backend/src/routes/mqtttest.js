    const express = require('express');
    const router = express.Router();
    const { getClient } = require('../services/mqttService');
    router.get('/test-mqtt', (req, res) => {
    const client = getClient();

    if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT no conectado' });
    }

    const testData = {
        nombre: 1,
        paradero: 1,
        day: 19,
        month: 6,
        year: 2025,
        hour: 17,
        minute: 30,
        second: 0
    };

    client.publish(process.env.MQTT_TOPIC1, JSON.stringify(testData), {}, (err) => {
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
        nombre: 1,
        lat: -12.0464,
        lon: -77.0428,
        day: 26,
        month: 6,
        year: 2025,
        hour: 17,
        minute: 45,
        second: 30
    };

    client.publish(process.env.MQTT_TOPIC2, JSON.stringify(testData), {}, (err) => {
        if (err) {
            console.error('❌ Error al publicar en MQTT:', err.message);
            return res.status(500).json({ message: 'Error al publicar' });
        }

        console.log('✅ Mensaje MQTT de ubicación enviado');
        res.status(200).json({ message: 'Mensaje MQTT enviado con éxito', data: testData });
    });
});


const RUTA_ID = "R-001";
const paraderos = ["1", "2", "3", "4","5"];
const INTERVALO_MS = 5000;

function crearMensaje(busId, paraderoId) {
    const now = new Date();
    return {
        nombre: String(busId),
        paradero: String(paraderoId),
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds()
    };
}


const pasos = [
    { busId: "2", paraderoIndex: 0 }, // BUS 1 → P1
    { busId: "2", paraderoIndex: 1 }, // BUS 1 → P2
    { busId: "2", paraderoIndex: 2 }, // BUS 1 → P3
    { busId: "2", paraderoIndex: 3 }, // BUS 1 → P3
    { busId: "2", paraderoIndex: 4 }, // BUS 1 → P3
];


router.get('/simulacion', (req, res) => {
    const client = getClient();
    if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT no conectado' });
    }

    let pasoActual = 0;

    const intervalId = setInterval(() => {
        if (pasoActual >= pasos.length) {
            clearInterval(intervalId);
            console.log("🏁 Simulación finalizada.");
            return;
        }

        const { busId, paraderoIndex } = pasos[pasoActual];
        const paraderoId = paraderos[paraderoIndex];

        const data = crearMensaje(busId, paraderoId);
        const json = JSON.stringify(data);

        client.publish(process.env.MQTT_TOPIC1, json, {}, (err) => {
            if (err) {
                console.error(`Error MQTT ${busId} → ${paraderoId}:`, err.message);
            } else {
                console.log(`BUS ${busId} llegó a PARADERO ${paraderoId}`);
            }
        });

        pasoActual++;
    }, INTERVALO_MS);

    res.status(200).json({ message: 'Simulación iniciada' });
});


module.exports = router;
