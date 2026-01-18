import React, { useState, useEffect, useRef } from 'react';
import { User, SystemSettings, ChatMessage } from '../types';
import { db, saveUserToLive } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, where, deleteDoc, doc } from 'firebase/firestore';
import { Send, User as UserIcon, Shield, Check, Trash2, Lock, Clock, Info, Crown, Zap, Headphones, Globe } from 'lucide-react';

interface Props {
  user: User;
  settings?: SystemSettings;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
}

export const UniversalSupport: React.FC<Props> = ({ user, settings, onClose, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'UNIVERSAL' | 'SUPPORT'>('UNIVERSAL');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LOAD MESSAGES
  useEffect(() => {
      let unsub: any;
      if (activeTab === 'UNIVERSAL') {
          // Public Global Chat
          const q = query(collection(db, 'universal_chat'), orderBy('timestamp', 'asc'), limit(50));
          unsub = onSnapshot(q, (snapshot) => {
              setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
              scrollToBottom();
          });
      } else {
          // Private Support Chat (User Inbox + Admin Replies)
          // We use user.inbox for simplicity as requested, but user asked for separate chat view.
          // Actually, Support = Private Chat with Admin. 
          // Let's use a subcollection or filter 'support_messages' by userId.
          const q = query(collection(db, 'support_messages'), where('userId', 'in', [user.id, 'ADMIN']), orderBy('timestamp', 'asc')); 
          // Wait, admin needs to see ALL. User sees theirs.
          // Simplified: User sees messages where (userId == user.id) OR (recipientId == user.id).
          // Actually, let's stick to the requested structure: 
          // "Universal" -> Public. "Support" -> Private.
          
          const q2 = query(
              collection(db, 'support_messages'), 
              where('threadId', '==', user.id), 
              orderBy('timestamp', 'asc')
          );
          unsub = onSnapshot(q2, (snapshot) => {
              setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
              scrollToBottom();
          });
      }
      return () => unsub && unsub();
  }, [activeTab, user.id]);

  const scrollToBottom = () => {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // COOLDOWN LOGIC
  useEffect(() => {
      if (activeTab === 'UNIVERSAL' && user.role === 'STUDENT' && !user.isPremium) {
          const lastTime = localStorage.getItem('nst_last_chat_time');
          if (lastTime) {
              const diff = (Date.now() - Number(lastTime)) / 1000;
              const limit = settings?.chatCooldown || 30; // Default 30s for free
              if (diff < limit) {
                  setCooldown(Math.ceil(limit - diff));
                  const timer = setInterval(() => {
                      setCooldown(prev => {
                          if (prev <= 1) { clearInterval(timer); return 0; }
                          return prev - 1;
                      });
                  }, 1000);
                  return () => clearInterval(timer);
              }
          }
      }
  }, [activeTab]);

  const handleSend = async () => {
      if (!inputText.trim()) return;
      if (user.isChatBanned) { alert("You are banned from chat."); return; }

      // Cost & Limits
      if (activeTab === 'UNIVERSAL' && user.role === 'STUDENT') {
          if (cooldown > 0) {
              // Option to pay to skip?
              if (confirm(`Wait ${cooldown}s or Pay 1 Credit to skip?`)) {
                  if (user.credits < 1) { alert("Insufficient credits."); return; }
                  onUpdateUser({...user, credits: user.credits - 1});
              } else {
                  return;
              }
          }
          
          // Basic Cost
          const cost = settings?.chatCost || 0;
          if (cost > 0 && !user.isPremium) {
               if (user.credits < cost) { alert(`Need ${cost} credits to chat.`); return; }
               onUpdateUser({...user, credits: user.credits - cost});
          }
      }

      const newMsg = {
          text: inputText,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          timestamp: new Date().toISOString(),
          userPlan: user.subscriptionLevel || 'FREE', // For styling
          threadId: user.id // For Support chat
      };

      try {
          if (activeTab === 'UNIVERSAL') {
              await addDoc(collection(db, 'universal_chat'), newMsg);
              localStorage.setItem('nst_last_chat_time', Date.now().toString());
              setCooldown(settings?.chatCooldown || 30);
          } else {
              await addDoc(collection(db, 'support_messages'), newMsg);
          }
          setInputText('');
      } catch (e) {
          console.error("Send failed", e);
      }
  };

  const getBubbleStyle = (msg: any) => {
      // Admin: Best (Gold/Black)
      if (msg.userRole === 'ADMIN') return 'bg-gradient-to-r from-yellow-600 to-yellow-800 text-white border-yellow-500 shadow-yellow-500/20';
      // Sub Admin: Premium (Purple)
      if (msg.userRole === 'SUB_ADMIN') return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500';
      // Ultra: Chip (Blue/Cyan)
      if (msg.userPlan === 'ULTRA') return 'bg-cyan-50 border-cyan-200 text-cyan-900';
      // Basic: Chep (Green/Slate)
      if (msg.userPlan === 'BASIC') return 'bg-slate-50 border-slate-200 text-slate-800';
      // Free: Normal
      return 'bg-white border-slate-100 text-slate-600';
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex items-center justify-between safe-top">
          <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
              <div>
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      {activeTab === 'UNIVERSAL' ? <Globe size={20} className="text-blue-600" /> : <Headphones size={20} className="text-green-600" />}
                      {activeTab === 'UNIVERSAL' ? 'Universal Chat' : 'Support Channel'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {activeTab === 'UNIVERSAL' ? 'Global Community' : 'Private Admin Help'}
                  </p>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('UNIVERSAL')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'UNIVERSAL' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Universal</button>
              <button onClick={() => setActiveTab('SUPPORT')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'SUPPORT' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}>Support</button>
          </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
          {/* WATERMARK BG */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <Crown size={200} />
          </div>

          {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 border shadow-sm relative group ${getBubbleStyle(msg)}`}>
                      {/* ROLE BADGE */}
                      {msg.userRole !== 'STUDENT' && (
                          <div className="absolute -top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black text-white shadow-sm border border-white/20">
                              {msg.userRole}
                          </div>
                      )}
                      {/* PLAN BADGE FOR STUDENTS */}
                      {msg.userRole === 'STUDENT' && msg.userPlan !== 'FREE' && (
                          <div className={`absolute -top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${msg.userPlan === 'ULTRA' ? 'bg-purple-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                              {msg.userPlan === 'ULTRA' ? <Crown size={8} /> : <Zap size={8} />} {msg.userPlan}
                          </div>
                      )}

                      <div className="flex items-center gap-2 mb-1 opacity-70">
                          <span className="text-[10px] font-bold">{msg.userName}</span>
                          <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  
                  {/* ADMIN DELETE (Simulated here, real admin has button) */}
                  {user.role === 'ADMIN' && (
                      <button onClick={() => deleteDoc(doc(db, activeTab === 'UNIVERSAL' ? 'universal_chat' : 'support_messages', msg.id))} className="text-[10px] text-red-400 mt-1 hover:underline">Delete</button>
                  )}
              </div>
          ))}
          <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-200 safe-bottom">
          <div className="flex gap-2 items-end">
              <textarea 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "Type a message..."}
                  disabled={cooldown > 0 && activeTab === 'UNIVERSAL' && !user.isPremium}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none h-12 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
              />
              <button 
                  onClick={handleSend}
                  disabled={cooldown > 0 && activeTab === 'UNIVERSAL' && !user.isPremium}
                  className={`p-3 rounded-xl shadow-lg transition-all ${
                      cooldown > 0 && activeTab === 'UNIVERSAL' && !user.isPremium
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:scale-105 active:scale-95'
                  }`}
              >
                  {cooldown > 0 && activeTab === 'UNIVERSAL' && !user.isPremium ? <Clock size={20} /> : <Send size={20} />}
              </button>
          </div>
          {cooldown > 0 && activeTab === 'UNIVERSAL' && !user.isPremium && (
              <p className="text-[10px] text-center text-slate-400 mt-2">
                  Free user cooldown active. Upgrade to Ultra to chat freely.
              </p>
          )}
      </div>
    </div>
  );
};
