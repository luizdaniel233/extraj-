/**
 * Webhook do Mercado Pago
 *
 * Este arquivo deve rodar em um servidor backend (Node.js)
 * Pode ser:
 * - Firebase Functions
 * - Vercel Serverless
 * - Servidor Node.js próprio
 * - AWS Lambda
 *
 * O Mercado Pago enviará notificações para esta URL quando:
 * - Pagamento for aprovado
 * - Pagamento for rejeitado
 * - Assinatura for criada/cancelada
 */

const admin = require('firebase-admin');
const express = require('express');
const app = express();

// Inicializar Firebase Admin (se ainda não foi)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Middleware para parse de JSON
app.use(express.json());

/**
 * Endpoint principal do webhook
 * POST /webhooks/mercadopago
 */
app.post('/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('📬 Webhook recebido:', req.body);

    const { type, data } = req.body;

    // Tipos de notificação:
    // - payment: Pagamento único (boost)
    // - subscription_preapproval: Assinatura (planos)

    if (type === 'payment') {
      await handlePaymentNotification(data);
    } else if (type === 'subscription_preapproval') {
      await handleSubscriptionNotification(data);
    }

    // Sempre responder 200 para o Mercado Pago
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * Processa notificação de pagamento (Boost)
 */
async function handlePaymentNotification(data) {
  const paymentId = data.id;

  // Buscar detalhes do pagamento na API do Mercado Pago
  const payment = await getPaymentDetails(paymentId);

  console.log('💰 Pagamento:', payment);

  // Verificar se foi aprovado
  if (payment.status === 'approved') {
    // Extrair dados da referência externa
    const externalRef = JSON.parse(payment.external_reference);
    const { userId, demandId, boostLevel, type } = externalRef;

    if (type === 'boost') {
      // Aplicar boost na demanda
      await applyBoost(demandId, boostLevel, paymentId);

      // Notificar usuário
      await notifyUser(userId, {
        title: 'Boost Ativado! 🚀',
        body: `Sua demanda agora está impulsionada!`,
        data: { type: 'boost_activated', demandId },
      });

      console.log('✅ Boost aplicado com sucesso');
    }
  }
}

/**
 * Processa notificação de assinatura (Planos)
 */
async function handleSubscriptionNotification(data) {
  const subscriptionId = data.id;

  // Buscar detalhes da assinatura
  const subscription = await getSubscriptionDetails(subscriptionId);

  console.log('📋 Assinatura:', subscription);

  // Verificar status
  if (subscription.status === 'authorized') {
    const externalRef = JSON.parse(subscription.external_reference);
    const { userId, planType } = externalRef;

    // Ativar plano do usuário
    await updateUserPlan(userId, planType, subscriptionId);

    // Notificar usuário
    await notifyUser(userId, {
      title: 'Plano Ativado! ✅',
      body: `Seu plano ${planType.toUpperCase()} está ativo!`,
      data: { type: 'plan_activated', planType },
    });

    console.log('✅ Plano ativado com sucesso');
  } else if (subscription.status === 'cancelled') {
    const externalRef = JSON.parse(subscription.external_reference);
    const { userId } = externalRef;

    // Downgrade para free
    await updateUserPlan(userId, 'free', null);

    console.log('⚠️ Assinatura cancelada');
  }
}

/**
 * Aplica boost em uma demanda
 */
async function applyBoost(demandId, boostLevel, paymentId) {
  const boostDuration = {
    basico: 3,
    destaque: 7,
    premium: 15,
  };

  const days = boostDuration[boostLevel];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db.collection('demands').doc(demandId).update({
    boosted: true,
    boostLevel,
    boostExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    boostPurchasedAt: admin.firestore.Timestamp.fromDate(now),
    boostPaymentId: paymentId,
  });
}

/**
 * Atualiza plano do usuário
 */
async function updateUserPlan(userId, planType, subscriptionId) {
  const updates = {
    plan: planType,
    proposalsSentThisMonth: 0,
    planResetDate: admin.firestore.Timestamp.now(),
  };

  if (planType !== 'free') {
    updates.subscriptionId = subscriptionId;
    updates.subscriptionExpiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    );
  } else {
    updates.subscriptionId = null;
    updates.subscriptionExpiresAt = null;
  }

  await db.collection('users').doc(userId).update(updates);
}

/**
 * Notifica usuário via Firebase Cloud Messaging
 */
async function notifyUser(userId, notification) {
  const userDoc = await db.collection('users').doc(userId).get();
  const pushToken = userDoc.data()?.pushToken;

  if (!pushToken) return;

  await admin.messaging().send({
    token: pushToken,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data,
  });
}

/**
 * Busca detalhes do pagamento na API do Mercado Pago
 */
async function getPaymentDetails(paymentId) {
  const accessToken = 'SEU_ACCESS_TOKEN_AQUI'; // TODO: Mover para env

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

/**
 * Busca detalhes da assinatura na API do Mercado Pago
 */
async function getSubscriptionDetails(subscriptionId) {
  const accessToken = 'SEU_ACCESS_TOKEN_AQUI'; // TODO: Mover para env

  const response = await fetch(`https://api.mercadopago.com/v1/preapproval/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

// Iniciar servidor (se não for Firebase Functions)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server rodando na porta ${PORT}`);
});

module.exports = app;
