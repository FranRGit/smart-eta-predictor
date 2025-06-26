const firestoreService = require('../services/firestoreService'); // Asumo que tienes firestoreService.js


async function busArrival(req, res){

    const telemetryData = datosDePrueba;

    try {
        const docRef = await firestoreService.saveBusArrival("buses-arrivals",telemetryData);
        
        console.log(`[Bus Controller] Datos de telemetría guardados en Firebase con ID: ${docRef.id}`);
        res.status(200).json({ 
            message: 'Datos de prueba enviados y guardados exitosamente', 
            id: docRef.id,
            datosEnviados: telemetryData
        });

    } catch (error) {
        console.error('[Bus Controller] Error al guardar datos de ESP32 en Firebase:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar los datos.' });
    }
}

async function updateBusLocation(req, res){

    const datosDePrueba = {
        BUS_ID: "BUS001",
        Ruta_ID: "RUTA001", 
        Tiempo_llegada: "2025-06-19T15:30:00.000Z",
        Latitud: -12.0464,
        Longitud: -77.0428,
    }
    
    const telemetryData = datosDePrueba;
    
    try {
        const docRef = await firestoreService.updateBusLocation("bus-locations",telemetryData);
        
        console.log(`[Bus Controller] Datos de telemetría guardados en Firebase con ID: ${docRef.id}`);
        res.status(200).json({ 
            message: 'Datos de prueba enviados y guardados exitosamente', 
            id: docRef.id,
            datosEnviados: telemetryData
        });

    } catch (error) {
        console.error('[Bus Controller] Error al guardar datos de ESP32 en Firebase:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar los datos.' });
    }
}

async function getAllBuses(req, res) {
    try {
        const buses = await firestoreService.getAllBuses();
        res.status(200).json({data: buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({message: 'Error getting buses' });
    }
}

async function getBusByID(req, res) {
    const busId = req.params.id;

    try {
        const bus = await firestoreService.getBusByID(busId);

        if (!bus) {
        return res.status(404).json({ message: 'Bus no encontrado' });
        }

        res.status(200).json({data: bus });
    } catch (error) {
        console.error('Error al obtener bus:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addBus(req, res) {
    //Mejorar añadir interfaz o validacion bus
    const { id, name, rutaid } = req.body;

    try {
        const newBus = await firestoreService.addBus({ id, name, rutaid });
        res.status(201).json({ message: 'Bus creado exitosamente', data: newBus });
    } catch (error) {
        console.error('Error al crear bus:', error.message);
        
        if (error.message === 'Ruta no encontrada') {
        return res.status(400).json({ message: 'La ruta especificada no existe' });
        }

        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
module.exports = {
    busArrival,
    updateBusLocation,
    getAllBuses,
    getBusByID,
    addBus
};