const { db, admin } = require('../config/firebaseConfig');

async function saveTelemetryData(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add({
            ...data,
            timestamp_recepcion: admin.firestore.FieldValue.serverTimestamp() // Marca de tiempo del servidor
        });
        console.log(`[Firestore] Datos guardados en ${collectionName}. ID: ${docRef.id}`);
        return true;
    } catch (error) {
        console.error(`[Firestore Error] Fallo al guardar en ${collectionName}:`, error);
        return false;
    }
}

async function getCollectionData(collectionName, orderByField = null) {
    try {
        let query = db.collection(collectionName);
        if (orderByField) {
            query = query.orderBy(orderByField);
        }
        const snapshot = await query.get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`[Firestore Error] Fallo al obtener datos de ${collectionName}:`, error);
        return [];
    }
}

async function getFirestoreDocument(collectionName, docId) {
    try {
        const doc = await db.collection(collectionName).doc(docId).get();
        if (doc.exists) {
            return doc.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error(`[Firestore Error] Fallo al obtener documento ${docId} de ${collectionName}:`, error);
        return null;
    }
}

module.exports = {
    saveTelemetryData,
    getCollectionData,
    getFirestoreDocument
};