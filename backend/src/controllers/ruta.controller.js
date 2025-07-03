const firestoreService = require('../services/firestoreService'); 

async function addRuta(req, res) {
    const { id, name, hora_pico } = req.body;

    if (!id || !name) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        const newRuta = await firestoreService.addRuta({
            id,
            name,
            hora_pico: hora_pico || [] 
        });

        res.status(201).json({ message: 'Ruta creada exitosamente', data: newRuta });

    } catch (error) {
        console.error('Error al crear ruta:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

async function addParaderos(req, res) {
    const { ruta, paraderos } = req.body;

    if (!ruta || !Array.isArray(paraderos)) {
        return res.status(400).json({ message: 'ruta y paraderos[] son requeridos' });
    }

    try {
        const resultado = await firestoreService.agregarParaderosARuta(ruta, paraderos);
        res.status(200).json({ message: 'Paraderos agregados exitosamente', data: resultado });
    } catch (error) {
        console.error('RUTA CONTROLLER: Error al agregar paraderos:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}


async function getAllRutas(req, res) {
    try {
        const buses = await firestoreService.getAllRutas();
        res.status(200).json({data: buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({message: 'Error getting buses' });
    }
}

module.exports = {
    addRuta,
    getAllRutas,
    addParaderos
};