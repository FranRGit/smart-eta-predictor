const predictService = require('../services/predictionsService');


async function predictETA(req, res) {
    const { paradero_id } = req.query;
    if (!paradero_id) return res.status(400).json({ error: 'paradero_id requerido' });

    try {
        const resultados = await predictService.obtenerPrediccionesParaParadero(paradero_id);
        res.json(resultados);
        console.log(resultados)
    } catch (error) {
        console.error('[Predicciones] Error:', error.message);
        res.status(500).json({ error: 'Error al calcular predicciones' });
    }
}

module.exports = {
    predictETA
}