const firestoreService = require('../services/firestoreService'); // Asumo que tienes firestoreService.js


async function addBus(req, res) {
    const { id, name, ruta } = req.body;

    try {
        const newBus = await firestoreService.addBus({ id, name, ruta });
        res.status(201).json({ message: 'Bus creado exitosamente', data: newBus });
    } catch (error) {
        console.error('Error al crear bus:', error.message);
        
        if (error.message === 'Ruta no encontrada') {
        return res.status(400).json({ message: 'La ruta especificada no existe' });
        }

        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
async function busArrival(data){
    try {
        const docRef = await firestoreService.saveBusArrival(data);
        console.log(`[Bus Controller] Datos de telemetría guardados en Firebase con ID: ${docRef.id}`);

    } catch (error) {
        console.error('[Bus Controller] Error al guardar datos de ESP32 en Firebase:', error);
    }
}

async function updateBusLocation(data){
    try {
        const docRef = await firestoreService.updateBusLocation(data);   
        console.log(`[Bus Controller] Datos de telemetría guardados en Firebase con ID: ${docRef.id}`);

    } catch (error) {
        console.error('[Bus Controller] Error al guardar datos de ESP32 en Firebase:', error);
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

module.exports = {
    busArrival,
    updateBusLocation,
    getAllBuses,
    getBusByID,
    addBus
};