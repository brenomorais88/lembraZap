import express from 'express';
import dotenv from 'dotenv';
import { Twilio } from 'twilio';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: ['https://seu-front.netlify.app'] }));

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message
    });
    res.json({ success: true, sid: response.sid });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on ${PORT}`));
