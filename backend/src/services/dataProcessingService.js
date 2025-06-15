const moment = require('moment-timezone');
const { stringify } = require('csv-stringify'); // Para generar CSV

async function generateTrajectoriesDataset(rawData) {
    if (!rawData || rawData.length === 0) {
        console.log("[Processing] No hay datos crudos para procesar.");
        return [];
    }

    const processedRecords = [];
    const groupedByBusAndRoute = rawData.reduce((acc, record) => {
        const key = `<span class="math-inline">\{record\.BUS\_ID\}\_</span>{record.Ruta_ID}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(record);
        return acc;
    }, {});

    for (const key in groupedByBusAndRoute) {
        let group = groupedByBusAndRoute[key];
        group.sort((a, b) => moment(a.Tiempo_llegada).valueOf() - moment(b.Tiempo_llegada).valueOf());

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const startRecord = group[i];
                const endRecord = group[j];

                const startTime = moment(startRecord.Tiempo_llegada);
                const endTime = moment(endRecord.Tiempo_llegada);
                
                if (endTime.isSameOrBefore(startTime)) {
                    console.warn(`[Processing] Trayecto inválido (tiempo final <= tiempo inicial): ${startRecord.Paradero} a ${endRecord.Paradero}`);
                    continue;
                }

                const timeDeltaMinutes = endTime.diff(startTime, 'minutes'); // 

                processedRecords.push({
                    ID: `<span class="math-inline">\{startRecord\.id\}\_</span>{endRecord.id}`, 
                    'Ruta ID': startRecord.Ruta_ID,
                    'Paradero Inicial': startRecord.Paradero,
                    'Tiempo Llegada Inicial': startTime.format('HH:mm'), // Formato HH:mm
                    'Distancia (km)': 'CALCULADA_O_DE_BD', // Esto debe venir de una BD de rutas/paraderos 
                    'Día': startRecord.Dia,
                    'Tipo de Día': startRecord.Tipo_Dia,
                    'Hora Pico': startRecord.Hora_Pico ? 'Sí' : 'No', 
                    'Clima': startRecord.Clima || 'Desconocido', // Opcional 
                    'Paradero Final': endRecord.Paradero,
                    'Tiempo de viaje': timeDeltaMinutes 
                });
            }
        }
    }
    console.log(`[Processing] Generados ${processedRecords.length} registros de dataset.`);
    return processedRecords;
}

async function convertToCsv(data, columns) {
    return new Promise((resolve, reject) => {
        stringify(data, { header: true, columns: columns }, (err, output) => {
            if (err) return reject(err);
            resolve(output);
        });
    });
}

module.exports = {
    generateTrajectoriesDataset,
    convertToCsv
};