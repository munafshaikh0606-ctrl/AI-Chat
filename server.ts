import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB, getSessions, createSession, getMessages, addMessage } from './server/db';
import { generateChatResponse } from './server/llm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Try to connect to DB, fallback to in-memory if MONGODB_URI is missing
  await connectDB();

  // API Routes
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await getSessions();
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sessions', async (req, res) => {
    try {
      const session = await createSession();
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sessions/:id/messages', async (req, res) => {
    try {
      const messages = await getMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    try {
      // 1. Save user message
      await addMessage(sessionId, 'user', message);

      // 2. Fetch recent context
      const contextMessages = await getMessages(sessionId);
      
      // 3. Generate response via LLM
      const responseText = await generateChatResponse(contextMessages);

      // 4. Save assistant message
      const aiMessage = await addMessage(sessionId, 'assistant', responseText);

      res.json(aiMessage);
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate response' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
