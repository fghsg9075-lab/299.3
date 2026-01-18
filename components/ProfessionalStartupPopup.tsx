import React, { useState, useEffect } from 'react';
import { X, Crown, Star, Check, Sparkles, Zap, ChevronRight, Shield, Award, BookOpen, Clock, Activity, BarChart, Gift, Users, Lock, Unlock, PlayCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const ProfessionalStartupPopup: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'FREE' | 'BASIC' | 'ULTRA'>('FREE');
  const [timeLeft, setTimeLeft] = useState(9); // Total duration 9s
  const [canSkip, setCanSkip] = useState(false);

  // Auto-Rotation and Timer Logic
  useEffect(() => {
    // 1. Global Auto-Close Timer
    const closeTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(closeTimer);
          onClose(); // Auto close after 9s
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Skip Button Enabler
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 5000);

    // 3. Tab Rotation Logic (3s per tab)
    // 0-3s: Free, 3-6s: Basic, 6-9s: Ultra
    const rotateInterval = setInterval(() => {
        setActiveTab(prev => {
            if (prev === 'FREE') return 'BASIC';
            if (prev === 'BASIC') return 'ULTRA';
            return 'ULTRA'; // Stay on Ultra at end
        });
    }, 3000);

    return () => {
      clearInterval(closeTimer);
      clearTimeout(skipTimer);
      clearInterval(rotateInterval);
    };
  }, [onClose]);

  // Manually clicking a tab should pause rotation? 
  // User asked: "tino apne aap badalta rahega" (all three will keep changing automatically).
  // "ek pop up 3 second rahega aur 3 hai to 9 second" (one popup stays 3s, total 9s).
  // This implies strict sequencing: Free -> Basic -> Ultra.

  const features = {
    FREE: [
      { text: 'Global Leaderboard View', icon: <Activity size={14} className="text-green-500" /> },
      { text: 'Basic Subject Notes', icon: <BookOpen size={14} className="text-blue-500" /> },
      { text: 'Practice MCQs (50 Limit)', icon: <Check size={14} className="text-orange-500" /> },
      { text: 'Daily Study Streak', icon: <Clock size={14} className="text-purple-500" /> },
      { text: 'Daily Login Bonus (3 Coins)', icon: <Gift size={14} className="text-yellow-500" /> },
      { text: 'Spin Wheel (2 Spins/Day)', icon: <Zap size={14} className="text-red-500" /> },
      { text: 'Mobile Access', icon: <Check size={14} className="text-slate-500" /> },
    ],
    BASIC: [
      { text: 'Login Bonus: 10 Credits/Day', icon: <Gift size={14} className="text-yellow-500" /> },
      { text: 'Spin Wheel: 5 Spins/Day', icon: <Zap size={14} className="text-red-500" /> },
      { text: 'Full MCQs Unlocked (100)', icon: <Unlock size={14} className="text-green-500" /> },
      { text: 'Detailed MCQ Analysis', icon: <BarChart size={14} className="text-blue-500" /> },
      { text: 'Premium Notes (Standard)', icon: <Star size={14} className="text-purple-500" /> },
      { text: 'AI Videos (2D Basic)', icon: <PlayCircle size={14} className="text-pink-500" /> },
      { text: 'Team Support Access', icon: <Users size={14} className="text-indigo-500" /> },
    ],
    ULTRA: [
      { text: 'Login Bonus: 20 Credits/Day', icon: <Crown size={14} className="text-yellow-500" /> },
      { text: 'Spin Wheel: 10 Spins/Day', icon: <Zap size={14} className="text-red-500" /> },
      { text: 'Deep Concept Videos (3D)', icon: <PlayCircle size={14} className="text-purple-500" /> },
      { text: 'Detailed Notes & Diagrams', icon: <BookOpen size={14} className="text-blue-500" /> },
      { text: 'Competitive Mode Unlocked 🏆', icon: <Award size={14} className="text-orange-500" /> },
      { text: 'VIP Badge & Custom Profile', icon: <Star size={14} className="text-yellow-500" /> },
      { text: 'Direct Teacher Support', icon: <Users size={14} className="text-green-500" /> },
      { text: 'Unlimited MCQs & Analysis', icon: <Unlock size={14} className="text-pink-500" /> },
    ]
  };

  const getTheme = () => {
      if (activeTab === 'ULTRA') return { bg: 'bg-slate-900', border: 'border-purple-500/50', accent: 'text-purple-400', badge: 'bg-purple-600', shadow: 'shadow-purple-500/20' };
      if (activeTab === 'BASIC') return { bg: 'bg-slate-900', border: 'border-blue-500/50', accent: 'text-blue-400', badge: 'bg-blue-600', shadow: 'shadow-blue-500/20' };
      return { bg: 'bg-white', border: 'border-slate-200', accent: 'text-slate-600', badge: 'bg-slate-600', shadow: 'shadow-slate-200' };
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-sm mx-4 relative">
        
        {/* TIMER BAR */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden -mt-6">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${activeTab === 'ULTRA' ? 'bg-purple-500' : activeTab === 'BASIC' ? 'bg-blue-500' : 'bg-slate-500'}`}
            style={{ width: `${(timeLeft / 9) * 100}%` }}
          />
        </div>

        {/* MAIN CARD */}
        <div className={`rounded-3xl border ${theme.border} shadow-2xl overflow-hidden transition-all duration-500 relative ${theme.bg}`}>
          
          {/* HEADER IMAGE / BANNER */}
          <div className={`h-32 relative overflow-hidden flex items-center justify-center ${activeTab === 'ULTRA' ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900' : activeTab === 'BASIC' ? 'bg-gradient-to-br from-blue-600 to-cyan-500' : 'bg-slate-100'}`}>
              
              {/* Background FX */}
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-spin-slow"></div>
              
              <div className="relative z-10 text-center">
                  <div className={`inline-flex p-3 rounded-2xl shadow-xl mb-2 ${theme.badge} text-white`}>
                      {activeTab === 'ULTRA' ? <Crown size={32} fill="currentColor" /> : activeTab === 'BASIC' ? <Zap size={32} fill="currentColor" /> : <Shield size={32} />}
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${activeTab === 'FREE' ? 'text-slate-800' : 'text-white'}`}>
                      {activeTab === 'ULTRA' ? 'ULTRA PLAN' : activeTab === 'BASIC' ? 'BASIC PLAN' : 'FREE PLAN'}
                  </h2>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${activeTab === 'FREE' ? 'text-slate-500' : 'text-white/70'}`}>
                      {activeTab === 'ULTRA' ? 'FOR TOPPERS' : activeTab === 'BASIC' ? 'FOR SERIOUS STUDENTS' : 'GET STARTED'}
                  </p>
              </div>
          </div>

          {/* INDICATORS */}
          <div className="flex justify-center gap-1.5 -mt-3 relative z-20">
              {(['FREE', 'BASIC', 'ULTRA'] as const).map(tab => (
                  <div 
                    key={tab} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === tab ? `w-8 ${tab === 'ULTRA' ? 'bg-purple-500' : tab === 'BASIC' ? 'bg-blue-500' : 'bg-slate-500'}` : 'w-2 bg-slate-300/50'}`} 
                  />
              ))}
          </div>

          {/* FEATURES LIST */}
          <div className="p-6">
             <div className="space-y-3 min-h-[260px]">
                 {features[activeTab].map((feat, i) => (
                     <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 50}ms` }}>
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${activeTab === 'FREE' ? 'bg-slate-100' : 'bg-white/10'}`}>
                             {feat.icon}
                         </div>
                         <span className={`text-xs font-bold ${activeTab === 'FREE' ? 'text-slate-600' : 'text-slate-200'}`}>
                             {feat.text}
                         </span>
                     </div>
                 ))}
             </div>
          </div>

          {/* FOOTER */}
          <div className={`p-4 border-t flex items-center justify-between gap-4 ${activeTab === 'FREE' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
             <div className="flex-1">
                 {canSkip ? (
                     <button 
                        onClick={onClose} 
                        className={`text-xs font-bold px-4 py-2 rounded-lg w-full transition-all ${activeTab === 'FREE' ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                     >
                        Skip
                     </button>
                 ) : (
                     <p className="text-[10px] text-center font-mono text-slate-500">
                        Wait {Math.max(0, timeLeft - 4)}s
                     </p>
                 )}
             </div>
             
             {activeTab !== 'FREE' && (
                 <button 
                    onClick={onClose}
                    className={`flex-[2] py-3 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform ${activeTab === 'ULTRA' ? 'bg-purple-600 text-white shadow-purple-500/30' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
                 >
                    Get {activeTab === 'ULTRA' ? 'Ultra' : 'Basic'} <ChevronRight size={14} />
                 </button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
