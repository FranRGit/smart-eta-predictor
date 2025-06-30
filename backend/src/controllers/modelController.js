const modelService = require('../services/modelService');

async function predecir(req, res) {
    try {
        const resultado = await modelService.enviarDatosModelo(req.body);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en controller:', error.message);
        res.status(500).json({'Error interno al hacer la predicción': error.message });
    }
};

module.exports = {
    predecir
}