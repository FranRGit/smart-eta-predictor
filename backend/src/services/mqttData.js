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
    console.log(data)

    try {
        if (!busid || !paraderoid) {
            throw new Error(`Datos incompletos del mensaje MQTT. busid: ${busid}, paraderoid: ${paraderoid}`);
        }

        const busRef = db.collection('buses').doc(String(busid));
        const paraderoRef = db.collection('paradero').doc(String(paraderoid));

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
            ruta_id: rutaRef.id, //OJO
            tiempo_llegada: fechaLlegada.toISOString(),
            clima: "",  //OJO
            dia: "", //OJO
            hora_pico: false,
            latitud: null, //OJO
            longitud: null, //OJO
            tipo_dia: "" //OJO
        };
        console.log(docData)
        const docRef = await firestoreService.saveBusArrival("buses-arrivals", docData);
        console.log(`[MQTT] Datos guardados en Firebase con ID: ${docRef.id}`);
        
    } catch (error) {
        console.error('[MQTT] Error al guardar datos:', error.message);
    }
}

async function procesarUbicacionMQTT(data) {
    const {
        nombre,
        lat,
        lon,
        day,
        month,
        year,
        hour,
        minute,
        second
    } = data;

    const busid = nombre;
    console.log(data)

    try {
        if (lat === undefined || lon === undefined) {
            throw new Error(`Datos incompletos del mensaje MQTT. busid: ${busid}, lat: ${lat}, lon: ${lon}`);
        }

        const fechaUbicacion = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        const docData = {
            bus_id: busid,
            lat,
            lon,
            tiempo_ubicacion: fechaUbicacion.toISOString()
        };

        console.log(docData)
        const docRef = await firestoreService.updateBusLocation("bus-locations", docData);
        console.log(`[MQTT] Ubicación guardada en Firebase con ID: ${docRef.id}`);

    } catch (error) {
        console.error('[MQTT] Error al guardar ubicación:', error.message);
    }
}


module.exports = { procesarMensajeMQTT, procesarUbicacionMQTT };
