import React from 'react';
import { WeaponType, WEAPONS, GameMode } from '../types/game';
import { Volume2, VolumeX, Music, RotateCcw, Target, Zap, Crosshair, Flame, Award, Timer, Gauge } from 'lucide-react';

interface GameHUDProps {
  score: number;
  highScore: number;
  combo: number;
  feverEnergy: number; // 0..100
  isFever: boolean;
  gameMode: GameMode;
  timeLeft: number;
  tenShotsHistory: ('hit' | 'miss' | 'pending')[];
  currentWeapon: WeaponType;
  ammo: number;
  isReloading: boolean;
  tickets: number;
  isMuted: boolean;
  isMusicEnabled: boolean;
  onSelectWeapon: (weapon: WeaponType) => void;
  onReload: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenPrizeShop: () => void;
  onOpenTrophyShelf: () => void;
  onRestartGame: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  combo,
  feverEnergy,
  isFever,
  gameMode,
  timeLeft,
  tenShotsHistory,
  currentWeapon,
  ammo,
  isReloading,
  tickets,
  isMuted,
  isMusicEnabled,
  onSelectWeapon,
  onReload,
  onToggleMute,
  onToggleMusic,
  onOpenPrizeShop,
  onOpenTrophyShelf,
  onRestartGame,
}) => {
  const activeWeaponConfig = WEAPONS[currentWeapon];

  // Calculate Combo Multiplier
  const getMultiplier = () => {
    if (combo >= 15) return '3.0x';
    if (combo >= 10) return '2.5x';
    if (combo >= 6) return '2.0x';
    if (combo >= 3) return '1.5x';
    return '1.0x';
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 mb-2">
      {/* ======================================================== */}
      {/* 1. Top Strip: Score, Mode Status, Fever & Controls      */}
      {/* ======================================================== */}
      <div className="bg-stone-900/90 border border-amber-800/70 rounded-xl p-3.5 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Score & Combo */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯 目前得分</span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-400">最高: {highScore}</span>
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {score.toLocaleString()}
            </div>
          </div>

          {/* Combo Indicator */}
          {combo > 1 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-950/80 to-amber-950/80 border border-amber-500/50 px-3 py-1.5 rounded-lg animate-bounce">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  連擊倍率
                </div>
                <div className="text-base font-black text-amber-400 font-mono">
                  {combo} 連擊 ({getMultiplier()})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mode-Specific Center Display */}
        <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 px-4 py-2 rounded-lg">
          {gameMode === 'TIME_ATTACK' && (
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] text-stone-400 font-bold">剩餘倒數時間</div>
                <div
                  className={`text-2xl font-black font-mono tabular-nums ${
                    timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-200'
                  }`}
                >
                  {timeLeft} 秒
                </div>
              </div>
            </div>
          )}

          {gameMode === 'TEN_SHOTS' && (
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-stone-400 font-bold mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>正宗夜市十發制 (10發全中送巨型柴犬)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {tenShotsHistory.map((status, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono border transition-all ${
                      status === 'hit'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                        : status === 'miss'
                        ? 'bg-red-800 border-red-600 text-stone-200'
                        : 'bg-stone-900 border-stone-700 text-stone-500'
                    }`}
                  >
                    {status === 'hit' ? '✓' : status === 'miss' ? '✕' : idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameMode === 'SLIDING_RUSH' && (
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <div className="text-[10px] text-stone-400 font-bold">極速橫向模式</div>
                <div className="text-sm font-black text-amber-300">
                  全速甩槍極限考驗
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fever Bar */}
        <div className="min-w-[170px] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className={isFever ? 'text-amber-300 animate-pulse' : 'text-stone-400'}>
              ⚡ 狂熱能量 (FEVER)
            </span>
            <span className="font-mono text-amber-400">{isFever ? '雙倍中!' : `${feverEnergy}%`}</span>
          </div>
          <div className="h-3 w-full bg-stone-950 rounded-full border border-stone-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-200 ${
                isFever
                  ? 'bg-gradient-to-r from-amber-400 via-red-500 to-yellow-300 animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-500'
              }`}
              style={{ width: `${isFever ? 100 : feverEnergy}%` }}
            />
          </div>
        </div>

        {/* Quick Utility Icons & Ticket Count */}
        <div className="flex items-center gap-2">
          {/* Tickets counter button (opens prize shop) */}
          <button
            onClick={onOpenPrizeShop}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="查看夜市彩票兌換處"
          >
            <span>🎟️</span>
            <span className="font-mono tabular-nums">{tickets} 張彩票</span>
          </button>

          {/* Trophy Shelf Button */}
          <button
            onClick={onOpenTrophyShelf}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="打開我的戰利品展示架"
          >
            <span>🏆</span>
            <span>展示架</span>
          </button>

          {/* Audio Controls */}
          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isMusicEnabled
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-800 text-stone-500 border-stone-700'
            }`}
            title={isMusicEnabled ? '關閉夜市音樂' : '開啟夜市音樂'}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              !isMuted
                ? 'bg-stone-800 text-stone-200 border-stone-700'
                : 'bg-red-950/60 text-red-400 border-red-800'
            }`}
            title={isMuted ? '解除音效靜音' : '音效靜音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset / Restart */}
          <button
            onClick={onRestartGame}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
            title="重新開始此局"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Bottom Strip: Arsenal Weapons [1-4] & Ammo Bar       */}
      {/* ======================================================== */}
      <div className="bg-stone-900/90 border border-amber-800/70 rounded-xl p-3 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* 4 Weapon Selectors */}
        <div className="flex items-center gap-2">
          {(['cork', 'bb', 'dart', 'laser'] as WeaponType[]).map((wKey, idx) => {
            const config = WEAPONS[wKey];
            const isSelected = currentWeapon === wKey;
            return (
              <button
                key={wKey}
                onClick={() => onSelectWeapon(wKey)}
                className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 border-yellow-300 shadow-md scale-102'
                    : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:bg-stone-800'
                }`}
              >
                {/* Hotkey hint */}
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-amber-950 text-amber-200' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  [{idx + 1}]
                </span>

                {/* Weapon Icon */}
                {wKey === 'cork' && <Target className="w-4 h-4" />}
                {wKey === 'bb' && <Zap className="w-4 h-4" />}
                {wKey === 'dart' && <Crosshair className="w-4 h-4" />}
                {wKey === 'laser' && <Flame className="w-4 h-4" />}

                <div className="flex flex-col text-left">
                  <span className="leading-tight">{config.nameZh}</span>
                  <span
                    className={`text-[9px] font-normal ${
                      isSelected ? 'text-amber-950/80' : 'text-stone-500'
                    }`}
                  >
                    容量: {config.maxAmmo} 發
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Ammo & Quick Reload */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
              <span>{activeWeaponConfig.nameZh} 彈匣</span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-400">快捷鍵 [R]</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-2xl font-black font-mono tabular-nums ${
                  ammo === 0 ? 'text-red-500 animate-pulse' : 'text-amber-200'
                }`}
              >
                {isReloading ? '裝填中...' : `${ammo} / ${activeWeaponConfig.maxAmmo}`}
              </span>
            </div>
          </div>

          <button
            onClick={onReload}
            disabled={isReloading || ammo === activeWeaponConfig.maxAmmo}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              ammo === 0
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse shadow-lg'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-200 border-amber-600/40'
            }`}
          >
            {isReloading ? '裝填中 🔄' : '裝填 [R]'}
          </button>
        </div>
      </div>
    </div>
  );
};
