"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle } from "lucide-react"
import confetti from "canvas-confetti"
import toast from "react-hot-toast"

interface GameSession {
  position: number
  result: "idle" | "playing" | "won" | "lost"
  targetNumber: number
  reward: number
  totalSpins: number
  wins: number
}

export default function SlidePage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle")
  const [carPosition, setCarPosition] = useState(0)
  const [targetNumber, setTargetNumber] = useState<number>(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sessionStats, setSessionStats] = useState<GameSession>({
    position: 0,
    result: "idle",
    targetNumber: 0,
    reward: 0,
    totalSpins: 0,
    wins: 0,
  })

  const WINNING_THRESHOLD = 80

  const startGame = () => {
    setGameState("playing")
    setCarPosition(0)
    const newTarget = Math.floor(Math.random() * 100) + 1
    setTargetNumber(newTarget)
    setSessionStats((prev) => ({ ...prev, totalSpins: prev.totalSpins + 1, targetNumber: newTarget }))
  }

  const stopGame = () => {
    if (gameState !== "playing") return

    const isWin = carPosition >= WINNING_THRESHOLD
    setGameState(isWin ? "won" : "lost")

    if (isWin) {
      setSessionStats((prev) => ({
        ...prev,
        wins: prev.wins + 1,
        reward: prev.reward + Math.floor(carPosition * 100),
      }))
      if (soundEnabled) {
        const audio = new Audio("/sounds/win.mp3")
        audio.volume = 0.5
        audio.play().catch(() => {})
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FCD34D", "#10B981", "#22D3EE"],
      })
      toast.success(`🎉 تبریک! موفق شدید با ${Math.floor(carPosition)}%`)
    } else {
      toast.error(`😔 نزدیک شدید اما نرسیدید`)
    }
  }

  // Simulate car movement during game
  useEffect(() => {
    if (gameState !== "playing") return

    const interval = setInterval(() => {
      setCarPosition((prev) => {
        if (prev >= 100) {
          setGameState("won")
          return prev
        }
        return prev + Math.random() * 3 + 0.5
      })
    }, 100)

    return () => clearInterval(interval)
  }, [gameState])

  const progressColor = useMemo(() => {
    if (carPosition < 33) return "from-red-500 to-orange-500"
    if (carPosition < 66) return "from-orange-500 to-yellow-500"
    if (carPosition < WINNING_THRESHOLD) return "from-yellow-500 to-emerald-500"
    return "from-emerald-500 to-green-500"
  }, [carPosition])

  return (
    <main className="min-h-screen pt-16 pb-20 px-4 sm:px-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-6">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 p-4 sm:p-5 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none" />
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">مسیر سبقت</h1>
                  <p className="text-xs text-white/60">سباق سرعت</p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/60 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Game Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-6 sm:p-8 h-full"
            >
              <AnimatePresence mode="wait">
                {gameState === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-10 sm:py-12"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl sm:text-7xl mb-4 drop-shadow-lg"
                    >
                      🏎️
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">آماده‌اید؟</h2>
                    <p className="text-white/60 text-sm sm:text-base mb-6">ماشین را تا ۸۰٪ برسانید</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 text-sm sm:text-base"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Play className="w-4 h-4" />
                        شروع
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {gameState === "playing" && (
                  <motion.div
                    key="playing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 sm:space-y-8"
                  >
                    {/* Position Display */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10">
                        <p className="text-white/60 text-xs mb-1">موقعیت</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-400">{Math.floor(carPosition)}%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10">
                        <p className="text-white/60 text-xs mb-1">هدف</p>
                        <p className="text-2xl sm:text-3xl font-bold text-cyan-400">{WINNING_THRESHOLD}%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 col-span-2 sm:col-span-1">
                        <p className="text-white/60 text-xs mb-1">جایزه</p>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{Math.floor(carPosition * 100)}</p>
                      </div>
                    </div>

                    {/* Track */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 font-bold text-xs sm:text-sm">مسیر</p>
                        <p className="text-white/40 text-xs">شروع → پایان</p>
                      </div>

                      <div className="relative h-16 sm:h-20 bg-black/30 rounded-lg overflow-hidden border border-white/10">
                        {/* Road Lines */}
                        <div className="absolute inset-0 flex items-center px-2">
                          {[...Array(25)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-1 mx-0.5 rounded-full transition-colors ${
                                (i / 25) * 100 <= carPosition
                                  ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Car */}
                        <motion.div
                          className="absolute top-1/2 text-3xl sm:text-4xl"
                          style={{
                            left: `${Math.max(0, carPosition * 0.95)}%`,
                            transform: "translateY(-50%)",
                          }}
                          animate={{
                            rotate: [0, 3, -3, 0],
                          }}
                          transition={{ duration: 0.3, repeat: Infinity }}
                        >
                          🏎️
                        </motion.div>

                        {/* Finish Line */}
                        <motion.div
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-t from-emerald-500 to-emerald-500/0"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 sm:h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${progressColor} shadow-lg`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${carPosition}%` }}
                          transition={{ type: "tween", duration: 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Target Number */}
                    {targetNumber > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg border border-purple-500/30"
                      >
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1.5">عدد هدف امروز</p>
                        <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                          {targetNumber}
                        </p>
                      </motion.div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopGame}
                        className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-lg shadow-lg text-sm sm:text-base"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Pause className="w-4 h-4" />
                          توقف
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {gameState === "won" && (
                  <motion.div
                    key="won"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 sm:py-10"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                      className="text-6xl sm:text-7xl mb-4 sm:mb-5"
                    >
                      🎉
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                      برنده شدید!
                    </h2>
                    <div className="mb-5 sm:mb-6 text-sm sm:text-base text-white/60">
                      <p className="mb-2">تبریک! ماشین‌تان به خط پایان رسید</p>
                      <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4 mt-3 inline-block">
                        <p className="text-white/70 text-xs mb-1">جایزه نهایی</p>
                        <p className="text-3xl sm:text-4xl font-bold text-emerald-400">{Math.floor(carPosition * 100)}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg shadow-lg text-sm sm:text-base"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <RotateCcw className="w-4 h-4" />
                        بازی دوباره
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {gameState === "lost" && (
                  <motion.div
                    key="lost"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 sm:py-10"
                  >
                    <div className="text-6xl sm:text-7xl mb-4 sm:mb-5">😔</div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                      نزدیک بود!
                    </h2>
                    <div className="mb-5 sm:mb-6 text-sm sm:text-base text-white/60">
                      <p className="mb-3">ماشین‌تان در {Math.floor(carPosition)}% مسیر متوقف شد</p>
                      <p>برای رسیدن به {WINNING_THRESHOLD}% باید {Math.ceil(WINNING_THRESHOLD - carPosition)}% بیشتر برود!</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg shadow-lg text-sm sm:text-base"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <RotateCcw className="w-4 h-4" />
                        دوباره تلاش کنید
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Game Stats */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-4 sm:p-5"
            >
              <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                آمار جلسه
              </h3>

              <div className="space-y-2 sm:space-y-3">
                <div className="bg-white/5 rounded-lg border border-white/10 p-2.5 sm:p-3">
                  <p className="text-white/60 text-xs mb-0.5">تعداد بازی</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">{sessionStats.totalSpins}</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-2.5 sm:p-3">
                  <p className="text-white/60 text-xs mb-0.5">برد</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">{sessionStats.wins}</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-2.5 sm:p-3">
                  <p className="text-white/60 text-xs mb-0.5">درصد برد</p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-400">
                    {sessionStats.totalSpins > 0 ? Math.round((sessionStats.wins / sessionStats.totalSpins) * 100) : 0}%
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-2.5 sm:p-3">
                  <p className="text-white/60 text-xs mb-0.5">جایزه کل</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">{sessionStats.reward}</p>
                </div>
              </div>
            </motion.div>

            {/* Rules Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-lg border border-white/10 bg-gradient-to-br from-amber-500/10 to-white/[0.02] backdrop-blur-xl p-4 sm:p-5"
            >
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                قوانین بازی
              </h3>

              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/70">
                <div className="flex gap-2">
                  <span className="text-accent-gold font-bold text-base">🎯</span>
                  <p>ماشین را تا {WINNING_THRESHOLD}% برسانید</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold text-base">💰</span>
                  <p>هرچه بیشتر برید، جایزه بیشتر</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold text-base">⚡</span>
                  <p>هزینه: 1 شانس</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-purple-400 font-bold text-base">🏆</span>
                  <p>فقط برندگان جایزه می‌گیرند</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Icon component
function BarChart3(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" />
      <path d="M13 17V9" />
      <path d="M18 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}
