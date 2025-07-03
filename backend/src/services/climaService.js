const axios = require('axios');

/**
 * Obtiene el estado del clima desde Open-Meteo y lo convierte a una categoría general.
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 * @returns {string|null} Categoría de clima o null si no aplica
 */
async function obtenerClima(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await axios.get(url);

        const weatherCode = res.data.current.weather_code;
        console.log(weatherCode)
        // Mapeo de códigos Open-Meteo → clima general
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'lluvioso';
        if ([95, 96, 99].includes(weatherCode)) return 'tormenta';
        if ([45, 48].includes(weatherCode)) return 'niebla';
        if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'nevado';
        if ([56, 57].includes(weatherCode)) return 'viento fuerte';

        // No afecta el tráfico
        return "Normal";

        /*
            Climas
            0: Normal
            1: Lluvioso
            2: Tormenta
            3: Niebla
            4: Nevado
            5: Viento Fuerte
        */
    } catch (error) {
        console.error('[ClimaService] Error al obtener clima:', error.message);
        return null;
    }
    }

    module.exports = {
    obtenerClima
};
