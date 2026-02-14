# 📧 Servidor de Email - ExtraJá

Servidor Node.js simples para enviar emails de verificação via Gmail SMTP.

---

## 🚀 Configuração Rápida

### **PASSO 1: Gerar Senha de App do Gmail**

1. Acesse: https://myaccount.google.com/security
2. Ative **"Verificação em duas etapas"** (se ainda não ativou)
3. Volte e clique em **"Senhas de app"**
4. App: **Email** | Dispositivo: **Outro (ExtraJá)**
5. Clique em **Gerar**
6. **COPIE A SENHA** (ex: `abcd efgh ijkl mnop`)
7. Remova os espaços: `abcdefghijklmnop`

---

### **PASSO 2: Configurar .env**

1. Abra o arquivo `backend/.env`
2. Cole sua senha de app:

```env
GMAIL_EMAIL=luiz.daniel@softlive.dev
GMAIL_PASSWORD=abcdefghijklmnop
PORT=3000
```

Salve o arquivo!

---

### **PASSO 3: Instalar Dependências**

Abra o PowerShell/CMD na pasta `backend`:

```bash
cd C:\Users\luiz.santos\Desktop\softlive\app\backend
npm install
```

---

### **PASSO 4: Iniciar Servidor**

```bash
npm start
```

Deve aparecer:
```
🚀 Servidor rodando em http://localhost:3000
📧 Email configurado: luiz.daniel@softlive.dev
✅ Pronto para enviar emails!
```

✅ **Servidor rodando!**

---

### **PASSO 5: Testar no App**

**EM OUTRO TERMINAL**, rode o app:

```bash
cd C:\Users\luiz.santos\Desktop\softlive\app
npx expo start
```

1. Cadastre uma conta
2. **Verifique seu email!** 📧
3. Deve receber o código!

---

## 🌐 Deploy em Produção (OPCIONAL)

Quando quiser colocar em produção, faça deploy no **Railway** (grátis):

### Railway (Recomendado):

1. Acesse: https://railway.app/
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**
3. Conecte seu GitHub e selecione o repositório
4. Configure as variáveis de ambiente:
   - `GMAIL_EMAIL`: luiz.daniel@softlive.dev
   - `GMAIL_PASSWORD`: sua-senha-de-app
   - `PORT`: 3000

5. Deploy automático! Copie a URL gerada

6. Atualize `src/services/emailService.ts`:
```typescript
const EMAIL_SERVER_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://seu-app.railway.app'; // Cole aqui
```

---

## 🧪 Testar Servidor Diretamente

**Com o servidor rodando**, abra outro terminal:

```bash
curl -X POST http://localhost:3000/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"seuemail@gmail.com\",\"code\":\"123456\",\"userName\":\"Teste\"}"
```

Deve aparecer:
```json
{"success":true,"message":"Email enviado com sucesso"}
```

E você recebe o email! 📧

---

## 📝 Endpoints Disponíveis

### `GET /`
Teste se servidor está online

**Resposta:**
```json
{
  "message": "Servidor de Email ExtraJá está online! ✅",
  "version": "1.0.0"
}
```

### `POST /send-verification`
Envia email de verificação

**Body:**
```json
{
  "email": "usuario@email.com",
  "code": "123456",
  "userName": "Nome do Usuário"
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "Email enviado com sucesso",
  "messageId": "..."
}
```

**Resposta (erro):**
```json
{
  "success": false,
  "error": "Erro ao enviar email",
  "details": "..."
}
```

---

## 🐛 Troubleshooting

### Email não chega
- Verifique SPAM
- Confirme senha de app correta no `.env`
- Veja logs do servidor

### Erro "Invalid login"
- Use **senha de app**, não sua senha normal
- Verifique se 2FA está ativo

### Erro "ECONNREFUSED"
- Servidor não está rodando
- Execute: `npm start`

---

## ✅ Checklist

- [ ] Senha de app gerada
- [ ] `.env` configurado com email e senha
- [ ] `npm install` executado
- [ ] Servidor rodando (`npm start`)
- [ ] App testado (email chegou)

---

**Tudo funcionando? Você está pronto! 🚀**
