"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  History, 
  Volume2, 
  VolumeX, 
  Zap, 
  Sparkles, 
  Wallet, 
  AlertCircle
} from "lucide-react";

/**
 * ------------------------------------------------------------------
 * CONFIGURATION & CONSTANTS
 * ------------------------------------------------------------------
 */
const PRIZES = [
  { label: "۵۰ میلیون", value: 50000000, color: "#F59E0B", type: "gold", gradient: "url(#grad-gold)" },
  { label: "پوچ", value: 0, color: "#1F2937", type: "loss", gradient: "url(#grad-dark)" },
  { label: "۵ میلیون", value: 5000000, color: "#3B82F6", type: "blue", gradient: "url(#grad-blue)" },
  { label: "۱۰ شانس", value: "chance_10", color: "#EC4899", type: "bonus", gradient: "url(#grad-pink)" },
  { label: "۱۰ میلیون", value: 10000000, color: "#10B981", type: "cash", gradient: "url(#grad-green)" },
  { label: "پوچ", value: 0, color: "#1F2937", type: "loss", gradient: "url(#grad-dark)" },
  { label: "۱۰۰ میلیون", value: 100000000, color: "#8B5CF6", type: "epic", gradient: "url(#grad-purple)" },
  { label: "۱ شانس", value: "chance_1", color: "#EF4444", type: "retry", gradient: "url(#grad-red)" },
];

const SPIN_COST = 2;
const WHEEL_SIZE = 600;

/**
 * ------------------------------------------------------------------
 * AUDIO SYSTEM
 * ------------------------------------------------------------------
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  toggle(state: boolean) {
    this.enabled = state;
    if (state && this.ctx?.state === "suspended") this.ctx.resume();
  }

  playTick() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Create a sharp "Click" sound using a short noise burst or high frequency decay
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = "square"; // Snappier sound
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.03);
    
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    
    osc.start(t);
    osc.stop(t + 0.03);
  }

  playWin() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.6);
    });
  }

  playLose() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.4);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

/**
 * ------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", x, y
  ].join(" ");
}

/**
 * ------------------------------------------------------------------
 * COMPONENTS
 * ------------------------------------------------------------------
 */
const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-4 rounded-sm"
        style={{
          backgroundColor: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'][i % 5],
          top: '-20px',
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: ['0vh', '100vh'],
          x: [0, (Math.random() - 0.5) * 200],
          rotate: [0, Math.random() * 720],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 2.5 + Math.random() * 2,
          ease: "linear",
          repeat: Infinity,
          delay: Math.random() * 2
        }}
      />
    ))}
  </div>
);

const WheelSVG = ({ rotation }: { rotation: number }) => {
  const numSegments = PRIZES.length;
  const anglePerSegment = 360 / numSegments;
  const radius = WHEEL_SIZE / 2;
  const center = WHEEL_SIZE / 2;

  const renderDefs = () => (
    <defs>
      <radialGradient id="grad-gold" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#FFF7CC" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>
      <radialGradient id="grad-dark" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#111827" />
      </radialGradient>
      <radialGradient id="grad-blue" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </radialGradient>
      <radialGradient id="grad-pink" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#FBCFE8" />
        <stop offset="100%" stopColor="#BE185D" />
      </radialGradient>
      <radialGradient id="grad-green" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#047857" />
      </radialGradient>
      <radialGradient id="grad-purple" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="100%" stopColor="#6D28D9" />
      </radialGradient>
      <radialGradient id="grad-red" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="100%" stopColor="#B91C1C" />
      </radialGradient>
    </defs>
  );

  return (
    <div className="relative w-full h-full">
      {/* Outer Case (Static) */}
      <div className="absolute inset-[-4%] rounded-full border-[14px] border-slate-900 bg-slate-800 shadow-2xl z-0 overflow-hidden">
         {/* Lights */}
         {Array.from({ length: 24 }).map((_, i) => (
           <div
             key={i}
             className="absolute w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#FACC15]"
             style={{
               top: '50%',
               left: '50%',
               transform: `rotate(${i * 15}deg) translate(${WHEEL_SIZE/2 * 1.07 / 2}px)`,
               animation: `blink 1.5s infinite ${i % 2 === 0 ? '0s' : '0.75s'}`
             }}
           />
         ))}
      </div>

      {/* Rotating Wheel */}
      <motion.div
        className="relative w-full h-full z-10"
        style={{ rotate: rotation }}
      >
        <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="w-full h-full transform transition-transform drop-shadow-2xl">
          {renderDefs()}
          
          <g>
          {PRIZES.map((prize, index) => {
            const startAngle = index * anglePerSegment;
            const endAngle = (index + 1) * anglePerSegment;
            const midAngle = startAngle + anglePerSegment / 2;
            const textPos = polarToCartesian(center, center, radius * 0.75, midAngle);
            
            // Calculate Peg Position (at the end of the segment line)
            const pegPos = polarToCartesian(center, center, radius * 0.95, endAngle);

            return (
              <g key={index}>
                <path
                  d={describeArc(center, center, radius, startAngle, endAngle)}
                  fill={prize.gradient}
                  stroke="#0F172A"
                  strokeWidth="3"
                />
                
                {/* Inner Highlight Ring within segment */}
                <path
                  d={describeArc(center, center, radius * 0.96, startAngle, endAngle)}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                />

                {/* Text Group */}
                <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${midAngle + 90})`}>
                  <text
                    x="0"
                    y="0"
                    fill="white"
                    fontSize="28"
                    fontWeight="900"
                    fontFamily="Vazirmatn, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.6)" }}
                  >
                    {prize.label}
                  </text>
                  {typeof prize.value === 'number' && prize.value > 0 && (
                      <text x="0" y="24" fill="rgba(255,255,255,0.8)" fontSize="14" fontWeight="600" textAnchor="middle">تومان</text>
                  )}
                </g>

                {/* The Peg (Physical thing for pointer to hit) */}
                <circle 
                  cx={pegPos.x} 
                  cy={pegPos.y} 
                  r="5" 
                  fill="#E2E8F0" 
                  stroke="#0F172A" 
                  strokeWidth="2"
                  className="shadow-sm"
                />
              </g>
            );
          })}
          </g>
        </svg>
      </motion.div>
      
      {/* Center Hub (Static, Perfect Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
         <div className="w-24 h-24 rounded-full bg-slate-900 border-[6px] border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex items-center justify-center relative">
             {/* Spinning inner part */}
             <div className="absolute inset-2 rounded-full border-[2px] border-yellow-500/30 border-dashed animate-[spin_10s_linear_infinite]"></div>
             
             {/* Central Bolt/Nut */}
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-700 shadow-inner flex items-center justify-center border border-yellow-300/50">
                 <div className="w-8 h-8 rounded-full bg-yellow-300/20 flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-100 rounded-full shadow-[0_0_5px_white]"></div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// Separate Pointer Component for precise positioning
const Pointer = ({ tickAnim }: { tickAnim: any }) => {
    return (
        <div 
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 w-16 h-20 flex justify-center pointer-events-none" 
            style={{ 
                // Using transform only for the internal kick, positioning handled by flex/absolute
            }}
        >
            <motion.div animate={tickAnim} className="relative w-full h-full flex flex-col items-center origin-[50%_15px]">
                {/* Mounting Plate */}
                <div className="w-12 h-12 bg-slate-800 rounded-full border-[4px] border-slate-600 shadow-lg flex items-center justify-center relative z-20">
                    <div className="w-4 h-4 bg-slate-400 rounded-full shadow-inner border border-slate-500"></div>
                </div>
                {/* The Pointer Blade */}
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[55px] border-t-red-600 relative -mt-6 z-10 filter drop-shadow-[0_4px_2px_rgba(0,0,0,0.3)]"></div>
            </motion.div>
        </div>
    );
}

/**
 * ------------------------------------------------------------------
 * MAIN COMPONENT
 * ------------------------------------------------------------------
 */
export default function WheelOfFortune() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [chances, setChances] = useState(20);
  const [credits, setCredits] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState<{ label: string; time: string; win: boolean; amount?: number }[]>([]);
  const [winModal, setWinModal] = useState<any>(null);
  
  const pointerControl = useAnimation();
  const audioRef = useRef<SoundEngine | null>(null);
  const rotationRef = useRef(0);
  const frameRef = useRef<number>(0);
  
  useEffect(() => {
    audioRef.current = new SoundEngine();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    audioRef.current?.toggle(soundEnabled);
  }, [soundEnabled]);

  const triggerTick = () => {
    audioRef.current?.playTick();
    // Sharper kick back animation
    pointerControl.start({
        rotate: [0, -25, 5, 0], // Kick back, overshoot slightly forward, settle
        transition: { duration: 0.15, ease: "easeOut" }
    });
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (chances < SPIN_COST) return;

    setChances(prev => prev - SPIN_COST);
    setIsSpinning(true);
    setWinModal(null);
    if (audioRef.current) audioRef.current.toggle(soundEnabled);

    // 1. CHOOSE PRIZE
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const numSegments = PRIZES.length;
    const anglePerSegment = 360 / numSegments; // 45 degrees
    
    // 2. TARGET CALCULATION
    // Center of prize aligns to top (0/360)
    const centerAngleOfPrize = (prizeIndex * anglePerSegment) + (anglePerSegment / 2);
    const targetAlignment = (360 - centerAngleOfPrize);
    
    // 3. RANDOM JITTER (Stay away from pegs)
    // +/- 12 degrees safe zone
    const randomOffset = (Math.random() * 2 - 1) * (anglePerSegment / 2 * 0.6); 
    
    // 4. SPINS
    const spins = 360 * (5 + Math.floor(Math.random() * 5));
    
    // 5. FINAL CALC
    const currentRotMod = rotationRef.current % 360;
    const distToTarget = targetAlignment - currentRotMod;
    const forwardDist = distToTarget >= 0 ? distToTarget : 360 + distToTarget;
    
    const finalTargetRotation = rotationRef.current + forwardDist + spins + randomOffset;
    
    // ANIMATION
    const duration = 6000;
    const startTime = performance.now();
    const startRot = rotationRef.current;
    let lastSegmentIndex = -1;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
      
      const currentRot = startRot + (finalTargetRotation - startRot) * ease;
      setRotation(currentRot);
      rotationRef.current = currentRot;

      // TICK LOGIC (PEG DETECTION)
      // Pegs are at angles: 0, 45, 90...
      // We check if a peg passes the top (0 deg).
      // Angle of wheel at top = (360 - (currentRot % 360)) % 360.
      // If this angle is close to a peg angle (multiples of 45), trigger.
      
      const normalizedRot = currentRot % 360;
      // We are looking for when the rotation crosses a multiple of 45.
      // Current logical segment index at top:
      // The top pointer is at angle 0 relative to screen.
      // Relative to wheel, it points to angle: (360 - normalizedRot)
      const wheelAngleAtTop = (360 - normalizedRot) % 360;
      
      // Since pegs are at the END of segments, they are at: 45, 90, 135...
      // Index 0 ends at 45.
      const currentPassingPegIndex = Math.floor(wheelAngleAtTop / anglePerSegment);

      if (currentPassingPegIndex !== lastSegmentIndex && progress < 1) {
          triggerTick();
          lastSegmentIndex = currentPassingPegIndex;
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        finishSpin(prizeIndex);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  const finishSpin = (index: number) => {
    setIsSpinning(false);
    const prize = PRIZES[index];
    const isWin = prize.type !== 'loss';
    
    if (isWin) {
      audioRef.current?.playWin();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      
      if (typeof prize.value === 'number') setCredits(p => p + (prize.value as number));
      if (prize.value === 'chance_10') setChances(p => p + 10);
      if (prize.value === 'chance_1') setChances(p => p + 1);

      setWinModal(prize);
    } else {
      audioRef.current?.playLose();
      if (navigator.vibrate) navigator.vibrate(300);
    }

    setHistory(prev => [{
        label: prize.label,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        win: isWin
    }, ...prev].slice(0, 8));
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-[Vazirmatn] dir-rtl select-none overflow-x-hidden">
      
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

      <AnimatePresence>
        {winModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setWinModal(null)}
          >
            <Confetti />
            <motion.div 
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-slate-900 border border-yellow-500/30 p-1 rounded-[2.5rem] shadow-[0_0_100px_rgba(234,179,8,0.2)] max-w-md w-full relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full -z-10 animate-pulse"></div>
                
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] p-8 text-center border border-white/5">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce">
                        <Trophy className="w-12 h-12 text-white" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2">تبریک!</h2>
                    <p className="text-slate-400 mb-8">شما برنده جایزه شدید</p>
                    
                    <div className="py-6 px-4 bg-slate-950/50 rounded-2xl border border-yellow-500/20 mb-8">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-sm">
                            {winModal.label}
                        </span>
                    </div>

                    <button 
                        onClick={() => setWinModal(null)}
                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl text-lg transition-all shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-1"
                    >
                        دریافت جایزه
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Sparkles className="text-white w-7 h-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                    گردونه <span className="text-yellow-400">میلیونی</span>
                </h1>
                <p className="text-slate-400 text-xs font-bold mt-1 bg-slate-800/50 inline-block px-2 py-1 rounded-md">
                    نسخه ویژه VIP
                </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
             <div className="h-14 px-6 bg-slate-900 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-inner min-w-[180px]">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">موجودی</span>
                    <span className="font-bold text-lg font-mono tracking-tight">{credits.toLocaleString()}</span>
                </div>
             </div>
             
             <div className="h-14 px-6 bg-slate-900 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-inner min-w-[160px]">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">شانس</span>
                    <span className="font-bold text-lg text-yellow-400">{chances}</span>
                </div>
             </div>

             <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all active:scale-95"
             >
                 {soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-400" /> : <VolumeX className="w-6 h-6 text-slate-600" />}
             </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
             <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/5 p-5">
                 <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-4">
                     <History className="w-5 h-5 text-indigo-400" />
                     آخرین نتایج
                 </h3>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {history.length === 0 && <div className="text-center text-slate-600 text-sm py-8">تاریخچه‌ای موجود نیست</div>}
                     {history.map((h, i) => (
                         <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                 <div className={`w-2 h-8 rounded-full ${h.win ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                 <div className="flex flex-col">
                                     <span className="text-sm font-bold text-slate-200">{h.label}</span>
                                     <span className="text-[10px] text-slate-500">{h.time}</span>
                                 </div>
                             </div>
                             {h.win && <span className="text-emerald-500 text-xs font-bold">برنده</span>}
                         </div>
                     ))}
                 </div>
             </div>
             
             <div className="bg-indigo-900/20 rounded-3xl p-5 border border-indigo-500/20">
                 <div className="flex gap-3">
                     <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                     <p className="text-xs text-indigo-200 leading-relaxed">
                         هر چرخش {SPIN_COST} شانس کسر می‌کند. جوایز به صورت آنی به کیف پول اضافه می‌شوند.
                     </p>
                 </div>
             </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2 py-4">
              <div className="relative w-[340px] h-[340px] md:w-[500px] md:h-[500px] select-none">
                  {/* The Wheel SVG */}
                  <WheelSVG rotation={rotation} />
                  
                  {/* The Pointer (Rendered outside for layering) */}
                  <Pointer tickAnim={pointerControl} />
                  
                  {/* Center Shine Overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10"></div>
              </div>

              <div className="mt-12 w-full max-w-xs relative group">
                  <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || chances < SPIN_COST}
                    className={`
                        relative w-full py-5 rounded-2xl font-black text-xl tracking-wider uppercase transition-all
                        border-b-4 active:border-b-0 active:translate-y-1
                        flex items-center justify-center gap-3
                        ${isSpinning || chances < SPIN_COST 
                            ? 'bg-slate-700 text-slate-500 border-slate-900 cursor-not-allowed grayscale' 
                            : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 border-yellow-700 hover:brightness-110'
                        }
                    `}
                  >
                      {isSpinning ? (
                          <>در حال چرخش...</>
                      ) : (
                          <>
                            <Zap className="w-6 h-6 fill-slate-900" />
                            شروع چرخش
                          </>
                      )}
                  </button>
              </div>
          </div>

          <div className="lg:col-span-3 hidden lg:block order-3">
             <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/5 p-5 h-full">
                 <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-6">
                     <Trophy className="w-5 h-5 text-yellow-500" />
                     برترین‌های امروز
                 </h3>
                 <div className="space-y-4">
                     {[
                         { n: "رضا م.", p: "۱۰۰,۰۰۰,۰۰۰", t: "gold" },
                         { n: "سارا ک.", p: "۵۰,۰۰۰,۰۰۰", t: "silver" },
                         { n: "امید ج.", p: "۱۰,۰۰۰,۰۰۰", t: "bronze" },
                         { n: "مهدی پ.", p: "۱۰,۰۰۰,۰۰۰", t: "normal" },
                         { n: "نگین س.", p: "۵,۰۰۰,۰۰۰", t: "normal" },
                     ].map((user, i) => (
                         <div key={i} className="flex items-center gap-3">
                             <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                                ${user.t === 'gold' ? 'bg-yellow-500 text-yellow-900' : 
                                  user.t === 'silver' ? 'bg-slate-300 text-slate-900' :
                                  user.t === 'bronze' ? 'bg-orange-400 text-orange-900' :
                                  'bg-slate-700 text-slate-400'}
                             `}>
                                 {i + 1}
                             </div>
                             <div className="flex-1">
                                 <div className="text-sm font-bold text-white">{user.n}</div>
                                 <div className="text-xs text-yellow-500/80 font-mono">{user.p}</div>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-white/5">
                     <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-center">
                         <p className="text-xs text-white/70 mb-1">جایزه بزرگ هفته</p>
                         <p className="text-2xl font-black text-white drop-shadow-md">۲۰۶ تیپ ۵</p>
                         <div className="mt-2 text-[10px] bg-black/20 inline-block px-2 py-1 rounded">قرعه کشی جمعه</div>
                     </div>
                 </div>
             </div>
          </div>

        </div>
      </div>
      
      <style jsx global>{`
        @keyframes blink {
            0%, 100% { opacity: 1; box-shadow: 0 0 10px #FACC15; }
            50% { opacity: 0.3; box-shadow: none; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
}