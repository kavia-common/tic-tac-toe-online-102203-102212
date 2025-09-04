import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Utility: All winning line indexes for a 3x3 board.
 */
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

/**
 * Returns the winner ('X' or 'O'), 'draw', or null if game ongoing.
 * Also returns the winning line indices when there is a winner.
 */
function evaluateBoard(squares) {
  for (const [a, b, c] of WIN_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { result: squares[a], line: [a, b, c] };
    }
  }
  if (squares.every(Boolean)) {
    return { result: 'draw', line: [] };
  }
  return { result: null, line: [] };
}

/**
 * Simple computer move:
 * 1) Try to win if possible
 * 2) Block opponent if they could win next
 * 3) Take center
 * 4) Take a random corner
 * 5) Take any available move
 */
function computeComputerMove(squares, ai, human) {
  // Try winning move
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      const next = squares.slice();
      next[i] = ai;
      if (evaluateBoard(next).result === ai) return i;
    }
  }
  // Block human winning move
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      const next = squares.slice();
      next[i] = human;
      if (evaluateBoard(next).result === human) return i;
    }
  }
  // Take center
  if (!squares[4]) return 4;

  // Take a corner
  const corners = [0, 2, 6, 8].filter(i => !squares[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // Any available
  const open = squares.map((v, idx) => (v ? null : idx)).filter(v => v !== null);
  if (open.length) return open[Math.floor(Math.random() * open.length)];

  return null;
}

/**
 * Square component
 */
function Square({ value, onClick, isWinning, disabled, idx }) {
  return (
    <button
      className={`ttt-square ${isWinning ? 'win' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Square ${idx + 1} ${value ? 'occupied by ' + value : 'empty'}`}
    >
      {value}
    </button>
  );
}

/**
 * Board component
 */
function Board({ squares, onSquareClick, winningLine, disabled }) {
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {squares.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          idx={idx}
          isWinning={winningLine.includes(idx)}
          onClick={() => onSquareClick(idx)}
          disabled={disabled || Boolean(val)}
        />
      ))}
    </div>
  );
}

/**
 * Controls component for selecting mode and restarting game.
 */
function Controls({ mode, setMode, onRestart, xIsNext, statusText }) {
  return (
    <div className="controls">
      <div className="modes" role="group" aria-label="Game mode">
        <button
          className={`btn ${mode === 'pvp' ? 'active' : ''}`}
          onClick={() => setMode('pvp')}
        >
          Two Players
        </button>
        <button
          className={`btn ${mode === 'ai' ? 'active' : ''}`}
          onClick={() => setMode('ai')}
        >
          Vs Computer
        </button>
      </div>
      <div className="status">
        <span className="pill turn">
          {statusText}
          {statusText.includes('Turn') ? (
            <span className={`badge ${xIsNext ? 'x' : 'o'}`}>{xIsNext ? 'X' : 'O'}</span>
          ) : null}
        </span>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onRestart}>New Game</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('pvp'); // 'pvp' | 'ai'
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState({ result: null, line: [] });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Re-evaluate winner whenever board changes
  useEffect(() => {
    const info = evaluateBoard(squares);
    setWinnerInfo(info);
  }, [squares]);

  // AI move when in ai mode and it's O's turn (AI defaults to 'O')
  useEffect(() => {
    if (mode !== 'ai') return;
    if (winnerInfo.result) return;
    if (!xIsNext) {
      const id = setTimeout(() => {
        const move = computeComputerMove(squares, 'O', 'X');
        if (move !== null && squares[move] === null) {
          setSquares(prev => {
            const next = prev.slice();
            next[move] = 'O';
            return next;
          });
          setXIsNext(true);
        }
      }, 400); // slight delay to feel natural
      return () => clearTimeout(id);
    }
  }, [mode, xIsNext, squares, winnerInfo.result]);

  const statusText = useMemo(() => {
    if (winnerInfo.result === 'X') return 'Winner: X';
    if (winnerInfo.result === 'O') return 'Winner: O';
    if (winnerInfo.result === 'draw') return 'It\'s a Draw';
    return `Turn:`;
  }, [winnerInfo.result]);

  const winningLine = winnerInfo.line || [];

  const handleSquareClick = (idx) => {
    if (winnerInfo.result) return; // game ended
    if (squares[idx]) return; // occupied

    // In AI mode, human is 'X' and moves are blocked when it's AI turn
    if (mode === 'ai' && !xIsNext) return;

    const next = squares.slice();
    next[idx] = xIsNext ? 'X' : 'O';
    setSquares(next);
    setXIsNext(!xIsNext);
  };

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinnerInfo({ result: null, line: [] });
  };

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  };

  // On mode change, restart to keep logic simple and predictable
  useEffect(() => {
    handleRestart();
  }, [mode]);

  const isBoardDisabled = Boolean(winnerInfo.result) || (mode === 'ai' && !xIsNext);

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="container">
          <h1 className="title">Tic Tac Toe</h1>
          <p className="subtitle">Play locally with a friend or challenge a simple computer opponent.</p>

          <Controls
            mode={mode}
            setMode={setMode}
            onRestart={handleRestart}
            xIsNext={xIsNext}
            statusText={statusText}
          />

          <Board
            squares={squares}
            onSquareClick={handleSquareClick}
            winningLine={winningLine}
            disabled={isBoardDisabled}
          />

          {winnerInfo.result && (
            <div className="result-banner" role="status" aria-live="polite">
              {winnerInfo.result === 'draw' ? (
                <span className="pill info">No winner this time. It’s a draw!</span>
              ) : (
                <span className="pill success">Congratulations! {winnerInfo.result} wins!</span>
              )}
              <button className="btn btn-primary btn-large" onClick={handleRestart}>Play Again</button>
            </div>
          )}

          <footer className="footer">
            <small>Tip: Switch modes anytime. New game will start automatically.</small>
          </footer>
        </div>
      </header>
    </div>
  );
}

export default App;
