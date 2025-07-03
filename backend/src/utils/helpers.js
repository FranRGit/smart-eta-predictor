const { db } = require('../config/firebaseConfig');
const { COLLECTIONS } = require('../constants/colecctions');

/**
 * Obtiene los documentos de bus, ruta y paradero desde Firestore.
 * @param {string|number} busid 
 * @param {string|number} paraderoid 
 * @returns {Object} Referencias y datos de ruta y paradero
 */
async function obtenerReferencias(busid, paraderoid) {
    const busRef = db.collection(COLLECTIONS.BUSES).doc(String(busid));
    const paraderoRef = db.collection(COLLECTIONS.STOPS).doc(String(paraderoid));

    const [busSnap, paraderoSnap] = await Promise.all([
        busRef.get(),
        paraderoRef.get()
    ]);

    if (!busSnap.exists) throw new Error('Bus no encontrado');
    if (!paraderoSnap.exists) throw new Error('Paradero no encontrado');

    const busData = busSnap.data();
    const rutaRef = busData.ruta;
    const rutaSnap = await rutaRef.get();

    if (!rutaSnap.exists) throw new Error('Ruta del bus no encontrada');

    return {
        busRef,
        rutaRef,
        rutaData: rutaSnap.data(),
        paraderoData: paraderoSnap.data()
    };
}

/**
 * Construye el documento final para registrar llegada de un bus.
 * @param {Object} params 
 * @returns {Object} Documento Firestore
 */
function construirDocData({ busid, paraderoid, rutaRef, fechaStr, clima, nombreDia, hora_pico, paraderoData, tipo_dia }) {
    return {
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
    };
}

function construirFecha({ year, month, day, hour, minute, second }) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

module.exports = {
    obtenerReferencias,
    construirDocData,
    construirFecha
}