const firestoreService = require('../services/firestoreService');

async function addParadero(req, res) {
    const { id, name,latitud,longitud, rutas } = req.body;

    if (!id || !name || !latitud || !longitud || !Array.isArray(rutas) || rutas.length === 0) {
        return res.status(400).json({
        message: 'Faltan campos requeridos: id, name y rutas[]'
        });
    }

    try {
        const nuevoParadero = await firestoreService.addParadero({ id, name, latitud, longitud, rutas });
        res.status(201).json({ message: 'Paradero creado correctamente', data: nuevoParadero });
    } catch (error) {
        console.error('Error al crear paradero:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

async function getAllParaderos(req, res) {
    try {
        const paraderos = await firestoreService.getAllParaderos();
        res.status(200).json({data: paraderos });
    } catch (error) {
        console.error('Error fetching paraderos:', error);
        res.status(500).json({message: 'Error getting paraderos' });
    }
}

async function getRutasPorParadero(req, res) {
    const paraderoId = req.params.id;

    try {
        const rutas = await firestoreService.getRutasPorParadero(paraderoId);
        res.status(200).json({ paraderoId, rutas });
    } catch (error) {
        console.error('Error al obtener rutas del paradero:', error.message);

        if (error.message === 'Paradero no encontrado') {
        return res.status(404).json({ message: 'Paradero no encontrado' });
        }

        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

module.exports = {
    addParadero,
    getAllParaderos,
    getRutasPorParadero
};