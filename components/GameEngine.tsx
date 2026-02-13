

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, Bullet, Target } from '../types';

interface GameEngineProps {
  level: number;
  onEnd: (score: number, accuracy: number, completed: boolean) => void;
  onQuit: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ level, onEnd, onQuit }) => {
  // Game Configuration
  const TOTAL_QUESTIONS = 10;
  const HITS_TO_DESTROY = 7; 

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shipX, setShipX] = useState(50); // percentage
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  
  // Refs for logic
  // Fix: Added initial value 0 to satisfy useRef's requirement for exactly 1 argument.
  const requestRef = useRef<number>(0);
  const lastFireTime = useRef(0);
  const nextBulletId = useRef(0);
  const targetsRef = useRef<Target[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate Questions
  useEffect(() => {
    const generateLevelQuestions = (): Question[] => {
      const qs: Question[] = [];
      const usedPairs = new Set<string>();
      
      let poolA: number[] = [];
      if (level === 1) poolA = [1, 2, 3];
      else if (level === 2) poolA = [4, 5, 6];
      else poolA = [7, 8, 9];

      while (qs.length < TOTAL_QUESTIONS) {
        const a = poolA[Math.floor(Math.random() * poolA.length)];
        const b = Math.floor(Math.random() * 9) + 1;
        const key = `${a}x${b}`;
        if (!usedPairs.has(key)) {
          usedPairs.add(key);
          const answer = a * b;
          
          const options = [answer];
          while (options.length < 3) {
            const wrong = (poolA[Math.floor(Math.random() * poolA.length)] * (Math.floor(Math.random() * 9) + 1));
            if (!options.includes(wrong) && wrong !== answer) {
              options.push(wrong);
            }
          }
          
          qs.push({
            id: Math.random().toString(),
            a, b, answer,
            options: options.sort(() => Math.random() - 0.5)
          });
        }
      }
      return qs;
    };

    setQuestions(generateLevelQuestions());
  }, [level]);

  // Spawn Targets (Monsters)
  useEffect(() => {
    if (questions.length > 0 && currentIdx < questions.length) {
      const q = questions[currentIdx];
      const newTargets: Target[] = q.options.map((val, i) => ({
        id: i,
        value: val,
        x: 20 + i * 30, 
        y: -10,
        hp: val === q.answer ? HITS_TO_DESTROY : 1,
        maxHp: val === q.answer ? HITS_TO_DESTROY : 1,
        isCorrect: val === q.answer,
        destroyed: false,
        hitFlash: 0
      }));
      setTargets(newTargets);
      targetsRef.current = newTargets;
    }
  }, [currentIdx, questions]);

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setShipX(Math.max(0, Math.min(100, x)));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setShipX(prev => Math.max(0, prev - 5));
      if (e.key === 'ArrowRight') setShipX(prev => Math.min(100, prev + 5));
      if (e.key === 'Enter') setIsFiring(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') setIsFiring(false);
    };

    const handleMouseDown = () => setIsFiring(true);
    const handleMouseUp = () => setIsFiring(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Main Game Loop
  const update = useCallback(() => {
    const now = Date.now();
    
    if (isFiring && now - lastFireTime.current > 150) {
      const newBullet: Bullet = { id: nextBulletId.current++, x: shipX, y: 85 };
      bulletsRef.current = [...bulletsRef.current, newBullet];
      lastFireTime.current = now;
      setTotalAttempts(prev => prev + 1);
    }

    bulletsRef.current = bulletsRef.current
      .map(b => ({ ...b, y: b.y - 2.5 }))
      .filter(b => b.y > -5);

    targetsRef.current = targetsRef.current.map(t => {
      if (t.destroyed) return t;
      const targetY = Math.min(t.y + 0.05, 15);
      return { ...t, y: targetY, hitFlash: Math.max(0, t.hitFlash - 0.1) };
    });

    const usedBulletIds = new Set<number>();

    bulletsRef.current.forEach(bullet => {
      targetsRef.current.forEach(target => {
        if (!target.destroyed) {
          const dx = Math.abs(bullet.x - target.x);
          const dy = Math.abs(bullet.y - (target.y + 10)); // Offset for monster vertical center
          if (dx < 7 && dy < 10) {
            usedBulletIds.add(bullet.id);
            target.hp -= 1;
            target.hitFlash = 1;
            if (target.hp <= 0) {
              target.destroyed = true;
              if (target.isCorrect) {
                setScore(s => s + 100);
              } else {
                setScore(s => Math.max(0, s - 50));
              }
            }
          }
        }
      });
    });

    bulletsRef.current = bulletsRef.current.filter(b => !usedBulletIds.has(b.id));

    const correctTarget = targetsRef.current.find(t => t.isCorrect);
    if (correctTarget?.destroyed) {
      setTimeout(() => {
        if (currentIdx + 1 >= TOTAL_QUESTIONS) {
          onEnd(score + 100, Math.min(100, Math.round((TOTAL_QUESTIONS / totalAttempts) * 100 * 5)), true);
        } else {
          setCurrentIdx(prev => prev + 1);
        }
      }, 500);
      return;
    }

    setBullets([...bulletsRef.current]);
    setTargets([...targetsRef.current]);

    requestRef.current = requestAnimationFrame(update);
  }, [isFiring, shipX, currentIdx, score, totalAttempts, onEnd]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  const currentQuestion = questions[currentIdx];

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-none overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20">
        <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-blue-500/30">
          <div className="text-blue-400 text-xs uppercase font-bold mb-1">Mission Progress</div>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2 w-6 rounded-full transition-colors ${i < currentIdx ? 'bg-green-500' : i === currentIdx ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono-tech">
            {currentIdx + 1} <span className="text-sm text-slate-400 font-normal">/ {TOTAL_QUESTIONS}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-black/80 px-10 py-4 rounded-2xl border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <div className="text-cyan-400 text-sm font-mono-tech mb-1 text-center">ELIMINATE TARGET</div>
            <div className="text-5xl font-black text-white tracking-widest font-mono-tech">
              {currentQuestion ? `${currentQuestion.a} × ${currentQuestion.b}` : 'LOADING...'}
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-blue-500/30 text-right">
          <div className="text-blue-400 text-xs uppercase font-bold mb-1">Score</div>
          <div className="text-3xl font-black text-white font-mono-tech">{score.toLocaleString()}</div>
          <button 
            onClick={onQuit}
            className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline uppercase tracking-tighter"
          >
            Abort Mission
          </button>
        </div>
      </div>

      {/* Targets (Monsters) */}
      {targets.map(target => (
        <div 
          key={target.id}
          className={`absolute flex flex-col items-center transition-all duration-300 ${target.destroyed ? 'opacity-0 scale-150 rotate-12' : 'opacity-100'}`}
          style={{ left: `${target.x}%`, top: `${target.y + 10}%`, transform: 'translateX(-50%)' }}
        >
          {/* Health Bar - Uniform color (Orange) to avoid leaking the correct answer */}
          {!target.destroyed && (
            <div className="w-20 h-2 bg-slate-800 rounded-full mb-2 overflow-hidden border border-white/20">
              <div 
                className={`h-full transition-all bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]`}
                style={{ width: `${(target.hp / target.maxHp) * 100}%` }}
              />
            </div>
          )}
          
          {/* Monster Visual */}
          <div className={`relative w-24 h-28 md:w-32 md:h-36 flex items-center justify-center transition-transform ${target.hitFlash > 0 ? 'scale-110 brightness-150' : 'scale-100'}`}>
             <svg viewBox="0 0 100 120" className={`absolute inset-0 w-full h-full drop-shadow-2xl text-emerald-800`}>
                {/* Body Silhouette (Godzilla-like) */}
                <path 
                  fill="currentColor" 
                  stroke={target.hitFlash > 0 ? '#fff' : '#059669'}
                  strokeWidth="2"
                  d="M50,10 C65,10 75,20 75,35 L75,45 C85,50 95,65 95,85 C95,105 80,115 50,115 C20,115 5,105 5,85 C5,65 15,50 25,45 L25,35 C25,20 35,10 50,10 Z"
                />
                {/* Spikes */}
                <path fill="#065f46" d="M50,5 L55,15 L45,15 Z M65,15 L70,25 L60,25 Z M35,15 L40,25 L30,25 Z" />
                {/* Glowing Eyes */}
                <circle cx="40" cy="30" r="2.5" fill={target.hitFlash > 0 ? '#fff' : '#f87171'} />
                <circle cx="60" cy="30" r="2.5" fill={target.hitFlash > 0 ? '#fff' : '#f87171'} />
                {/* Mouth */}
                <path d="M40,40 Q50,45 60,40" stroke="#000" fill="none" opacity="0.3" strokeWidth="2" />
             </svg>
             <span className={`relative z-10 text-3xl md:text-4xl font-black font-mono-tech ${target.hitFlash > 0 ? 'text-white' : 'text-cyan-300'} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
               {target.value}
             </span>
          </div>
        </div>
      ))}

      {/* Bullets */}
      {bullets.map(bullet => (
        <div 
          key={bullet.id}
          className="absolute w-1 h-8 bg-gradient-to-t from-cyan-400 to-white rounded-full shadow-[0_0_15px_rgba(34,211,238,0.9)]"
          style={{ left: `${bullet.x}%`, top: `${bullet.y}%`, transform: 'translateX(-50%)' }}
        />
      ))}

      {/* Player Ship */}
      <div 
        className="absolute bottom-10 flex flex-col items-center pointer-events-none transition-all duration-75"
        style={{ left: `${shipX}%`, transform: 'translateX(-50%)' }}
      >
        <div className="relative w-16 h-16">
          {/* Ship Flame */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-12 bg-gradient-to-t from-transparent via-cyan-500 to-white rounded-full blur-sm animate-pulse" />
          
          {/* Ship Body */}
          <svg viewBox="0 0 60 80" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <path d="M30,0 L60,60 L45,55 L30,80 L15,55 L0,60 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <rect x="25" y="30" width="10" height="15" fill="#22d3ee" opacity="0.6" />
            <path d="M30,10 L35,25 L25,25 Z" fill="#fff" opacity="0.8" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GameEngine;
