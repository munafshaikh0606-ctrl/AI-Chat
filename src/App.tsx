/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Session } from './types';
import { BotMessageSquare } from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      const newSession = await res.json();
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onCreateSession={handleCreateSession}
      />
      <main className="flex-1 flex flex-col h-full bg-gray-900 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
        {activeSessionId ? (
          <ChatArea sessionId={activeSessionId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-gray-800/80 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.4)] border border-cyan-500/30 z-10 backdrop-blur-sm">
              <BotMessageSquare size={32} />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2 z-10" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>Welcome to AI Chat</h2>
            <p className="text-gray-400 max-w-sm mb-8 z-10">
              Experience the power of Generative AI. Start a new conversation to explore ideas, get answers, and create content.
            </p>
            <button 
              onClick={handleCreateSession}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-300 font-medium py-2.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] border border-cyan-500/50 z-10"
            >
              Start New Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
