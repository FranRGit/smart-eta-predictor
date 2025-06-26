const { db, admin } = require('../config/firebaseConfig');

//CONSULTAS BUSES
async function getAllBuses() {
    const busesRef = db.collection('buses');
    const snapshot = await busesRef.get();

    if (snapshot.empty) {
        return [];
    }

    const buses = [];
    snapshot.forEach(doc => {
        buses.push({ id: doc.id, ...doc.data() });
    });

    return buses;
}

async function getBusByID(busId) {
    const busesRef = db.collection('buses');
    const querySnapshot = await busesRef.where('id', '==', busId).get();

    if (querySnapshot.empty) {
        return null; 
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };

}

async function addBus(busData) {
    const { id, name, ruta } = busData;

    try {
        const rutaRef = db.collection('rutas').doc(ruta);
        const rutaDoc = await rutaRef.get();

        if (!rutaDoc.exists) {
        throw new Error('Ruta no encontrada');
        }
        const busRef = db.collection('buses').doc(id);
        await busRef.set({
        name,
        ruta: rutaRef 
        });

        return { id, name, ruta};
    } catch (error) {
        throw error;
    }
}

//CONSULTAS RUTAS
async function addRuta(rutaData) {
    const { id, name } = rutaData;

    try {
        const rutaRef = db.collection('rutas').doc(id);
        await rutaRef.set({
        name,
        });

        return { id, name };
    } catch (error) {
        throw error;
    }
}

async function getAllRutas() {
    const rutasRef = db.collection('rutas');
    const snapshot = await rutasRef.get();

    if (snapshot.empty) {
        return [];
    }

    const rutas = [];
    snapshot.forEach(doc => {
        rutas.push({ id: doc.id, ...doc.data() });
    });

    return rutas;
}

//CONSULTAS PARADEROS
async function addParadero(paraderoData) {
    const { id, name, rutas } = paraderoData;

    try {
        if (!Array.isArray(rutas) || rutas.length === 0) {
        throw new Error('Debe incluir al menos una ruta');
        }

        // Convertir los IDs de rutas a DocumentReference
        const rutasRefs = rutas.map(rutaId => db.collection('rutas').doc(rutaId));

        const paraderoRef = db.collection('paradero').doc(id);
        await paraderoRef.set({
        name,
        rutas: rutasRefs
        });

        return { id, name, rutas };
    } catch (error) {
        throw error;
    }
}

async function getAllParaderos() {
    try {
        const snapshot = await db.collection('paradero').get();
        const paraderos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '' 
            };
        });

        return paraderos;
    } catch (error) {
        console.error('[FirestoreService] Error al obtener paraderos:', error.message);
        throw error;
    }
}

async function getRutasPorParadero(paraderoId) {
    try {
        const paraderoDoc = await db.collection('paradero').doc(paraderoId).get();

        if (!paraderoDoc.exists) {
        throw new Error('Paradero no encontrado');
        }

        const data = paraderoDoc.data();
        const rutasRefs = data.rutas || [];

        // Obtener datos de cada ruta referenciada
        const rutas = await Promise.all(
        rutasRefs.map(async ref => {
            const rutaSnap = await ref.get();
            if (rutaSnap.exists) {
            return { id: rutaSnap.id, ...rutaSnap.data() };
            }
            return null;
        })
        );

        // Filtrar posibles null (por referencias rotas)
        return rutas.filter(r => r !== null);
    } catch (error) {
        throw error;
    }
}


//CONSULTAS TIEMPOS DE LLEGADA Y ACTUALIZACIÓN DE TIEMPO REAL

async function saveBusArrival(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add({
            ...data,
            timestamp_recepcion: admin.firestore.FieldValue.serverTimestamp() 
        });
        console.log(`[Firestore] Datos guardados en ${collectionName}. ID: ${docRef.id}`);
        return true;
    } catch (error) {
        console.error(`[Firestore Error] Fallo al guardar en ${collectionName}:`, error);
        return false;
    }
}

async function updateBusLocation(collectionName, docData) {
    try {
        const { bus_id } = docData;

        if (!bus_id) {
            throw new Error("Falta el campo 'bus_id' en docData");
        }

        const docRef = db.collection(collectionName).doc(bus_id); // Usa el bus_id como ID de documento
        await docRef.set(docData, { merge: true }); // Crea o actualiza

        console.log(`[FirestoreService] Ubicación de bus ${bus_id} actualizada correctamente.`);
        return docRef;

    } catch (error) {
        console.error(`[FirestoreService] Error al actualizar ubicación del bus:`, error.message);
        throw error; // para que el controlador que llama pueda capturarlo también
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
    //Llegadas y ubicaciones
    saveBusArrival,
    updateBusLocation,
    getCollectionData,
    getFirestoreDocument,
    //Bus
    getAllBuses,
    getBusByID,
    addBus,
    //Rutas
    addRuta,
    getAllRutas,
    //Paraderos
    addParadero,
    getAllParaderos,
    getRutasPorParadero
};