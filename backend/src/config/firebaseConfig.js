const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json'); 

// Inicializa Firebase si no ha sido inicializado ya
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase inicializado correctamente.');
}

const db = admin.firestore();
module.exports = { db, admin };