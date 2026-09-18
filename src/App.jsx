import { useEffect, useRef, useState } from 'react'
import './App.css'

const GAME_DURATION = 60
const HOLE_COUNT = 9
const HIGH_SCORE_KEY = 'whack-a-mole-high-score'

function getShowDuration(timeLeft) {
  const progress = 1 - timeLeft / GAME_DURATION
  return Math.max(450, 1100 - progress * 650)
}

function randomHole(excludeIndex) {
  let idx = Math.floor(Math.random() * HOLE_COUNT)
  while (idx === excludeIndex) {
    idx = Math.floor(Math.random() * HOLE_COUNT)
  }
  return idx
}

function randomDelay(min, max) {
  return min + Math.random() * (max - min)
}

function App() {
  const [phase, setPhase] = useState('idle') // idle | playing | gameover
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHole, setActiveHole] = useState(null)
  const [highScore, setHighScore] = useState(
    () => Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0,
  )
  const [isNewRecord, setIsNewRecord] = useState(false)

  const timeLeftRef = useRef(GAME_DURATION)
  const activeHoleRef = useRef(null)
  const scoreRef = useRef(0)
  const highScoreRef = useRef(highScore)
  const moleTimeoutRef = useRef(null)
  const tickIntervalRef = useRef(null)
  const runningRef = useRef(false)

  const spawnMole = () => {
    if (!runningRef.current) return
    const idx = randomHole(activeHoleRef.current)
    activeHoleRef.current = idx
    setActiveHole(idx)

    const showDuration = getShowDuration(timeLeftRef.current)
    moleTimeoutRef.current = setTimeout(() => {
      activeHoleRef.current = null
      setActiveHole(null)
      moleTimeoutRef.current = setTimeout(spawnMole, randomDelay(150, 450))
    }, showDuration)
  }

  const endGame = () => {
    runningRef.current = false
    clearTimeout(moleTimeoutRef.current)
    clearInterval(tickIntervalRef.current)
    activeHoleRef.current = null
    setActiveHole(null)

    const finalScore = scoreRef.current
    if (finalScore > highScoreRef.current) {
      highScoreRef.current = finalScore
      localStorage.setItem(HIGH_SCORE_KEY, String(finalScore))
      setHighScore(finalScore)
      setIsNewRecord(true)
    } else {
      setIsNewRecord(false)
    }
    setPhase('gameover')
  }

  const startGame = () => {
    clearTimeout(moleTimeoutRef.current)
    clearInterval(tickIntervalRef.current)

    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION)
    timeLeftRef.current = GAME_DURATION
    activeHoleRef.current = null
    setActiveHole(null)
    setIsNewRecord(false)
    setPhase('playing')
    runningRef.current = true

    tickIntervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) endGame()
    }, 1000)

    spawnMole()
  }

  const handleHoleClick = (idx) => {
    if (phase !== 'playing' || activeHole !== idx) return
    clearTimeout(moleTimeoutRef.current)
    activeHoleRef.current = null
    setActiveHole(null)
    scoreRef.current += 1
    setScore(scoreRef.current)
    moleTimeoutRef.current = setTimeout(spawnMole, randomDelay(150, 400))
  }

  useEffect(() => {
    return () => {
      runningRef.current = false
      clearTimeout(moleTimeoutRef.current)
      clearInterval(tickIntervalRef.current)
    }
  }, [])

  return (
    <div className={`app-root phase-${phase}`}>
      {phase === 'idle' && (
        <div className="panel">
          <p className="eyebrow">Whack-a-Mole</p>
          <h1 className="title">もぐらたたき</h1>
          <p className="subtitle">60秒間でできるだけ多くのモグラを叩こう！</p>
          {highScore > 0 && <p className="high-score">ハイスコア：{highScore}</p>}
          <button type="button" className="primary-button" onClick={startGame}>
            スタート
          </button>
        </div>
      )}

      {(phase === 'playing' || phase === 'gameover') && (
        <div className="game-screen">
          <div className="hud">
            <div className="hud-item">
              <span className="hud-label">スコア</span>
              <span className="hud-value">{score}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">残り時間</span>
              <span className="hud-value">{timeLeft}</span>
            </div>
          </div>

          <div className="field">
            {Array.from({ length: HOLE_COUNT }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`hole ${activeHole === i ? 'active' : ''}`}
                onClick={() => handleHoleClick(i)}
                disabled={phase !== 'playing'}
                aria-label="mole hole"
              >
                <span className="mound" />
                <span className="mole">
                  <span className="mole-ear left" />
                  <span className="mole-ear right" />
                  <span className="mole-face">
                    <span className="mole-eye left" />
                    <span className="mole-eye right" />
                    <span className="mole-nose" />
                  </span>
                </span>
              </button>
            ))}
          </div>

          {phase === 'gameover' && (
            <div className="overlay">
              <div className="overlay-card">
                <p className="overlay-title">タイムアップ！</p>
                <p className="overlay-score">スコア：{score}</p>
                <p className="overlay-highscore">
                  {isNewRecord ? '🎉 新記録！' : `ハイスコア：${highScore}`}
                </p>
                <button type="button" className="primary-button" onClick={startGame}>
                  もう一度遊ぶ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
