import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 120;

const NeonSnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState(0);
  const [region, setRegion] = useState('Global');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'PLAYER_1', score: 850, region: 'Asia', country: 'India', isOnline: true },
    { rank: 2, name: 'NINJA_X', score: 720, region: 'Asia', country: 'Japan', isOnline: true },
    { rank: 3, name: 'SPEEDRUN', score: 680, region: 'Global', country: 'USA', isOnline: false },
    { rank: 4, name: 'SNAKE_PRO', score: 540, region: 'Europe', country: 'Germany', isOnline: true },
    { rank: 5, name: 'GAMER_99', score: 420, region: 'Asia', country: 'China', isOnline: false },
    { rank: 6, name: 'VIPER_X', score: 380, region: 'America', country: 'Brazil', isOnline: true },
    { rank: 7, name: 'TOXIC_SNAKE', score: 350, region: 'Asia', country: 'South Korea', isOnline: true },
    { rank: 8, name: 'ARCADE_KING', score: 320, region: 'Europe', country: 'France', isOnline: false },
    { rank: 9, name: 'CYBER_GAMER', score: 280, region: 'Global', country: 'Canada', isOnline: true },
    { rank: 10, name: 'PIXEL_PRO', score: 250, region: 'America', country: 'Mexico', isOnline: false },
  ]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [playerRank, setPlayerRank] = useState(null);
  const [playerCountry, setPlayerCountry] = useState('India');
  
  const gameLoopRef = useRef();
  const lastMoveTime = useRef(Date.now());

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    const newSnake = INITIAL_SNAKE;
    setSnake(newSnake);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setFood(generateFood(newSnake));
    setScore(0);
    setLevel(0);
    setGameOver(false);
    setPaused(false);
    setShowLeaderboard(false);
    lastMoveTime.current = Date.now();
  };

  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
      setShowLogin(false);
      // Simulate adding player to leaderboard
      const newPlayer = {
        rank: leaderboard.length + 1,
        name: username.toUpperCase(),
        score: 0,
        region: region,
        country: playerCountry,
        isOnline: true
      };
      setLeaderboard(prev => [...prev, newPlayer].sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 })));
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPlayerRank(null);
  };

  // Update player rank when score changes
  useEffect(() => {
    if (isLoggedIn && username) {
      const updatedLeaderboard = leaderboard.map(player => 
        player.name === username.toUpperCase() 
          ? { ...player, score: Math.max(player.score, score), isOnline: true }
          : player
      ).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));
      
      setLeaderboard(updatedLeaderboard);
      const myRank = updatedLeaderboard.find(p => p.name === username.toUpperCase());
      if (myRank) setPlayerRank(myRank.rank);
    }
  }, [score, isLoggedIn, username]);

  // Simulate real-time online status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => prev.map(player => ({
        ...player,
        isOnline: player.name === username.toUpperCase() ? true : Math.random() > 0.3
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [username]);

  let filteredLeaderboard = region === 'Global' 
    ? leaderboard 
    : leaderboard.filter(player => player.region === region);

  if (showOnlineOnly) {
    filteredLeaderboard = filteredLeaderboard.filter(player => player.isOnline);
  }

  const onlineCount = leaderboard.filter(p => p.isOnline).length;

  const moveSnake = useCallback(() => {
    if (gameOver || paused) return;

    const now = Date.now();
    if (now - lastMoveTime.current < GAME_SPEED) return;
    lastMoveTime.current = now;

    setDirection(nextDirection);

    setSnake(prevSnake => {
      const newHead = {
        x: (prevSnake[0].x + nextDirection.x + GRID_SIZE) % GRID_SIZE,
        y: (prevSnake[0].y + nextDirection.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food is eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          setLevel(Math.floor(newScore / 50));
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [nextDirection, food, gameOver, paused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        resetGame();
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        setPaused(prev => !prev);
        return;
      }

      const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'w': { x: 0, y: -1 },
        'W': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        's': { x: 0, y: 1 },
        'S': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'a': { x: -1, y: 0 },
        'A': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 },
        'd': { x: 1, y: 0 },
        'D': { x: 1, y: 0 },
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        e.preventDefault();
        setNextDirection(prev => {
          // Prevent reversing
          if (newDirection.x === -direction.x || newDirection.y === -direction.y) {
            return prev;
          }
          return newDirection;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, direction]);

  useEffect(() => {
    const animate = () => {
      moveSnake();
      gameLoopRef.current = requestAnimationFrame(animate);
    };
    
    gameLoopRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [moveSnake]);

  const handleDirectionButton = (newDir) => {
    if (gameOver) return;
    
    setNextDirection(prev => {
      if (newDir.x === -direction.x || newDir.y === -direction.y) {
        return prev;
      }
      return newDir;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Arcade cabinet frame */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-pink-500">
          
          {/* Title with Region Selector */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent">
                SNAKE ARCADE
              </h1>
            </div>
            <div className="flex-1 flex justify-end items-center gap-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold border-2 border-cyan-400 hover:border-pink-400 transition-all cursor-pointer"
                style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)' }}
              >
                <option value="Global">🌍 Global</option>
                <option value="Asia">🌏 Asia</option>
                <option value="Europe">🌍 Europe</option>
                <option value="America">🌎 America</option>
              </select>
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all border-2 border-green-400"
                  style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                >
                  Login
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-cyan-400 text-sm font-bold">{username}</span>
                  </div>
                  {playerRank && (
                    <span className="text-yellow-400 text-xs font-bold">#{playerRank}</span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-400 text-xs hover:text-red-300 transition-all"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Score display */}
          <div className="flex justify-between items-center mb-4 px-4">
            <div className="text-pink-500 text-xl md:text-2xl font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
              SCORE: {score.toString().padStart(3, '0')}
            </div>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-yellow-600 hover:to-orange-600 transition-all border-2 border-yellow-400"
              style={{ boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}
            >
              🏆 RANKS
            </button>
            <div className="text-pink-500 text-xl md:text-2xl font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
              HIGH: {highScore.toString().padStart(3, '0')}
            </div>
          </div>

          {/* Game board */}
          <div className="relative mx-auto mb-6 border-4 border-gray-700 rounded-lg overflow-hidden shadow-inner bg-gradient-to-br from-purple-950 to-indigo-950"
            style={{ 
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
            }}>
            
            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  backgroundColor: index === 0 ? '#22d3ee' : '#06b6d4',
                  borderRadius: '4px',
                  boxShadow: index === 0 
                    ? '0 0 15px rgba(34, 211, 238, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5)' 
                    : '0 0 10px rgba(6, 182, 212, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'none'
                }}
              >
                {index === 0 && (
                  <div className="flex items-center justify-center h-full gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            ))}

            {/* Food */}
            <div
              className="absolute animate-pulse"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            >
              <div className="w-full h-full bg-yellow-400 rounded-full"
                style={{
                  boxShadow: '0 0 20px rgba(250, 204, 21, 1), 0 0 30px rgba(250, 204, 21, 0.5)',
                  background: 'radial-gradient(circle at 30% 30%, #fef08a, #eab308)'
                }}
              />
            </div>

            {/* Game Over overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
                <div className="text-pink-500 text-4xl md:text-5xl font-bold mb-4 animate-pulse" 
                  style={{ textShadow: '0 0 20px rgba(236, 72, 153, 1)' }}>
                  GAME OVER
                </div>
                <div className="text-cyan-400 text-xl md:text-2xl mb-6">
                  Final Score: {score}
                </div>
                <button
                  onClick={resetGame}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xl font-bold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95"
                  style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)' }}
                >
                  PLAY AGAIN
                </button>
              </div>
            )}

            {/* Paused overlay */}
            {paused && !gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-cyan-400 text-3xl md:text-4xl font-bold animate-pulse"
                  style={{ textShadow: '0 0 20px rgba(34, 211, 238, 1)' }}>
                  PAUSED
                </div>
              </div>
            )}

            {/* Leaderboard overlay */}
            {showLeaderboard && !gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-start p-4 overflow-y-auto">
                <div className="text-yellow-400 text-2xl md:text-3xl font-bold mb-2"
                  style={{ textShadow: '0 0 20px rgba(250, 204, 21, 1)' }}>
                  🏆 LEADERBOARD
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-cyan-400 text-sm">{region} Rankings</div>
                  <div className="flex items-center gap-2 text-green-400 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{onlineCount} Online</span>
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                    className={`px-4 py-1 rounded-lg text-xs font-bold transition-all ${
                      showOnlineOnly 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-400' 
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                    }`}
                    style={{ boxShadow: showOnlineOnly ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none' }}
                  >
                    {showOnlineOnly ? '🟢 Online Players' : 'Show All Players'}
                  </button>
                </div>

                <div className="w-full max-w-xs space-y-2 mb-4">
                  {filteredLeaderboard.slice(0, 10).map((player, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                        player.name === username.toUpperCase()
                          ? 'bg-gradient-to-r from-pink-800 to-purple-800 border-pink-400 scale-105'
                          : 'bg-gradient-to-r from-purple-800 to-indigo-800 border-cyan-400'
                      }`}
                      style={{ boxShadow: player.name === username.toUpperCase() 
                        ? '0 0 15px rgba(236, 72, 153, 0.5)' 
                        : '0 0 10px rgba(34, 211, 238, 0.3)' 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          player.rank === 1 ? 'text-yellow-400' :
                          player.rank === 2 ? 'text-gray-300' :
                          player.rank === 3 ? 'text-orange-400' :
                          'text-cyan-400'
                        }`}>
                          #{player.rank}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${
                              player.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                            }`}></div>
                            <span className={`text-sm font-bold ${
                              player.name === username.toUpperCase() ? 'text-yellow-300' : 'text-white'
                            }`}>
                              {player.name}
                              {player.name === username.toUpperCase() && ' (YOU)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 ml-3.5">
                            <span className="text-xs text-gray-400">📍</span>
                            <span className="text-xs text-cyan-300">{player.country}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-pink-400 font-bold text-lg">{player.score}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-400 mb-3">
                  {showOnlineOnly 
                    ? `Showing ${filteredLeaderboard.length} online players` 
                    : `Showing top ${Math.min(10, filteredLeaderboard.length)} players`}
                </div>

                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  CLOSE
                </button>
              </div>
            )}

            {/* Login Modal */}
            {showLogin && (
              <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
                <div className="text-cyan-400 text-2xl md:text-3xl font-bold mb-6"
                  style={{ textShadow: '0 0 20px rgba(34, 211, 238, 1)' }}>
                  🎮 LOGIN
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter Username"
                  className="w-64 px-4 py-3 bg-purple-900 text-white rounded-lg border-2 border-cyan-400 focus:border-pink-400 outline-none text-center font-bold mb-4"
                  style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)' }}
                  maxLength={12}
                />
                <select
                  value={playerCountry}
                  onChange={(e) => setPlayerCountry(e.target.value)}
                  className="w-64 px-4 py-3 bg-purple-900 text-white rounded-lg border-2 border-cyan-400 focus:border-pink-400 outline-none text-center font-bold mb-4 cursor-pointer"
                  style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)' }}
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="USA">🇺🇸 USA</option>
                  <option value="UK">🇬🇧 UK</option>
                  <option value="Japan">🇯🇵 Japan</option>
                  <option value="China">🇨🇳 China</option>
                  <option value="South Korea">🇰🇷 South Korea</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Brazil">🇧🇷 Brazil</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Mexico">🇲🇽 Mexico</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="Russia">🇷🇺 Russia</option>
                  <option value="Pakistan">🇵🇰 Pakistan</option>
                  <option value="Bangladesh">🇧🇩 Bangladesh</option>
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={handleLogin}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                    style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Level display */}
          <div className="text-center mb-4">
            <div className="text-yellow-400 text-xl md:text-2xl font-bold tracking-wider inline-block px-6 py-2 bg-black bg-opacity-50 rounded-lg"
              style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.8)' }}>
              LEVEL: {level}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Direction buttons */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-2">
                <button
                  onClick={() => handleDirectionButton({ x: 0, y: -1 })}
                  className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95 border-2 border-orange-400"
                  style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }}
                >
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />
                </button>
              </div>
              <button
                onClick={() => handleDirectionButton({ x: -1, y: 0 })}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95 border-2 border-orange-400"
                style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }}
              >
                <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white" />
              </button>
              <button
                onClick={() => handleDirectionButton({ x: 0, y: 1 })}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95 border-2 border-orange-400"
                style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }}
              >
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
              </button>
              <button
                onClick={() => handleDirectionButton({ x: 1, y: 0 })}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95 border-2 border-orange-400"
                style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }}
              >
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white" />
              </button>
            </div>

            {/* Action button */}
            <button
              onClick={() => gameOver ? resetGame() : setPaused(!paused)}
              className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 border-4 border-pink-400"
              style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)' }}
            >
              {gameOver ? (
                <Play className="w-8 h-8 text-white" fill="white" />
              ) : paused ? (
                <Play className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Pause className="w-8 h-8 text-white" fill="white" />
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-cyan-300 text-xs md:text-sm">
            Arrow keys / WASD or buttons • SPACE to pause/restart • ENTER to restart
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonSnakeGame;