
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- 1. 常數與設定 ---
const TOTAL_QUESTIONS = 10;
const HITS_TO_DESTROY = 7; // 正確答案需要射擊 7 下
const FIRE_RATE = 120;     // 射擊冷卻 (ms)

enum GameState { MENU, PLAYING, RESULT, HISTORY }

interface GameLog {
  level: number;
  score: number;
  accuracy: number;
  timestamp: number;
}

// --- 2. 背景組件 ---
const Background = () => {
  const stars = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1, duration: Math.random() * 3 + 2
  })), []);
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 space-gradient opacity-60" />
      {stars.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white opacity-40 animate-pulse"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, animationDuration: `${s.duration}s` }} />
      ))}
    </div>
  );
};

// --- 3. 遊戲核心引擎 ---
const GameEngine = ({ level, onEnd, onQuit }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shipX, setShipX] = useState(50);
  const [bullets, setBullets] = useState([]);
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [isFiring, setIsFiring] = useState(false);

  const containerRef = useRef(null);
  const bulletsRef = useRef([]);
  const targetsRef = useRef([]);
  const lastFireTime = useRef(0);
  const bulletIdRef = useRef(0);

  // 初始化題目池 (依關卡 Level 分配)
  useEffect(() => {
    const poolA = level === 1 ? [1, 2, 3] : level === 2 ? [4, 5, 6] : [7, 8, 9];
    const qs = Array.from({ length: TOTAL_QUESTIONS }).map(() => {
      const a = poolA[Math.floor(Math.random() * poolA.length)];
      const b = Math.floor(Math.random() * 9) + 1;
      const ans = a * b;
      let opts = [ans];
      while (opts.length < 3) {
        const w = (poolA[Math.floor(Math.random() * poolA.length)] * (Math.floor(Math.random() * 9) + 1));
        if (!opts.includes(w)) opts.push(w);
      }
      return { a, b, answer: ans, options: opts.sort(() => Math.random() - 0.5) };
    });
    setQuestions(qs);
  }, [level]);

  // 切換下一題時更新隕石
  useEffect(() => {
    if (questions[currentIdx]) {
      const q = questions[currentIdx];
      const newTargets = q.options.map((val, i) => ({
        id: i, value: val, x: 20 + i * 30, y: 15,
        hp: val === q.answer ? HITS_TO_DESTROY : 1,
        maxHp: val === q.answer ? HITS_TO_DESTROY : 1,
        isCorrect: val === q.answer, destroyed: false, flash: 0
      }));
      setTargets(newTargets);
      targetsRef.current = newTargets;
    }
  }, [currentIdx, questions]);

  // 物理與碰撞偵測迴圈
  const update = useCallback(() => {
    const now = Date.now();
    
    // 連續射擊處理
    if (isFiring && now - lastFireTime.current > FIRE_RATE) {
      bulletsRef.current.push({ id: bulletIdRef.current++, x: shipX, y: 85 });
      setShotsFired(s => s + 1);
      lastFireTime.current = now;
    }

    // 子彈移動
    bulletsRef.current = bulletsRef.current.map(b => ({ ...b, y: b.y - 3.5 })).filter(b => b.y > -5);
    
    // 隕石受擊閃爍效果遞減
    targetsRef.current = targetsRef.current.map(t => ({ ...t, flash: Math.max(0, t.flash - 0.1) }));

    const hitBulletIds = new Set();
    bulletsRef.current.forEach(b => {
      targetsRef.current.forEach(t => {
        if (!t.destroyed && Math.abs(b.x - t.x) < 7 && Math.abs(b.y - (t.y + 10)) < 10) {
          hitBulletIds.add(b.id);
          t.hp -= 1;
          t.flash = 1;
          
          if (t.hp <= 0) {
            t.destroyed = true;
            if (t.isCorrect) {
              setScore(s => s + 100);
              setTimeout(() => setCurrentIdx(prev => prev + 1), 600);
            } else {
              setScore(s => Math.max(0, s - 50));
              // 錯誤答案射掉後會重生，讓玩家必須找對的
              setTimeout(() => { t.destroyed = false; t.hp = t.maxHp; }, 1000);
            }
          }
        }
      });
    });

    bulletsRef.current = bulletsRef.current.filter(b => !hitBulletIds.has(b.id));
    setBullets([...bulletsRef.current]);
    setTargets([...targetsRef.current]);

    if (currentIdx === TOTAL_QUESTIONS) {
      const acc = shotsFired > 0 ? Math.round(((TOTAL_QUESTIONS * HITS_TO_DESTROY) / shotsFired) * 100) : 0;
      onEnd(score, Math.min(100, acc));
      return;
    }
    requestAnimationFrame(update);
  }, [isFiring, shipX, currentIdx, shotsFired, score, onEnd]);

  useEffect(() => {
    const frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [update]);

  // 控制監聽 (滑鼠與鍵盤)
  useEffect(() => {
    const handleMove = (e) => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setShipX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setShipX(x => Math.max(0, x - 5));
      if (e.key === 'ArrowRight') setShipX(x => Math.min(100, x + 5));
      if (e.key === 'Enter') setIsFiring(true);
    };
    const handleKeyUp = (e) => { if (e.key === 'Enter') setIsFiring(false); };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', () => setIsFiring(true));
    window.addEventListener('mouseup', () => setIsFiring(false));
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const q = questions[currentIdx];

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-none overflow-hidden">
      {/* 頂部資訊欄 */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-start z-30">
        <div className="bg-black/60 backdrop-blur px-4 py-3 rounded-xl border border-blue-500/30 font-mono-tech">
          <div className="text-[10px] text-blue-400 uppercase font-bold">Progress</div>
          <div className="text-2xl font-black">{currentIdx + 1} / {TOTAL_QUESTIONS}</div>
        </div>
        <div className="bg-black/80 px-12 py-6 rounded-[2rem] border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]">
          <div className="text-5xl font-black font-mono-tech tracking-tighter">
            {q ? `${q.a} × ${q.b}` : 'DONE'}
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur px-4 py-3 rounded-xl border border-blue-500/30 text-right font-mono-tech">
          <div className="text-[10px] text-blue-400 uppercase font-bold">Score</div>
          <div className="text-2xl font-black">{score}</div>
          <button onClick={onQuit} className="text-[10px] text-rose-400 underline mt-1 block w-full text-right uppercase">Abort</button>
        </div>
      </div>

      {/* 隕石目標 */}
      {targets.map(t => (
        <div key={t.id} className={`absolute flex flex-col items-center transition-opacity duration-300 ${t.destroyed ? 'opacity-0 scale-150' : 'opacity-100'}`} style={{ left: `${t.x}%`, top: `${t.y + 10}%`, transform: 'translateX(-50%)' }}>
          {!t.destroyed && (
            <div className="w-16 h-1.5 bg-gray-950 rounded-full mb-3 overflow-hidden border border-white/10">
              <div className="h-full bg-cyan-400 transition-all shadow-[0_0_8px_cyan]" style={{ width: `${(t.hp/t.maxHp)*100}%` }} />
            </div>
          )}
          <div className={`w-32 h-32 flex items-center justify-center relative transition-transform ${t.flash > 0 ? 'scale-110 brightness-150' : ''}`}>
             <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-slate-700 drop-shadow-2xl">
               <path fill="currentColor" d="M25,50 Q10,20 50,10 Q90,20 80,50 Q90,80 50,90 Q10,80 25,50" />
               <circle cx="35" cy="35" r="4" fill="#1e293b" />
               <circle cx="70" cy="45" r="6" fill="#1e293b" />
               <circle cx="45" cy="70" r="3" fill="#1e293b" />
             </svg>
             <span className="relative z-10 text-4xl font-black font-mono-tech text-cyan-100 drop-shadow-md">{t.value}</span>
          </div>
        </div>
      ))}

      {/* 子彈 */}
      {bullets.map(b => (
        <div key={b.id} className="absolute w-1.5 h-10 bg-gradient-to-t from-cyan-400 to-white rounded-full shadow-[0_0_15px_cyan]" style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translateX(-50%)' }} />
      ))}

      {/* 飛船玩家 */}
      <div className="absolute bottom-12" style={{ left: `${shipX}%`, transform: 'translateX(-50%)' }}>
        <div className="w-16 h-20 relative">
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-14 bg-gradient-to-t from-transparent via-cyan-500 to-white rounded-full blur-sm animate-pulse" />
          <svg viewBox="0 0 40 60" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]">
            <path d="M20,0 L40,45 L30,40 L20,60 L10,40 L0,45 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// --- 4. 主入口組件 ---
const App = () => {
  const [state, setState] = useState(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState({ score: 0, accuracy: 0 });

  // 載入紀錄
  useEffect(() => {
    const saved = localStorage.getItem('space_math_v2_logs');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleGameEnd = (s, a) => {
    const newEntry = { level, score: s, accuracy: a, timestamp: Date.now() };
    const updated = [newEntry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('space_math_v2_logs', JSON.stringify(updated));
    setResult({ score: s, accuracy: a });
    setState(GameState.RESULT);
  };

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-white overflow-hidden">
      <Background />
      <div className="relative z-10 w-full h-full">
        
        {/* 選單畫面 */}
        {state === GameState.MENU && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 glow-text mb-2 tracking-tighter">SPACE MATH</h1>
            <p className="font-mono-tech text-blue-300 tracking-[0.4em] mb-16 opacity-80 uppercase text-sm">Galactic Defense Multiplication</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-12">
              {[
                { l: 1, r: '1x1 ~ 3x9' },
                { l: 2, r: '4x1 ~ 6x9' },
                { l: 3, r: '7x1 ~ 9x9' }
              ].map(lv => (
                <button key={lv.l} onClick={() => { setLevel(lv.l); setState(GameState.PLAYING); }} className="group relative p-12 rounded-[2.5rem] bg-slate-950 border border-white/10 hover:border-cyan-500 hover:scale-105 transition-all shadow-2xl active:scale-95">
                  <div className="text-[10px] text-blue-500 font-bold uppercase mb-2">Sector</div>
                  <div className="text-6xl font-black mb-2">LV {lv.l}</div>
                  <div className="text-sm opacity-50 font-mono-tech">{lv.r}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setState(GameState.HISTORY)} className="px-12 py-4 border border-cyan-500/30 text-cyan-400 rounded-full hover:bg-cyan-500/10 transition-all font-bold tracking-widest uppercase text-xs">Mission History</button>
          </div>
        )}

        {/* 遊戲中 */}
        {state === GameState.PLAYING && <GameEngine level={level} onEnd={handleGameEnd} onQuit={() => setState(GameState.MENU)} />}

        {/* 結果畫面 */}
        {state === GameState.RESULT && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in zoom-in duration-500">
            <div className="bg-slate-950/80 border-2 border-cyan-500/30 p-16 rounded-[3rem] shadow-2xl max-w-md w-full backdrop-blur-xl">
              <h2 className="text-5xl font-black text-cyan-400 mb-2 glow-text uppercase">Mission Success</h2>
              <p className="font-mono-tech text-slate-500 tracking-widest uppercase mb-12 italic">Level {level} Debriefing</p>
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div><div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Score</div><div className="text-4xl font-black">{result.score}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Accuracy</div><div className="text-4xl font-black">{result.accuracy}%</div></div>
              </div>
              <button onClick={() => setState(GameState.MENU)} className="w-full py-5 bg-cyan-600 rounded-2xl text-xl font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/40">RETURN TO BASE</button>
            </div>
          </div>
        )}

        {/* 歷史紀錄 */}
        {state === GameState.HISTORY && (
          <div className="flex flex-col items-center h-full py-20 px-8 overflow-y-auto">
            <h2 className="text-5xl font-black text-cyan-400 mb-2 glow-text uppercase tracking-tighter">Flight Logs</h2>
            <p className="text-slate-500 mb-16 font-mono-tech uppercase tracking-widest text-xs">Recent Performance Analytics</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl mb-16">
              {[1, 2, 3].map(lvl => (
                <div key={lvl} className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black">LV {lvl}</h3>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold">LAST 5</span>
                  </div>
                  <div className="space-y-4">
                    {history.filter(h => h.level === lvl).slice(0, 5).map((h, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                        <div>
                          <div className="text-lg font-bold">{h.score} <span className="text-[10px] opacity-40 font-normal">pts</span></div>
                          <div className="text-[9px] text-slate-500 uppercase font-mono-tech">{new Date(h.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div className="text-2xl font-black font-mono-tech text-cyan-400">{h.accuracy}%</div>
                      </div>
                    ))}
                    {history.filter(h => h.level === lvl).length === 0 && <div className="text-center py-12 text-slate-700 italic font-mono-tech uppercase tracking-widest text-xs">No logs recorded</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setState(GameState.MENU)} className="px-14 py-5 bg-white/10 rounded-full hover:bg-white/20 transition-all font-bold border border-white/10 shadow-xl">BACK TO MENU</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 掛載至 DOM ---
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
