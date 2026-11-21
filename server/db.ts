import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Storage Interfaces
export interface ISession {
  id: string;
  title: string;
  createdAt: Date;
}

export interface IMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// Mongoose Schemas
const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// We only compile models if mongoose connects successfully
let SessionModel: mongoose.Model<any>;
let MessageModel: mongoose.Model<any>;

// In-Memory Fallback State (if MongoDB isn't provided)
let isUsingMongoDB = false;
const memorySessions: ISession[] = [];
const memoryMessages: IMessage[] = [];

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI is not set. Using in-memory fallback for chat history.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
    SessionModel = mongoose.model('Session', SessionSchema);
    MessageModel = mongoose.model('Message', MessageSchema);
    isUsingMongoDB = true;
  } catch (err) {
    console.error('MongoDB connection error, falling back to in-memory:', err);
  }
}

export async function getSessions(): Promise<ISession[]> {
  if (isUsingMongoDB) {
    const docs = await SessionModel.find().sort({ createdAt: -1 });
    return docs.map(d => ({ id: d.id, title: d.title, createdAt: d.createdAt }));
  }
  return [...memorySessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createSession(title = 'New Chat'): Promise<ISession> {
  const newSession: ISession = {
    id: uuidv4(),
    title,
    createdAt: new Date(),
  };

  if (isUsingMongoDB) {
    const doc = new SessionModel(newSession);
    await doc.save();
    return newSession;
  }
  
  memorySessions.push(newSession);
  return newSession;
}

export async function getMessages(sessionId: string): Promise<IMessage[]> {
  if (isUsingMongoDB) {
    const docs = await MessageModel.find({ sessionId }).sort({ createdAt: 1 });
    return docs.map(d => ({
      id: d.id,
      sessionId: d.sessionId,
      role: d.role,
      content: d.content,
      createdAt: d.createdAt
    }));
  }
  return memoryMessages
    .filter(m => m.sessionId === sessionId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<IMessage> {
  const newMessage: IMessage = {
    id: uuidv4(),
    sessionId,
    role,
    content,
    createdAt: new Date(),
  };

  if (isUsingMongoDB) {
    const doc = new MessageModel(newMessage);
    await doc.save();
    return newMessage;
  }

  memoryMessages.push(newMessage);
  return newMessage;
}
