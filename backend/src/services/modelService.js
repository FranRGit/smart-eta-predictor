require('dotenv').config();
const axios = require('axios');

async function enviarDatosModelo(datos) {
    try {
        const response = await axios.post(`${process.env.API_MODEL}/predecir`, datos);
        return response.data; 
    } catch (error) {
        console.error('Error al llamar a Flask:', error.message);
        throw error;
    }
}


module.exports = { enviarDatosModelo };
