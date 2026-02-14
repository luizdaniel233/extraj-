/**
 * Script para limpar dados de teste do Firestore
 *
 * CUIDADO: Este script deleta TODOS os dados!
 * Use apenas em desenvolvimento/testes.
 *
 * Executar: node cleanupTestData.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { getAuth, deleteUser } = require('firebase/auth');

// Configuração Firebase (copiar de src/services/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDywHUi7vZmQKTPKiQiGVmWp8BO6Pzo_pA",
  authDomain: "softlive-app.firebaseapp.com",
  projectId: "softlive-app",
  storageBucket: "softlive-app.firebasestorage.app",
  messagingSenderId: "103890095506",
  appId: "1:103890095506:web:31e57f3d4cb3f19a8f86cd"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function deleteCollection(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));

    if (snapshot.empty) {
      console.log(`✅ Coleção "${collectionName}" já está vazia`);
      return;
    }

    console.log(`🗑️  Deletando ${snapshot.size} documentos de "${collectionName}"...`);

    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, document.id));
    }

    console.log(`✅ Coleção "${collectionName}" limpa! (${snapshot.size} docs deletados)`);
  } catch (error) {
    console.error(`❌ Erro ao deletar "${collectionName}":`, error.message);
  }
}

async function deleteSubcollections() {
  try {
    console.log('🗑️  Deletando subcoleções de chats...');

    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    let totalMessages = 0;

    for (const chatDoc of chatsSnapshot.docs) {
      const messagesSnapshot = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));

      for (const msgDoc of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'chats', chatDoc.id, 'messages', msgDoc.id));
        totalMessages++;
      }
    }

    console.log(`✅ ${totalMessages} mensagens deletadas de chats!`);
  } catch (error) {
    console.error('❌ Erro ao deletar subcoleções:', error.message);
  }
}

async function cleanupAll() {
  console.log('\n🧹 Iniciando limpeza completa do Firestore...\n');
  console.log('⚠️  AVISO: Todos os dados serão deletados!\n');

  try {
    // Deletar subcoleções primeiro (mensagens de chat)
    await deleteSubcollections();

    // Deletar coleções principais na ordem certa
    await deleteCollection('notifications');
    await deleteCollection('reviews');
    await deleteCollection('proposals');
    await deleteCollection('chats');
    await deleteCollection('demands');
    await deleteCollection('users');

    console.log('\n✅ Limpeza completa! Firestore limpo.\n');
    console.log('⚠️  NOTA: Usuários do Firebase Auth não foram deletados.');
    console.log('   Para deletar usuários do Auth, use o Firebase Console.\n');
  } catch (error) {
    console.error('\n❌ Erro durante a limpeza:', error);
  }

  process.exit(0);
}

// Executar limpeza
cleanupAll();
