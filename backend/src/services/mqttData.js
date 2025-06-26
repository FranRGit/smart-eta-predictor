const firestoreService = require('./firestoreService'); 
const { db, admin } = require('../config/firebaseConfig');

async function procesarMensajeMQTT(data) {
    const {
        nombre,       
        paradero,  
        day,
        month,
        year,
        hour,
        minute,
        second
    } = data;

    const busid = nombre;
    const paraderoid = paradero;

    try {
        if (!busid || !paraderoid) {
            throw new Error(`Datos incompletos del mensaje MQTT. busid: ${busid}, paraderoid: ${paraderoid}`);
        }

        const busRef = db.collection('buses').doc(busid);
        const paraderoRef = db.collection('paradero').doc(paraderoid);

        const busSnap = await busRef.get();
        if (!busSnap.exists) throw new Error('Bus no encontrado');

        const busData = busSnap.data();
        const rutaRef = busData.ruta;
        const rutaSnap = await rutaRef.get();
        if (!rutaSnap.exists) throw new Error('Ruta del bus no encontrada');

        const fechaLlegada = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        const docData = {
            bus_id: busid,
            paradero_id: paraderoid,
            ruta_id: rutaRef.id,
            tiempo_llegada: fechaLlegada.toISOString(),
            clima: "", 
            dia: "",
            hora_pico: false,
            latitud: null, //OJO
            longitud: null, //OJO
            tipo_dia: ""
        };

        const docRef = await firestoreService.saveBusArrival("buses-arrivals", docData);
        console.log(`[MQTT] Datos guardados en Firebase con ID: ${docRef.id}`);
        
    } catch (error) {
        console.error('[MQTT] Error al guardar datos:', error.message);
    }
}

async function procesarUbicacionMQTT(data) {
    const {
        nombre,
        latitud,
        longitud,
        day,
        month,
        year,
        hour,
        minute,
        second
    } = data;

    const busid = nombre;

    try {
        if (!busid || latitud === undefined || longitud === undefined) {
            throw new Error(`Datos incompletos del mensaje MQTT. busid: ${busid}, lat: ${latitud}, lon: ${longitud}`);
        }

        const fechaUbicacion = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        const docData = {
            bus_id: busid,
            latitud,
            longitud,
            tiempo_ubicacion: fechaUbicacion.toISOString()
        };

        const docRef = await firestoreService.updateBusLocation("bus-locations", docData);
        console.log(`[MQTT] Ubicación guardada en Firebase con ID: ${docRef.id}`);

    } catch (error) {
        console.error('[MQTT] Error al guardar ubicación:', error.message);
    }
}


module.exports = { procesarMensajeMQTT, procesarUbicacionMQTT };
