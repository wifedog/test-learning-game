
import React from 'react';
import { GameHistory } from '../types';

interface HistoryScreenProps {
  history: GameHistory[];
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack }) => {
  // Filter for last 5 of each level
  const getLatestByLevel = (lvl: number) => {
    return history.filter(h => h.level === lvl).slice(0, 5);
  };

  return (
    <div className="flex flex-col items-center h-full py-20 px-4 overflow-y-auto">
      <h2 className="text-4xl font-black text-cyan-400 mb-2 glow-text">FLIGHT LOGS</h2>
      <p className="text-slate-500 mb-12 font-mono-tech">RECENT PERFORMANCE DATA</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-12">
        {[1, 2, 3].map(lvl => (
          <div key={lvl} className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10 p-6">
            <h3 className="text-2xl font-black text-white mb-4 flex items-center justify-between">
              LEVEL {lvl}
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-400 font-normal">Last 5 Runs</span>
            </h3>
            
            <div className="space-y-3">
              {getLatestByLevel(lvl).length > 0 ? (
                getLatestByLevel(lvl).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <div className="text-lg font-bold text-white">{entry.score} pts</div>
                      <div className="text-xs text-slate-500">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-xl font-black ${entry.accuracy > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {entry.accuracy}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-600 font-mono-tech italic">
                  No data available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="px-12 py-4 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-xl shadow-cyan-900/20"
      >
        BACK TO MENU
      </button>
    </div>
  );
};

export default HistoryScreen;
