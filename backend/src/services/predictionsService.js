const { db, admin } = require('../config/firebaseConfig');
const { COLLECTIONS } = require('../constants/colecctions');
const modelController = require("../controllers/modelController")

const CLIMA_MAP = {
    'Normal': 0,
    'Lluvioso': 1,
    'Tormenta': 2,
    'Niebla': 3,
    'Nevado': 4,
    'Viento Fuerte': 5
};

//Obtener predicciones por paradero
async function obtenerPrediccionesParaParadero(paraderoId) {
    const rutasSnap = await db
        .collection(COLLECTIONS.STOPS)
        .doc(paraderoId)
        .collection(COLLECTIONS.ROUTES)
        .get();

    const predicciones = [];

    for (const rutaDoc of rutasSnap.docs) {
        const rutaId = rutaDoc.id;
        const nearbyBus = rutaDoc.data().nearbyBus || [];

        if (nearbyBus.length === 0) continue; // No hay buses cerca

        const bus = nearbyBus[0]; // El más cercano por orden de distancia y tiempo
        const { busId, ultimo_stop, tiempo_llegada } = bus;

        // Buscar último arribo desde colección optimizada
        const lastArrivalId = `${busId}_${ultimo_stop}`;
        const llegadaSnap = await db.collection('bus-last-arrival').doc(lastArrivalId).get();

        if (!llegadaSnap.exists) continue;

        const llegadaData = llegadaSnap.data();
        const climaCodificado = CLIMA_MAP[llegadaData.clima] ?? 0; // por defecto 0 (Normal) si no existe
        const hora_pico = Number(llegadaData.hora_pico); // true → 1, false → 0
        const llegadaDate = new Date(llegadaData.tiempo_llegada);
        const horaBus = llegadaDate.toTimeString().substring(0, 5);   // "HH:MM"
        const fechaBus = llegadaDate.toISOString().split('T')[0];   
        
        // Llamada a modelo de predicción
        const tiempoEstimado = await modelController.predecir({
            stop_inicio: parseInt(ultimo_stop),
            stop_fin: parseInt(paraderoId),
            time: horaBus,
            date: fechaBus,
            weather: climaCodificado,
            peak: hora_pico
        });

        predicciones.push({
            ruta_id: parseInt(rutaId),
            tiempo_estimado: parseFloat(tiempoEstimado),
            bus_id: parseInt(busId),
            paradero_actual: parseInt(ultimo_stop)
        });
    }

    return predicciones;
}

module.exports = {
    obtenerPrediccionesParaParadero
}