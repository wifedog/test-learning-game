
import React from 'react';

interface MainMenuProps {
  onStartLevel: (level: number) => void;
  onViewHistory: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartLevel, onViewHistory }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="mb-12">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-lg glow-text mb-4">
          SPACE MULTIPLIER
        </h1>
        <p className="text-blue-200 text-xl font-mono-tech tracking-widest opacity-80">
          GALACTIC MATH DEFENSE SYSTEM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
        {[
          { level: 1, range: '1x1 ~ 3x9', color: 'from-green-500 to-emerald-700' },
          { level: 2, range: '4x1 ~ 6x9', color: 'from-yellow-500 to-orange-700' },
          { level: 3, range: '7x1 ~ 9x9', color: 'from-red-500 to-rose-700' },
        ].map((btn) => (
          <button
            key={btn.level}
            onClick={() => onStartLevel(btn.level)}
            className={`group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br ${btn.color} border border-white/20 shadow-2xl transition-all hover:scale-105 active:scale-95`}
          >
            <div className="relative z-10">
              <span className="block text-sm uppercase font-bold opacity-70 mb-1">Level</span>
              <span className="block text-4xl font-black mb-2">{btn.level}</span>
              <span className="block font-mono-tech text-lg">{btn.range}</span>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <button
        onClick={onViewHistory}
        className="px-8 py-3 rounded-full border border-blue-400/30 text-blue-300 hover:bg-blue-400/10 transition-colors uppercase font-bold tracking-widest"
      >
        View Mission History
      </button>

      <div className="mt-16 text-slate-500 text-sm max-w-md">
        Use <span className="text-slate-300">MOUSE</span> or <span className="text-slate-300">ARROW KEYS</span> to move.<br />
        <span className="text-slate-300">LEFT CLICK</span> or <span className="text-slate-300">ENTER</span> to shoot correct targets.<br />
        Resistance: Meteorites require multiple hits to destroy!
      </div>
    </div>
  );
};

export default MainMenu;
