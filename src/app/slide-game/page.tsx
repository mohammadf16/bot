"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, Trophy, Zap, AlertCircle, Play, RotateCcw, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"

export default function SlideGame() {
  const [gameState, setGameState] = useState<"idle" | "spinning" | "won">("idle")
  const [result, setResult] = useState<number | null>(null)
  const [targetNumber, setTargetNumber] = useState(55) // Example target for win
  const [currentValue, setCurrentValue] = useState(0)
  
  const spin = () => {
    if (gameState === "spinning") return
    
    setGameState("spinning")
    const duration = 3000
    const start = Date.now()
    const finalValue = Math.floor(Math.random() * 1000)

    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing out
      const ease = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(ease * finalValue)
      setCurrentValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setResult(current)
        setGameState("won")
        if (current === targetNumber) {
          toast.success("تبریک! شما برنده خودرو شدید!")
        }
      }
    }
    
    requestAnimationFrame(animate)
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-accent-gold font-bold tracking-widest text-sm mb-4"
          >
            <Zap size={16} />
            LIVE SLIDE GAME
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            ماشین <span className="text-accent-gold">اسلاید</span>
          </h1>
          <p className="text-white/40 max-w-xl mx-auto font-bold">
            عدد شانس خود را پیدا کنید. اگر عدد نهایی با عدد مشخص شده توسط سیستم یکی باشد، برنده خودرو خواهید بود!
          </p>
        </div>

        {/* Game Container */}
        <div className="relative bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-8 md:p-20 overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.05)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-accent-gold/20 z-0" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Number Display */}
            <div className="mb-16 relative">
              <motion.div 
                className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-white select-none"
                animate={gameState === "spinning" ? { 
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1]
                } : {}}
                transition={{ repeat: Infinity, duration: 0.1 }}
              >
                {currentValue.toString().padStart(2, '0')}
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
            </div>

            {/* Target Info */}
            <div className="flex gap-4 mb-12">
              <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="text-accent-gold w-5 h-5" />
                <span className="text-xs font-bold text-white/40 uppercase">Target Number:</span>
                <span className="text-xl font-black text-accent-gold">{targetNumber}</span>
              </div>
            </div>

            {/* Controls */}
            <button
              onClick={spin}
              disabled={gameState === "spinning"}
              className={`
                group relative px-12 py-6 rounded-3xl font-black text-xl transition-all duration-500
                ${gameState === "spinning" 
                  ? "bg-white/5 text-white/20 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-accent-gold hover:scale-105 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"}
              `}
            >
              <div className="flex items-center gap-4">
                {gameState === "spinning" ? (
                  <>
                    <RotateCcw className="animate-spin" />
                    در حال اسلاید...
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" />
                    شروع بازی (۱ شانس)
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Result Overlay */}
          <AnimatePresence>
            {gameState === "won" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
              >
                <Trophy size={80} className="text-accent-gold mb-6" />
                <h2 className="text-4xl font-black mb-4">نتیجه اسلاید: {result}</h2>
                <p className="text-white/60 mb-10 max-w-sm">
                  {result === targetNumber 
                    ? "فوق‌العاده است! شما برنده جایزه ویژه شدید. تیم پشتیبانی با شما تماس خواهد گرفت."
                    : "متاسفانه این بار شانس با شما نبود. اما نگران نباشید، ۲۰٪ کش‌بک به حساب شما برگشت داده شد!"}
                </p>
                <button 
                  onClick={() => setGameState("idle")}
                  className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-accent-gold transition-colors"
                >
                  تلاش دوباره
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex items-start gap-4">
            <AlertCircle className="text-accent-gold shrink-0" />
            <p className="text-xs text-white/40 leading-relaxed font-bold">
              هر بار بازی ۱ شانس از حساب شما کسر می‌کند. شانس‌ها را می‌توانید از طریق خرید بلیط یا زیرمجموعه‌گیری به دست آورید.
            </p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex items-start gap-4">
            <ShieldCheck className="text-accent-cyan shrink-0" />
            <p className="text-xs text-white/40 leading-relaxed font-bold">
              تمام نتایج توسط سیستم هشینگ بلاکچین هش شده و کاملاً قابل رهگیری و منصفانه هستند.
            </p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex items-start gap-4">
            <Trophy className="text-emerald-500 shrink-0" />
            <p className="text-xs text-white/40 leading-relaxed font-bold">
              نفرات برتر هر ماه بر اساس تعداد بازی، جوایز نقدی ویژه‌ای دریافت خواهند کرد.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
