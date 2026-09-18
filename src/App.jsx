import { useEffect, useRef, useState } from 'react'
import './App.css'

const GAME_DURATION = 30
const HOLE_COUNT = 9
const RECORDS_KEY = 'whack-a-mole-records'
const DEV_PASSWORD = 'mogumogu'

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

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecord(name, playNumber, score) {
  const records = loadRecords()
  records.push({ name, playNumber, score, playedAt: new Date().toISOString() })
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

function countPlaysByName(name) {
  return loadRecords().filter((r) => r.name === name).length
}

function formatPlayerLabel(name, playNumber) {
  const safeName = name || '（名前なし）'
  return playNumber > 1 ? `${safeName}(${playNumber}回目)` : safeName
}

function App() {
  const [phase, setPhase] = useState('idle') // idle | playing | gameover
  const [nickname, setNickname] = useState('')
  const [playedLabel, setPlayedLabel] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHole, setActiveHole] = useState(null)

  const [devPasswordOpen, setDevPasswordOpen] = useState(false)
  const [devPanelOpen, setDevPanelOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [records, setRecords] = useState([])

  const timeLeftRef = useRef(GAME_DURATION)
  const activeHoleRef = useRef(null)
  const nicknameRef = useRef('')
  const playNumberRef = useRef(1)
  const scoreRef = useRef(0)
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
    saveRecord(nicknameRef.current, playNumberRef.current, scoreRef.current)
    setPhase('gameover')
  }

  const startGame = () => {
    const trimmedName = nickname.trim()
    if (!trimmedName) return

    clearTimeout(moleTimeoutRef.current)
    clearInterval(tickIntervalRef.current)

    const playNumber = countPlaysByName(trimmedName) + 1
    nicknameRef.current = trimmedName
    playNumberRef.current = playNumber
    setPlayedLabel(formatPlayerLabel(trimmedName, playNumber))
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION)
    timeLeftRef.current = GAME_DURATION
    activeHoleRef.current = null
    setActiveHole(null)
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

  const backToStartScreen = () => {
    setPhase('idle')
  }

  const openDevPrompt = () => {
    setPasswordInput('')
    setPasswordError(false)
    setDevPasswordOpen(true)
  }

  const closeDevPrompt = () => {
    setDevPasswordOpen(false)
    setPasswordInput('')
    setPasswordError(false)
  }

  const handleDevSubmit = (e) => {
    e.preventDefault()
    if (passwordInput === DEV_PASSWORD) {
      setRecords(loadRecords())
      setDevPanelOpen(true)
      setDevPasswordOpen(false)
      setPasswordInput('')
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
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
          <p className="subtitle">30秒間でできるだけ多くのモグラを叩こう！</p>
          <input
            type="text"
            className="nickname-input"
            placeholder="ニックネームを入力"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={16}
          />
          <button
            type="button"
            className="primary-button"
            onClick={startGame}
            disabled={!nickname.trim()}
          >
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
                <p className="overlay-score">
                  {playedLabel}さんのスコア：{score}
                </p>
                <button type="button" className="primary-button" onClick={backToStartScreen}>
                  もう一度遊ぶ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="dev-gate"
        onClick={openDevPrompt}
        aria-label="開発者モード"
      >
        ⚙
      </button>

      {devPasswordOpen && (
        <div className="dev-overlay">
          <form className="dev-card" onSubmit={handleDevSubmit}>
            <p className="dev-title">開発者モード</p>
            <input
              type="password"
              className="dev-input"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value)
                setPasswordError(false)
              }}
              placeholder="パスワード"
              autoFocus
            />
            {passwordError && <p className="dev-error">パスワードが違います</p>}
            <div className="dev-actions">
              <button type="button" className="dev-button ghost" onClick={closeDevPrompt}>
                キャンセル
              </button>
              <button type="submit" className="dev-button">
                入る
              </button>
            </div>
          </form>
        </div>
      )}

      {devPanelOpen && (
        <div className="dev-overlay">
          <div className="dev-card dev-panel">
            <p className="dev-title">全プレイヤーの記録</p>
            <p className="dev-count">{records.length}件</p>
            <div className="dev-records">
              {records.length === 0 && <p className="dev-empty">まだ記録がありません</p>}
              {[...records].reverse().map((r, i) => (
                <div key={i} className="dev-record-row">
                  <div className="dev-record-main">
                    <span className="dev-record-name">
                      {formatPlayerLabel(r.name, r.playNumber || 1)}
                    </span>
                    <span className="dev-record-score">{r.score}点</span>
                  </div>
                  <span className="dev-record-date">
                    {new Date(r.playedAt).toLocaleString('ja-JP')}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" className="dev-button" onClick={() => setDevPanelOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
