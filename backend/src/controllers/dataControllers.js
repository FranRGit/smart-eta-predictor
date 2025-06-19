const { getCollectionData } = require('../services/firestoreService');
const { generateTrajectoriesDataset, convertToCsv } = require('../services/dataProcessingService');
const { getFirestoreDocument } = require('../services/firestoreService'); // Para las distancias

async function exportDataset(req, res) {
    try {
        const rawData = await getCollectionData(process.env.FIRESTORE_RAW_COLLECTION, 'Tiempo_llegada');
        let dataset = await generateTrajectoriesDataset(rawData);

        dataset = dataset.map(record => {
            return record;
        });

        // Definir las columnas del CSV exactamente como en la "ESTRUCTURA DEL DATASET" 
        const columns = [
            'ID',
            'Ruta ID',
            'Paradero Inicial',
            'Tiempo Llegada Inicial',
            'Distancia (km)',
            'Día',
            'Tipo de Día',
            'Hora Pico',
            'Clima',
            'Paradero Final',
            'Tiempo de viaje'
        ];

        const csvString = await convertToCsv(dataset, columns);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bus_telemetry_dataset.csv"');
        res.status(200).send(csvString);
        console.log("[Export] Dataset CSV generado y enviado.");

    } catch (error) {
        console.error("[Export Error] Fallo al exportar el dataset:", error);
        res.status(500).send("Error al generar el dataset CSV.");
    }
}

module.exports = {
    exportDataset
};