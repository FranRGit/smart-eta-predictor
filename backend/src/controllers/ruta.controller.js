const firestoreService = require('../services/firestoreService'); 

async function addRuta(req, res) {
    //Mejorar añadir interfaz o validacion RUTAS
    const { id, name} = req.body;

    try {
        const newRuta = await firestoreService.addRuta({ id, name });
        res.status(201).json({ message: 'Ruta creada exitosamente', data: newRuta });
    } catch (error) {
        console.error('Error al crear ruta:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}


async function getAllRutas(req, res) {
    try {
        const buses = await firestoreService.getAllBuses();
        res.status(200).json({data: buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({message: 'Error getting buses' });
    }
}

module.exports = {
    addRuta,
    getAllRutas
};