const modelService = require('../services/modelService');

async function predecir(data) {
    try {
        const resultado = await modelService.enviarDatosModelo(data);
        return resultado; 
    } catch (error) {
        console.error('Error en controller:', error.message);
        throw new Error('Error al hacer la predicción: ' + error.message);
    }
}

async function predecirPrueba(data){
    console.log(data)
    try {
        const tiempo = Math.floor(Math.random() * 300) + 120; // 2 a 7 min
        return tiempo; // segundos o minutos según definas

    } catch (error) {
        console.error('Error en controller:', error.message);
    }
}
module.exports = {
    predecirPrueba,
    predecir
}