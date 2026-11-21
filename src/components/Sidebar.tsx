import React from 'react';
import { Session } from '../types';
import { MessageSquare, Plus, Menu } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export default function Sidebar({ sessions, activeSessionId, onSelectSession, onCreateSession }: SidebarProps) {
  return (
    <aside className="w-72 bg-gray-950 border-r border-gray-800 flex flex-col h-full shrink-0 relative overflow-hidden">
      <div className="p-4 relative z-10">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center gap-2 bg-gray-900/50 border border-gray-700 hover:border-cyan-400/50 hover:text-cyan-300 text-gray-300 font-medium py-2.5 px-4 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] group backdrop-blur-sm"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 text-cyan-500 group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin relative z-10">
        <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">
          Recent Conversations
        </div>
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
              activeSessionId === session.id 
                ? 'bg-cyan-950/40 text-cyan-100 font-medium border border-cyan-500/30 shadow-[inset_0_0_12px_rgba(34,211,238,0.1)]' 
                : 'hover:bg-gray-800 text-gray-400 border border-transparent'
            )}
          >
            <MessageSquare size={16} className={clsx(
              activeSessionId === session.id ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-gray-500'
            )} />
            <span className="truncate text-sm">{session.title}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="text-sm text-gray-500 px-3 py-4 text-center">
            No history yet.
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-800 relative z-10 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-300 font-medium">
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-cyan-400 flex items-center justify-center font-semibold shadow-[0_0_10px_rgba(34,211,238,0.15)]">
            ME
          </div>
          <span className="truncate">My Account</span>
        </div>
      </div>
    </aside>
  );
}
