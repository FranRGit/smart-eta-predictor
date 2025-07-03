const { db, admin } = require('../config/firebaseConfig');
const { COLLECTIONS } = require('../constants/colecctions');
//CONSULTAS BUSES

async function addBus(busData) {
    const { id, name, ruta } = busData;

    try {
        const rutaRef = db.collection(COLLECTIONS.ROUTES).doc(ruta);
        const rutaDoc = await rutaRef.get();

        if (!rutaDoc.exists) {
        throw new Error('Ruta no encontrada');
        }
        const busRef = db.collection(COLLECTIONS.BUSES).doc(id);
        await busRef.set({
            name,
            ruta: rutaRef 
        });

        return { id, name, ruta};
    } catch (error) {
        throw error;
    }
}

async function getAllBuses() {
    const busesRef = db.collection(COLLECTIONS.BUSES);
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
    const busesRef = db.collection(COLLECTIONS.BUSES);
    const querySnapshot = await busesRef.where('id', '==', busId).get();

    if (querySnapshot.empty) {
        return null; 
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };

}


//CONSULTAS TIEMPOS DE LLEGADA Y ACTUALIZACIÓN DE TIEMPO REAL
// CONSULTAS TIEMPOS DE LLEGADA Y ACTUALIZACIÓN DE TIEMPO REAL
async function saveBusArrival(docData) {
    const { bus_id, paradero_id } = docData;

    if (!bus_id || !paradero_id) {
        throw new Error("[Firestore] Faltan campos requeridos: 'bus_id' o 'paradero_id' en docData");
    }

    try {
        // 1. Guardar en histórico (arrivals)
        const docRef = await db
            .collection(COLLECTIONS.BUSES)
            .doc(bus_id)
            .collection(COLLECTIONS.ARRIVALS)
            .add({
                ...docData,
                timestamp_recepcion: admin.firestore.FieldValue.serverTimestamp()
            });

        // 2. Actualizar nearby
        await actualizarNearbyBus(docData);

        // 3. Actualizar colección optimizada para último arribo
        const lastArrivalId = `${bus_id}_${paradero_id}`;
        await db
            .collection('bus-last-arrival')  // puedes mover esto a COLLECTIONS si lo defines allí
            .doc(lastArrivalId)
            .set(
                {
                    ...docData,
                    timestamp_recepcion: admin.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );

        console.log(`[Firestore] Datos guardados en ${COLLECTIONS.ARRIVALS} y actualizado bus-last-arrival: ${lastArrivalId}`);
        return docRef;

    } catch (error) {
        console.error(`[Firestore Error] Fallo al guardar en ${COLLECTIONS.ARRIVALS}:`, error);
        return false;
    }
}


async function updateBusLocation(docData) {
    const { bus_id, location } = docData;

    try {
        if (!bus_id) {
            throw new Error("Falta el campo 'bus_id' en docData");
        }
        if (!location || !location.lat || !location.lon || !location.tiempo_ubicacion) {
            throw new Error("Faltan datos en 'location' (lat/lng)");
        }

        const docRef = db.collection(COLLECTIONS.BUSES).doc(bus_id);

        await docRef.update({
            location: {
                lat: location.lat,
                lon: location.lon,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        console.log(`[FirestoreService] Ubicación del bus ${bus_id} actualizada correctamente.`);
        return docRef;

    } catch (error) {
        console.error(`[FirestoreService] Error al actualizar ubicación del bus:`, error.message);
        throw error;
    }
}

async function actualizarNearbyBus(busArrivalData) {
    const {
        bus_id,
        paradero_id: currentParaderoId,
        ruta_id,
        tiempo_llegada
    } = busArrivalData;

    const rutaRef = db.collection(COLLECTIONS.ROUTES).doc(ruta_id);
    const rutaSnap = await rutaRef.get();

    if (!rutaSnap.exists) throw new Error(`Ruta ${ruta_id} no encontrada`);

    const rutaData = rutaSnap.data();

    if (!Array.isArray(rutaData.paraderos)) {
        throw new Error(`La ruta ${ruta_id} no contiene un array válido de paraderos`);
    }

    const paraderosRuta = rutaData.paraderos;
    const esCircular = rutaData.circular === true;
    const totalParaderos = paraderosRuta.length;

    const indexActual = paraderosRuta.indexOf(currentParaderoId);
    if (indexActual === -1) {
        console.warn(`Paradero ${currentParaderoId} no está en la ruta ${ruta_id}`);
        return;
    }

    // 🧼 Eliminar este bus del nearbyBus[] del paradero actual (ya llegó)
    const refParaderoActual = db
        .collection(COLLECTIONS.STOPS)
        .doc(currentParaderoId)
        .collection(COLLECTIONS.ROUTES)
        .doc(ruta_id);

    const snapParaderoActual = await refParaderoActual.get();
    if (snapParaderoActual.exists && Array.isArray(snapParaderoActual.data().nearbyBus)) {
        const nuevaLista = snapParaderoActual.data().nearbyBus.filter(b => b.busId !== bus_id);

        await refParaderoActual.set(
            { nearbyBus: nuevaLista },
            { merge: true }
        );

        console.log(`[Nearby] Bus ${bus_id} eliminado del nearbyBus[] del paradero ${currentParaderoId} porque ya llegó`);
    }

    // 🔁 Calcular destinos (lineales o circulares)
    for (let offset = 1; offset < totalParaderos; offset++) {
        let destinoParaderoIndex = indexActual + offset;

        if (esCircular) {
            destinoParaderoIndex = destinoParaderoIndex % totalParaderos;
        } else if (destinoParaderoIndex >= totalParaderos) {
            break; // Fin de ruta no circular
        }

        const destinoParaderoId = paraderosRuta[destinoParaderoIndex];
        const distanciaParaderos = offset;

        const nearbyRef = db
            .collection(COLLECTIONS.STOPS)
            .doc(destinoParaderoId)
            .collection(COLLECTIONS.ROUTES)
            .doc(ruta_id);

        const nearbySnap = await nearbyRef.get();
        let listaActual = nearbySnap.exists && Array.isArray(nearbySnap.data().nearbyBus)
            ? nearbySnap.data().nearbyBus
            : [];

        // 💡 Elimina duplicados del mismo bus
        listaActual = listaActual.filter(item => item.busId !== bus_id);

        // ✅ Agrega nuevo estado
        listaActual.push({
            busId: bus_id,
            ultimo_stop: currentParaderoId,
            tiempo_llegada,
            distanciaParaderos
        });

        // 📊 Ordenar: primero por menor distancia, luego menor tiempo
        listaActual.sort((a, b) => {
            if (a.distanciaParaderos !== b.distanciaParaderos) {
                return a.distanciaParaderos - b.distanciaParaderos;
            }
            return new Date(a.tiempo_llegada) - new Date(b.tiempo_llegada);
        });

        await nearbyRef.set({ nearbyBus: listaActual }, { merge: true });

        console.log(`[Nearby] Actualizado nearbyBus[] para paradero ${destinoParaderoId}, ruta ${ruta_id}`);
    }
}



//CONSULTAS RUTAS
async function addRuta(rutaData) {
    const { id, name, hora_pico } = rutaData;

    try {
        const rutaRef = db.collection(COLLECTIONS.ROUTES).doc(id);
        await rutaRef.set({
        name,
        hora_pico
        });

        return { id, name, hora_pico };
    } catch (error) {
        throw error;
    }
}


async function agregarParaderosARuta(rutaId, nuevosParaderos) {
    const rutaRef = db.collection(COLLECTIONS.ROUTES).doc(rutaId);
    const rutaSnap = await rutaRef.get();

    if (!rutaSnap.exists) {
        throw new Error(`Ruta ${rutaId} no encontrada`);
    }

    const rutaData = rutaSnap.data();
    const paraderosActuales = Array.isArray(rutaData.paraderos) ? rutaData.paraderos : [];

    // Evitar duplicados
    const paraderosActualizados = [...new Set([...paraderosActuales, ...nuevosParaderos])];

    await rutaRef.update({ paraderos: paraderosActualizados });
    for (const paraderoId of nuevosParaderos) {
        const paraderoRef = db.collection(COLLECTIONS.STOPS).doc(paraderoId);
        const paraderoSnap = await paraderoRef.get();

        if (paraderoSnap.exists) {
            const data = paraderoSnap.data();
            const rutasActuales = Array.isArray(data.rutas) ? data.rutas : [];
            const nuevasRutas = [...new Set([...rutasActuales, rutaId])];

            await paraderoRef
            .collection(COLLECTIONS.ROUTES)
            .doc(rutaId)
            .set({
                nearbyBus: null
            });
        }
    }


    return { rutaId, paraderos: paraderosActualizados };
}


async function getAllRutas() {
    const rutasRef = db.collection(COLLECTIONS.ROUTES);
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
    const { id, name, latitud, longitud, rutas } = paraderoData;

    try {
        if (!Array.isArray(rutas) || rutas.length === 0) {
            throw new Error('Debe incluir al menos una ruta');
        }

        const paraderoRef = db.collection(COLLECTIONS.STOPS).doc(id);

        // 1. Guardar los datos del paradero principal
        await paraderoRef.set({name, latitud, longitud});

        // 2. Crear subcolección 'rutas' dentro del paradero
        const batch = db.batch();

        rutas.forEach(rutaId => {
        const rutaRef = paraderoRef.collection(COLLECTIONS.ROUTES).doc(rutaId);
        batch.set(rutaRef, {
            nearbyBus: null
        });
        });

        await batch.commit();

        return { id, name, rutas };
    } catch (error) {
        throw error;
    }
}

async function getAllParaderos() {
    try {
        const snapshot = await db.collection(COLLECTIONS.STOPS).get();
        const paraderos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                latitud: data.latitud,
                longitud: data.longitud
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
        const paraderoRef = db.collection(COLLECTIONS.STOPS).doc(paraderoId);
        const paraderoSnap = await paraderoRef.get();

        if (!paraderoSnap.exists) {
            throw new Error('Paradero no encontrado');
        }

        // Obtener documentos de la subcolección 'rutas'
        const rutasSnap = await paraderoRef.collection(COLLECTIONS.ROUTES).get();

        if (rutasSnap.empty) {
            return [];
        }

        const rutas = await Promise.all(
            rutasSnap.docs.map(async (doc) => {
                const rutaId = doc.id;
                const rutaDataSnap = await db.collection(COLLECTIONS.ROUTES).doc(rutaId).get();

                if (rutaDataSnap.exists) {
                    const rutaData = rutaDataSnap.data();
                    return {
                        id: rutaId,
                        name: rutaData.name || 'Sin nombre',
                    };
                } else {
                    return {
                        id: rutaId,
                        name: 'Ruta no encontrada'
                    };
                }
            })
        );

        return rutas;
    } catch (error) {
        throw error;
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
    agregarParaderosARuta,
    //Paraderos
    addParadero,
    getAllParaderos,
    getRutasPorParadero,

};