
import React from 'react';

interface ResultScreenProps {
  level: number;
  score: number;
  accuracy: number;
  completed: boolean;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ level, score, accuracy, completed, onNext, onRetry, onMenu }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-900/80 border-2 border-white/20 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl max-w-xl w-full text-center">
        <h2 className={`text-5xl font-black mb-2 ${completed ? 'text-green-400' : 'text-rose-400'}`}>
          {completed ? 'MISSION SUCCESS' : 'MISSION FAILED'}
        </h2>
        <p className="text-slate-400 font-mono-tech tracking-widest uppercase mb-10">
          Level {level} Summary
        </p>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Final Score</div>
            <div className="text-4xl font-black text-white">{score}</div>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Accuracy</div>
            <div className="text-4xl font-black text-white">{accuracy}%</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {completed && level < 3 && (
            <button 
              onClick={onNext}
              className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              PROCEED TO LEVEL {level + 1}
            </button>
          )}
          <button 
            onClick={onRetry}
            className="w-full py-5 bg-white/10 rounded-2xl text-xl font-bold hover:bg-white/20 transition-all"
          >
            RETRY MISSION
          </button>
          <button 
            onClick={onMenu}
            className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold tracking-widest uppercase text-sm"
          >
            Return to Base
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
