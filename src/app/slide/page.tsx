"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function SlidePage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle")
  const [carPosition, setCarPosition] = useState(0)
  const [targetNumber, setTargetNumber] = useState<number | null>(null)

  const startGame = () => {
    setGameState("playing")
    setCarPosition(0)
    setTargetNumber(Math.floor(Math.random() * 100))
  }

  const stopGame = () => {
    if (gameState === "playing") {
      setGameState(carPosition >= 80 ? "won" : "lost")
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
        return prev + Math.random() * 3
      })
    }, 100)

    return () => clearInterval(interval)
  }, [gameState])

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-gradient">ماشین اسلاید</span>
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card glass p-8"
            >
              {gameState === "idle" && (
                <div className="text-center py-12">
                  <p className="text-6xl mb-6">🏎️</p>
                  <h2 className="text-3xl font-bold mb-4">آماده هستید؟</h2>
                  <p className="text-dark-text/60 mb-8">
                    ماشین‌تان را تا انتهای مسیر برسانید
                  </p>
                  <button onClick={startGame} className="btn-primary px-12 py-4 text-lg">
                    شروع بازی
                  </button>
                </div>
              )}

              {gameState === "playing" && (
                <div className="py-12">
                  <p className="text-sm text-dark-text/60 mb-4">موقعیت: {Math.floor(carPosition)}%</p>

                  {/* Track */}
                  <div className="relative h-24 bg-dark-bg/50 rounded-lg mb-8 overflow-hidden border border-dark-border/50">
                    <div className="absolute inset-0 flex items-center">
                      {/* Road */}
                      <div className="w-full h-12 bg-gradient-to-r from-dark-surface to-dark-surface relative">
                        <div className="absolute inset-0 flex items-center justify-between px-4 py-2">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-1 bg-accent-gold/30 rounded-full"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Car */}
                      <motion.div
                        className="absolute text-5xl"
                        style={{
                          left: `${carPosition}%`,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        animate={{ x: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        🏎️
                      </motion.div>
                    </div>

                    {/* Finish Line */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-accent-gold to-accent-gold/0 flex items-center justify-end pr-2">
                      <span className="text-xs font-bold text-dark-bg">پایان</span>
                    </div>
                  </div>

                  {targetNumber !== null && (
                    <div className="mb-8 p-4 bg-dark-bg/50 rounded-lg border border-accent-cyan/30">
                      <p className="text-dark-text/60 mb-2">عدد هدف</p>
                      <p className="text-2xl font-bold text-accent-cyan">{targetNumber}</p>
                    </div>
                  )}

                  <button
                    onClick={stopGame}
                    className="btn-primary w-full py-4"
                  >
                    توقف و نتیجه
                  </button>
                </div>
              )}

              {gameState === "won" && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="text-6xl mb-6"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 text-accent-gold">شما برنده شدید!</h2>
                  <p className="text-dark-text/60 mb-8">
                    تبریک! ماشین‌تان به خط پایان رسید
                  </p>
                  <button
                    onClick={startGame}
                    className="btn-primary px-12 py-4 text-lg"
                  >
                    بازی دوباره
                  </button>
                </div>
              )}

              {gameState === "lost" && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">😞</div>
                  <h2 className="text-3xl font-bold mb-4 text-status-danger">باخت</h2>
                  <p className="text-dark-text/60 mb-8">
                    ماشین‌تان به خط پایان نرسید. دوباره تلاش کنید
                  </p>
                  <button
                    onClick={startGame}
                    className="btn-primary px-12 py-4 text-lg"
                  >
                    بازی دوباره
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* Game Info */}
            <div className="card glass p-6">
              <p className="text-dark-text/60 mb-2">هزینه</p>
              <p className="text-3xl font-bold text-accent-gold">۱ شانس</p>
            </div>

            {/* Rules */}
            <div className="card glass p-6">
              <h3 className="font-bold mb-4">قوانین</h3>
              <div className="text-sm space-y-3 text-dark-text/70">
                <div>
                  <p className="font-semibold mb-1">هدف</p>
                  <p>ماشین‌تان را به خط پایان برسانید</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">برنده</p>
                  <p>اگر ماشین 80% مسیر را طی کند</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">جایزه</p>
                  <p>کش‌بک + شانس اضافی</p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="card glass p-6">
              <h3 className="font-bold mb-4">برترین‌ها</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: "علی", score: 95 },
                  { name: "فاطمه", score: 92 },
                  { name: "محمد", score: 88 },
                ].map((player, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-dark-bg/50 rounded"
                  >
                    <span>#{idx + 1} {player.name}</span>
                    <span className="text-accent-gold font-bold">{player.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
