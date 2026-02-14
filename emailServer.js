/**
 * Servidor Backend - Envio de Emails
 *
 * Executa: node emailServer.js
 * URL: http://localhost:3000/send-verification
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Brevo API Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Função para enviar email via Brevo API
async function sendEmailViaBrevo(to, subject, htmlContent, senderName = 'ExtraJá') {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: process.env.GMAIL_EMAIL || 'extraja857@gmail.com',
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar email');
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email via Brevo:', error);
    throw error;
  }
}

// Verificar configuração ao iniciar
if (BREVO_API_KEY) {
  console.log('✅ Servidor pronto para enviar emails via Brevo API!');
} else {
  console.error('❌ BREVO_API_KEY não configurada!');
}

/**
 * Endpoint para enviar código de verificação
 * POST /send-verification
 * Body: { email, code, userName }
 */
app.post('/send-verification', async (req, res) => {
  const { email, code, userName } = req.body;

  console.log('📧 Recebendo requisição para enviar email:', { email, code });

  // Validações
  if (!email || !code) {
    return res.status(400).json({
      success: false,
      error: 'Email e código são obrigatórios',
    });
  }

  // Template do email
  const mailOptions = {
    from: `"ExtraJá" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: '🔐 Código de Verificação - ExtraJá',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f6fa;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f3460 0%, #1a5490 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: #fff;
            margin: 0;
            font-size: 32px;
          }
          .header p {
            color: rgba(255,255,255,0.9);
            margin: 10px 0 0 0;
            font-size: 14px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a2e;
            margin-bottom: 20px;
          }
          .code-box {
            background: linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            border-left: 4px solid #0f3460;
          }
          .code {
            font-size: 48px;
            font-weight: bold;
            color: #0f3460;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .expiry {
            color: #666;
            font-size: 14px;
            margin-top: 15px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .warning-text {
            color: #856404;
            font-size: 14px;
            margin: 0;
          }
          .footer {
            background-color: #f5f6fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ ExtraJá</h1>
            <p>Conectando quem precisa a quem resolve</p>
          </div>

          <div class="content">
            <p class="greeting">Olá, ${userName || 'usuário'}! 👋</p>

            <p>Bem-vindo ao <strong>ExtraJá</strong>! Para ativar sua conta, utilize o código de verificação abaixo:</p>

            <div class="code-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Seu código de verificação é:</p>
              <div class="code">${code}</div>
              <p class="expiry">⏱️ Válido por 1 hora</p>
            </div>

            <p>Digite este código no aplicativo para confirmar seu email e começar a usar o ExtraJá.</p>

            <div class="warning">
              <p class="warning-text">⚠️ Se você não criou uma conta no ExtraJá, ignore este email.</p>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 ExtraJá - Todos os direitos reservados</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Enviar email via Brevo API
  try {
    const result = await sendEmailViaBrevo(
      email,
      `🔐 Código de Verificação - ExtraJá`,
      mailOptions.html,
      'ExtraJá'
    );

    console.log('✅ Email enviado:', result.messageId);

    res.json({
      success: true,
      message: 'Email enviado com sucesso',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao enviar email',
      details: error.message,
    });
  }
});

/**
 * Endpoint para enviar email de notificação
 * POST /send-notification
 * Body: { email, userName, title, message, type }
 */
app.post('/send-notification', async (req, res) => {
  const { email, userName, title, message, type } = req.body;

  console.log('🔔 Enviando notificação por email:', { email, title, type });

  // Validações
  if (!email || !title || !message) {
    return res.status(400).json({
      success: false,
      error: 'Email, título e mensagem são obrigatórios',
    });
  }

  // Emoji por tipo de notificação
  const typeEmojis = {
    new_proposal: '📋',
    proposal_accepted: '✅',
    proposal_rejected: '❌',
    new_message: '💬',
    demand_completed: '🎉',
    new_review: '⭐',
    new_demand: '🔔',
    boost_activated: '🚀',
    plan_activated: '💎',
  };

  const emoji = typeEmojis[type] || '🔔';

  // Template do email
  const mailOptions = {
    from: `"ExtraJá" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: `${emoji} ${title} - ExtraJá`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f6fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0f3460 0%, #1a5490 100%); padding: 30px 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .notification-box { background: #f0f7ff; border-left: 4px solid #0f3460; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .notification-icon { font-size: 48px; text-align: center; margin-bottom: 15px; }
          .notification-title { font-size: 20px; font-weight: bold; color: #1a1a2e; margin-bottom: 10px; }
          .notification-message { font-size: 16px; color: #666; line-height: 24px; }
          .button { display: inline-block; background: linear-gradient(135deg, #e94560 0%, #d63851 100%); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { background-color: #f5f6fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ ExtraJá</h1>
          </div>

          <div class="content">
            <p style="font-size: 16px; color: #1a1a2e;">Olá, ${userName || 'usuário'}!</p>

            <div class="notification-box">
              <div class="notification-icon">${emoji}</div>
              <div class="notification-title">${title}</div>
              <div class="notification-message">${message}</div>
            </div>

            <p style="color: #666; font-size: 14px;">Abra o app ExtraJá para mais detalhes.</p>
          </div>

          <div class="footer">
            <p>© 2026 ExtraJá - Conectando quem precisa a quem resolve</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Enviar email via Brevo API
  try {
    const result = await sendEmailViaBrevo(
      email,
      `${emoji} ${title} - ExtraJá`,
      mailOptions.html,
      'ExtraJá'
    );

    console.log('✅ Notificação enviada por email:', result.messageId);

    res.json({
      success: true,
      message: 'Notificação enviada por email',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao enviar notificação',
      details: error.message,
    });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor de Email ExtraJá está online! ✅',
    version: '1.0.0',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📧 Email configurado: ${process.env.GMAIL_EMAIL}`);
  console.log(`\n✅ Pronto para enviar emails!\n`);
});
