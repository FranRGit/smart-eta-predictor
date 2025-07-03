const { db } = require('../config/firebaseConfig');
const { COLLECTIONS } = require('../constants/colecctions');
const busController = require('../controllers/bus.controller');
const { esHoraPico, obtenerNombreDia, determinarTipoDia } = require('../utils/tiempo');
const { construirDocData, construirFecha, obtenerReferencias} = require('../utils/helpers');

const { obtenerClima } = require('../services/climaService');

/**
 * Procesa un mensaje MQTT relacionado a la llegada de un bus a un paradero.
 * 
 * Pasos:
 * - Verifica datos mínimos (bus y paradero)
 * - Obtiene la referencia del bus, ruta y paradero
 * - Construye el objeto de fecha/hora
 * - Determina si es hora pico, día de la semana y tipo de día
 * - Consulta el clima en el paradero
 * - Arma y guarda el documento en Firestore
 * 
 * @param {Object} data - Mensaje MQTT con información del evento
 */

async function procesarMensajeMQTT(data) {
    const { nombre: busid, paradero: paraderoid, day, month, year, hour, minute, second } = data;
    console.log(data)
    try {
        if (!busid || !paraderoid) throw new Error(`Datos incompletos`);

        const fecha = construirFecha({ day, month, year, hour, minute, second });
        const fechaStr = fecha.toISOString();

        const { rutaRef, rutaData, paraderoData } = await obtenerReferencias(busid, paraderoid);

        const nombreDia = obtenerNombreDia(fecha);
        const tipo_dia = determinarTipoDia(fecha);
        const hora_pico = esHoraPico(fechaStr, rutaData.hora_pico || []);
        const clima = await obtenerClima(paraderoData.latitud, paraderoData.longitud);

        const docData = {
            bus_id: String(busid),
            paradero_id: String(paraderoid),
            ruta_id: String(rutaRef.id),
            tiempo_llegada: fechaStr,
            clima: clima,
            dia: nombreDia,
            hora_pico: hora_pico,
            latitud: paraderoData.latitud,
            longitud: paraderoData.longitud,
            tipo_dia: tipo_dia
        }
        console.log(docData)
        await busController.busArrival(docData);
        console.log(`[MQTT] Datos guardados.`);

    } catch (error) {
        console.error('[MQTT] Error:', error.message);
    }
}

/**
 * Procesa un mensaje MQTT con información de ubicación en tiempo real de un bus.
 * 
 * Pasos:
 * - Verifica si latitud y longitud están presentes
 * - Construye el objeto de fecha/hora
 * - Arma el documento y actualiza Firestore
 * 
 * @param {Object} data - Mensaje MQTT con ubicación GPS
 */
async function procesarUbicacionMQTT(data) {
    const {
        nombre: busid,
        lat, lon,
        day, month, year,
        hour, minute, second
    } = data;

    if (lat === undefined || lon === undefined) {
        console.error(`[MQTT] Datos incompletos de ubicación: busid: ${busid}, lat: ${lat}, lon: ${lon}`);
        return;
    }

    try {
        const fechaUbicacion = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        const docData = {
            bus_id: String(busid),
            location : {
                lat,
                lon,
                tiempo_ubicacion: fechaUbicacion.toISOString()
            }
        };
        console.log(docData)
        await busController.updateBusLocation(docData);
        console.log(`[MQTT] Ubicación guardada en Firebase.`);
    } catch (error) {
        console.error('[MQTT] Error al guardar ubicación:', error.message);
    }
}


module.exports = {
    procesarMensajeMQTT,
    procesarUbicacionMQTT
};
