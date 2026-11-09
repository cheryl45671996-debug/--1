import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, WeaponType, WEAPONS, TargetEntity, PlayerStats } from './types/game';
import { PRIZES } from './data/prizes';
import { sound } from './utils/audio';
import { ShootingGallery } from './components/ShootingGallery';
import { GameHUD } from './components/GameHUD';
import { PrizeShop } from './components/PrizeShop';
import { TrophyShelf } from './components/TrophyShelf';
import { RoundSummary } from './components/RoundSummary';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { Play, Sparkles, Award, Timer, Gauge, HelpCircle, X, Trophy, User, LogOut } from 'lucide-react';

const STORAGE_KEY = 'night_market_shooter_stats_v1';

export default function App() {
  // Player Stats & LocalStorage
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      tickets: 150, // Starter tickets to try out the shop
      highScore: 2400,
      totalGamesPlayed: 0,
      perfectTenShotsCount: 0,
      totalHits: 0,
      totalShots: 0,
      inventory: {},
    };
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Game active state & mode
  const [gameMode, setGameMode] = useState<GameMode>('TIME_ATTACK');
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [feverEnergy, setFeverEnergy] = useState<number>(0);
  const [isFever, setIsFever] = useState<boolean>(false);
  const feverTimerRef = useRef<number | null>(null);

  // Mode specific progression
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [tenShotsHistory, setTenShotsHistory] = useState<('hit' | 'miss' | 'pending')[]>(
    Array(10).fill('pending')
  );
  const [tenShotsIndex, setTenShotsIndex] = useState<number>(0);

  // Round stats for summary
  const [roundHits, setRoundHits] = useState<number>(0);
  const [roundShots, setRoundShots] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [isPerfectTenRound, setIsPerfectTenRound] = useState<boolean>(false);
  const [ticketsEarnedInRound, setTicketsEarnedInRound] = useState<number>(0);

  // Weapon & Ammo
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('cork');
  const [ammo, setAmmo] = useState<number>(WEAPONS.cork.maxAmmo);
  const [isReloading, setIsReloading] = useState<boolean>(false);

  // Modals & Panels
  const [isPrizeShopOpen, setIsPrizeShopOpen] = useState<boolean>(false);
  const [isTrophyShelfOpen, setIsTrophyShelfOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Authenticated Player State (saved in localStorage)
  const [currentPlayer, setCurrentPlayer] = useState<{ name: string; lastLogin: string } | null>(() => {
    try {
      const saved = localStorage.getItem('nm_current_player');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const handleSetPlayer = (player: { name: string; lastLogin: string } | null) => {
    setCurrentPlayer(player);
    if (player) {
      localStorage.setItem('nm_current_player', JSON.stringify(player));
    } else {
      localStorage.removeItem('nm_current_player');
    }
  };

  // Sound & Music
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(false);

  // Handle reload action
  const handleReload = useCallback(() => {
    if (isReloading) return;
    const max = WEAPONS[currentWeapon].maxAmmo;
    if (ammo >= max) return;

    setIsReloading(true);
    sound.playReload();
    setTimeout(() => {
      setAmmo(max);
      setIsReloading(false);
    }, 450);
  }, [ammo, currentWeapon, isReloading]);

  // Handle weapon switch
  const handleSelectWeapon = useCallback(
    (wKey: WeaponType) => {
      if (wKey === currentWeapon) return;
      setCurrentWeapon(wKey);
      setAmmo(WEAPONS[wKey].maxAmmo);
      setIsReloading(false);
      sound.playReload();
    },
    [currentWeapon]
  );

  // Keyboard shortcut listeners: [R] for reload, [1]-[4] for weapons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReload();
      } else if (e.key === '1') {
        handleSelectWeapon('cork');
      } else if (e.key === '2') {
        handleSelectWeapon('bb');
      } else if (e.key === '3') {
        handleSelectWeapon('dart');
      } else if (e.key === '4') {
        handleSelectWeapon('laser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReload, handleSelectWeapon]);

  // Start / Restart Game Round
  const startNewGame = useCallback(
    (mode: GameMode = gameMode) => {
      setGameMode(mode);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setFeverEnergy(0);
      setIsFever(false);
      setRoundHits(0);
      setRoundShots(0);
      setShowSummary(false);
      setIsPerfectTenRound(false);
      setTicketsEarnedInRound(0);

      // Reset ammo
      setAmmo(WEAPONS[currentWeapon].maxAmmo);
      setIsReloading(false);

      // Mode-specific reset
      if (mode === 'TIME_ATTACK') {
        setTimeLeft(60);
      } else if (mode === 'TEN_SHOTS') {
        setTenShotsHistory(Array(10).fill('pending'));
        setTenShotsIndex(0);
      } else if (mode === 'SLIDING_RUSH') {
        setTimeLeft(45);
      }

      setIsGameActive(true);
    },
    [currentWeapon, gameMode]
  );

  // Time-Attack / Sliding-Rush Countdown
  useEffect(() => {
    if (!isGameActive) return;
    if (gameMode !== 'TIME_ATTACK' && gameMode !== 'SLIDING_RUSH') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGameRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, gameMode]);

  // Conclude game round & calculate tickets
  const endGameRound = () => {
    setIsGameActive(false);

    // Calculate accuracy
    const calculatedAcc = roundShots > 0 ? Math.round((roundHits / roundShots) * 100) : 0;

    // Check perfect ten
    let isPerfect = false;
    if (gameMode === 'TEN_SHOTS') {
      const hitsCount = tenShotsHistory.filter(s => s === 'hit').length;
      isPerfect = hitsCount === 10;
    }
    setIsPerfectTenRound(isPerfect);

    // Calculate tickets awarded
    let tickets = Math.floor(score / 50);
    if (calculatedAcc >= 80) tickets += 25;
    if (maxCombo >= 8) tickets += 30;

    if (isPerfect) {
      tickets += 500; // Grand prize reward!
    }

    setTicketsEarnedInRound(tickets);

    // Update global player stats
    setStats(prev => {
      const newInventory = { ...prev.inventory };
      if (isPerfect) {
        newInventory['shiba_giant'] = (newInventory['shiba_giant'] || 0) + 1;
      }
      return {
        ...prev,
        tickets: prev.tickets + tickets,
        highScore: Math.max(prev.highScore, score),
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        perfectTenShotsCount: prev.perfectTenShotsCount + (isPerfect ? 1 : 0),
        totalHits: prev.totalHits + roundHits,
        totalShots: prev.totalShots + roundShots,
        inventory: newInventory,
      };
    });

    // Auto-record to Google Sheet '遊戲記錄' if logged in
    if (currentPlayer) {
      const modeName =
        gameMode === 'TIME_ATTACK'
          ? '60秒限時挑戰'
          : gameMode === 'TEN_SHOTS'
          ? '經典十發包廂'
          : '橫向滑行極速';
      const weaponName = WEAPONS[currentWeapon].nameZh;

      fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: currentPlayer.name,
          gameMode: modeName,
          score,
          accuracy: `${calculatedAcc}%`,
          hits: roundHits,
          maxCombo,
          weapon: weaponName,
          coins: tickets,
        }),
      }).catch(err => console.log('Auto-record error:', err));
    }

    setShowSummary(true);
  };

  // Fever Trigger Mechanism
  const activateFever = useCallback(() => {
    setIsFever(true);
    sound.playFeverTrigger();
    if (feverTimerRef.current) clearTimeout(feverTimerRef.current);

    feverTimerRef.current = window.setTimeout(() => {
      setIsFever(false);
      setFeverEnergy(0);
    }, 10000); // 10s Fever duration
  }, []);

  // Handle every shot fired (deduct ammo, track 10-shot history)
  const handleFire = (hit: boolean) => {
    setAmmo(prev => Math.max(0, prev - 1));
    setRoundShots(s => s + 1);

    if (gameMode === 'TEN_SHOTS') {
      if (tenShotsIndex < 10) {
        const nextHistory = [...tenShotsHistory];
        nextHistory[tenShotsIndex] = hit ? 'hit' : 'miss';
        setTenShotsHistory(nextHistory);
        const nextIdx = tenShotsIndex + 1;
        setTenShotsIndex(nextIdx);

        if (nextIdx >= 10) {
          // Finish round shortly after 10th shot
          setTimeout(() => {
            endGameRound();
          }, 500);
        }
      }
    }

    if (!hit) {
      // Missed shot resets combo streak
      setCombo(0);
    }
  };

  // Handle target hit (calculate score, combo, fever charge)
  const handleTargetHit = (target: TargetEntity) => {
    setRoundHits(h => h + 1);

    // 1. Bomb hit: penalty & combo break
    if (target.kind === 'bomb') {
      setScore(s => Math.max(0, s + target.points));
      setCombo(0);
      return;
    }

    // 2. Boba hit: ammo refill!
    if (target.kind === 'boba') {
      const maxAmmo = WEAPONS[currentWeapon].maxAmmo;
      setAmmo(maxAmmo);
    }

    // 3. Golden duck hit: instant fever!
    if (target.kind === 'golden_duck') {
      setFeverEnergy(100);
      activateFever();
    }

    // 4. Update Combo
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setMaxCombo(m => Math.max(m, nextCombo));
    sound.playCombo(nextCombo);

    // 5. Multipliers & Fever
    let comboMultiplier = 1.0;
    if (nextCombo >= 15) comboMultiplier = 3.0;
    else if (nextCombo >= 10) comboMultiplier = 2.5;
    else if (nextCombo >= 6) comboMultiplier = 2.0;
    else if (nextCombo >= 3) comboMultiplier = 1.5;

    const feverMultiplier = isFever ? 2.0 : 1.0;
    const finalPoints = Math.round(target.points * comboMultiplier * feverMultiplier);

    setScore(s => s + finalPoints);

    // 6. Charge Fever Energy (unless already in Fever)
    if (!isFever) {
      setFeverEnergy(prev => {
        const nextEnergy = Math.min(100, prev + 12);
        if (nextEnergy >= 100) {
          activateFever();
        }
        return nextEnergy;
      });
    }
  };

  // Redeem prize in shop
  const handleRedeemPrize = (prizeId: string) => {
    const prize = PRIZES.find(p => p.id === prizeId);
    if (!prize) return;
    if (stats.tickets < prize.cost) return;

    setStats(prev => ({
      ...prev,
      tickets: prev.tickets - prize.cost,
      inventory: {
        ...prev.inventory,
        [prizeId]: (prev.inventory[prizeId] || 0) + 1,
      },
    }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // Toggle Music
  const handleToggleMusic = () => {
    const nextMusic = !isMusicEnabled;
    setIsMusicEnabled(nextMusic);
    sound.setMusicEnabled(nextMusic);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* ======================================================== */}
      {/* Top Header & Navigation Bar (Anti-Slop Clean 3-Zone)    */}
      {/* ======================================================== */}
      <header className="w-full bg-stone-950/95 border-b border-amber-900/60 px-6 py-3.5 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-2xl">🏮</span>
            <span className="text-lg font-black tracking-tight text-amber-100 whitespace-nowrap">
              夜市神射手 · 滿靶大獎挑戰賽
            </span>
          </div>

          {/* Zone 2: Mode Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-stone-900/90 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => startNewGame('TIME_ATTACK')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                gameMode === 'TIME_ATTACK'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>60秒限時挑戰</span>
            </button>

            <button
              onClick={() => startNewGame('TEN_SHOTS')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                gameMode === 'TEN_SHOTS'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>經典十發包廂</span>
            </button>

            <button
              onClick={() => startNewGame('SLIDING_RUSH')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                gameMode === 'SLIDING_RUSH'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>橫向滑行極速</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Info */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-yellow-300 border border-stone-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Google Sheet 雲端風雲榜"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">風雲榜</span>
            </button>

            {/* Player Account Status (工作表: 玩家) */}
            {currentPlayer ? (
              <div className="flex items-center gap-1.5 bg-stone-900 border border-amber-600/60 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-200">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[80px] sm:max-w-[110px] truncate">{currentPlayer.name}</span>
                <button
                  onClick={() => handleSetPlayer(null)}
                  className="ml-1 p-0.5 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="登出玩家"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="玩家登入 / 註冊 (連線工作表：玩家)"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">登入/註冊</span>
              </button>
            )}

            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-200 border border-stone-800 transition-colors cursor-pointer"
              title="攤位射擊規則與目標說明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPrizeShopOpen(true)}
              className="px-4 py-2 text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow transition-transform active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <span>🎟️</span>
              <span>獎品兌換處 ({stats.tickets})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* Main Game Arena Container                                */}
      {/* ======================================================== */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-3 md:p-6 max-w-6xl mx-auto">
        {/* HUD Component */}
        <GameHUD
          score={score}
          highScore={stats.highScore}
          combo={combo}
          feverEnergy={feverEnergy}
          isFever={isFever}
          gameMode={gameMode}
          timeLeft={timeLeft}
          tenShotsHistory={tenShotsHistory}
          currentWeapon={currentWeapon}
          ammo={ammo}
          isReloading={isReloading}
          tickets={stats.tickets}
          isMuted={isMuted}
          isMusicEnabled={isMusicEnabled}
          onSelectWeapon={handleSelectWeapon}
          onReload={handleReload}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenPrizeShop={() => setIsPrizeShopOpen(true)}
          onOpenTrophyShelf={() => setIsTrophyShelfOpen(true)}
          onRestartGame={() => startNewGame()}
        />

        {/* Shooting Gallery Viewport */}
        <ShootingGallery
          currentWeapon={currentWeapon}
          ammo={ammo}
          isFever={isFever}
          onFire={handleFire}
          onTargetHit={handleTargetHit}
          onReloadRequested={handleReload}
          gameActive={isGameActive}
        />
      </main>

      {/* ======================================================== */}
      {/* Footer                                                   */}
      {/* ======================================================== */}
      <footer className="w-full border-t border-amber-950 bg-stone-950 py-3 px-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>台灣夜市神射手 · 滿靶特獎挑戰賽</span>
            <span aria-hidden="true">·</span>
            <span>純 Web Audio 原生音效合成</span>
            <span aria-hidden="true">·</span>
            <span>按鍵支援 [R] 裝填 / [1-4] 切換武器</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>累計遊玩: {stats.totalGamesPlayed} 局</span>
            <span aria-hidden="true">·</span>
            <span>滿靶紀錄: {stats.perfectTenShotsCount} 次</span>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* Modals & Dialogs                                         */}
      {/* ======================================================== */}
      {/* 1. Round Summary Result Modal */}
      <RoundSummary
        isOpen={showSummary}
        score={score}
        accuracy={roundShots > 0 ? Math.round((roundHits / roundShots) * 100) : 0}
        totalHits={roundHits}
        totalShots={roundShots}
        maxCombo={maxCombo}
        ticketsEarned={ticketsEarnedInRound}
        gameMode={gameMode}
        isPerfectTen={isPerfectTenRound}
        onPlayAgain={() => startNewGame()}
        onOpenPrizeShop={() => {
          setShowSummary(false);
          setIsPrizeShopOpen(true);
        }}
        onOpenTrophyShelf={() => {
          setShowSummary(false);
          setIsTrophyShelfOpen(true);
        }}
        onOpenLeaderboard={() => {
          setShowSummary(false);
          setIsLeaderboardOpen(true);
        }}
      />

      {/* Leaderboard & Google Sheets Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentPlayer={currentPlayer}
        currentRoundScore={score}
        currentRoundMode={
          gameMode === 'TIME_ATTACK'
            ? '60秒限時挑戰'
            : gameMode === 'TEN_SHOTS'
            ? '經典十發包廂'
            : '橫向滑行極速'
        }
        currentRoundAccuracy={roundShots > 0 ? Math.round((roundHits / roundShots) * 100) : 0}
        currentRoundHits={roundHits}
        currentRoundCombo={maxCombo}
        currentRoundWeapon={WEAPONS[currentWeapon].nameZh}
        currentRoundCoins={ticketsEarnedInRound}
        isPerfectTen={isPerfectTenRound}
      />

      {/* Player Authentication Modal (工作表: 玩家) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={player => handleSetPlayer(player)}
      />

      {/* 2. Prize Redemption Shop */}
      <PrizeShop
        isOpen={isPrizeShopOpen}
        onClose={() => setIsPrizeShopOpen(false)}
        tickets={stats.tickets}
        prizes={PRIZES}
        inventory={stats.inventory}
        onRedeemPrize={handleRedeemPrize}
        onOpenShelf={() => {
          setIsPrizeShopOpen(false);
          setIsTrophyShelfOpen(true);
        }}
      />

      {/* 3. Player Trophy Showcase Shelf */}
      <TrophyShelf
        isOpen={isTrophyShelfOpen}
        onClose={() => setIsTrophyShelfOpen(false)}
        prizes={PRIZES}
        inventory={stats.inventory}
        onOpenShop={() => {
          setIsTrophyShelfOpen(false);
          setIsPrizeShopOpen(true);
        }}
      />

      {/* 4. Target & Weapon Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/80 mb-4">
              <h3 className="text-lg font-black text-amber-200 flex items-center gap-2">
                <span>🎯 夜市攤位射擊指南與目標一覽</span>
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-5 text-xs text-stone-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-amber-400 mb-2">🎪 雙層射擊軌道機制</h4>
                <p className="text-stone-400 mb-2">
                  • <strong className="text-amber-200">頂層機械滑軌：</strong>黃色小鴨、鋼盔特技鴨、黃金招財鴨沿著金屬軌道橫向持續滑過。<br />
                  • <strong className="text-amber-200">中層六大百葉窗口：</strong>木窗百葉隨機彈開，目標短暫探頭（附倒數引信條）或橫向滑過窗框，需在關窗或滑離視野前精準擊破！
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 mb-2">🎯 夜市目標與驚喜分數</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-yellow-300">🐤 經典黃色小鴨 (120分)</span>
                    <p className="text-stone-400">中彈搞笑嘎嘎叫並飄散羽毛。</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-slate-300">🪖 鋼盔特技鴨 (200分)</span>
                    <p className="text-stone-400">帶防護頭盔，需連續擊中 2 發破盾。</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-amber-400">👑 黃金招財鴨 (350分)</span>
                    <p className="text-stone-400">高速橫向滑過，擊中直接引爆狂熱能量！</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-red-400">🎈 五彩爆破氣球 (60~100分)</span>
                    <p className="text-stone-400">清脆爆音與橡膠碎片噴濺。</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-pink-400">🌈 彩虹狂熱氣球 (250分)</span>
                    <p className="text-stone-400">全螢幕彩紙連擊爆破！</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-amber-300">🎯 同心圓木靶 (180分)</span>
                    <p className="text-stone-400">正中靶心伴隨清脆金屬鐘聲。</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-amber-400">🧋 波霸珍珠奶茶 (150分)</span>
                    <p className="text-stone-400">附贈立即彈藥全滿補給！</p>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <span className="font-bold text-red-500">💣 惡作劇排炮/炸彈 (-150分)</span>
                    <p className="text-stone-400">畫面震動並打斷連擊，切勿射擊！</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 mb-2">🔫 四大武器庫與操作快捷鍵</h4>
                <p className="text-stone-400">
                  • <strong>[1] 復古軟木塞手槍：</strong>空腔拔塞音效、木塞回彈與槍口青煙。<br />
                  • <strong>[2] 連發BB玩具步槍：</strong>25發高彈量、低延遲連續掃射。<br />
                  • <strong>[3] 磁吸夜市飛鏢：</strong>直感投擲，零後座力瞬間命中。<br />
                  • <strong>[4] 霓虹雷射手槍：</strong>高科技紅外線準星與貫穿力。<br />
                  • <strong>[R] 快速裝填：</strong>隨時補充彈藥！
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-800 text-right">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg cursor-pointer"
              >
                我知道了，開始射擊！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
