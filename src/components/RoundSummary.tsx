import React, { useEffect, useState } from 'react';
import { GameMode } from '../types/game';
import { sound } from '../utils/audio';
import { Trophy, RotateCcw, ShoppingBag } from 'lucide-react';

interface RoundSummaryProps {
  isOpen: boolean;
  score: number;
  accuracy: number;
  totalHits: number;
  totalShots: number;
  maxCombo: number;
  ticketsEarned: number;
  gameMode: GameMode;
  isPerfectTen: boolean;
  onPlayAgain: () => void;
  onOpenPrizeShop: () => void;
  onOpenTrophyShelf: () => void;
  onOpenLeaderboard: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  isOpen,
  score,
  accuracy,
  totalHits,
  totalShots,
  maxCombo,
  ticketsEarned,
  gameMode,
  isPerfectTen,
  onPlayAgain,
  onOpenPrizeShop,
  onOpenTrophyShelf,
  onOpenLeaderboard,
}) => {
  const [dispensedTickets, setDispensedTickets] = useState(0);

  // Animated ticket dispenser simulation
  useEffect(() => {
    if (!isOpen) {
      setDispensedTickets(0);
      return;
    }

    if (isPerfectTen) {
      sound.playFeverTrigger();
    } else {
      sound.playPrizeRedeem();
    }

    // Step-by-step ticket dispenser animation
    let count = 0;
    const target = ticketsEarned;
    if (target <= 0) return;

    const interval = setInterval(() => {
      count += Math.ceil(target / 20) || 1;
      if (count >= target) {
        setDispensedTickets(target);
        clearInterval(interval);
      } else {
        setDispensedTickets(count);
        sound.playTicketPayout();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, ticketsEarned, isPerfectTen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Striped Canopy Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_15px,#fef08a_15px,#fef08a_30px)]" />

        {/* Grand Title */}
        <div className="mt-2 mb-4">
          {isPerfectTen ? (
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-5xl mb-1">🐕👑</span>
              <div className="text-2xl font-black text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]">
                十發全中 · 特等獎神射手！
              </div>
              <div className="text-xs text-amber-200 mt-1">
                恭喜達成 10/10 滿靶！巨型柴犬娃娃已直接入庫！
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">🎪🎯</span>
              <div className="text-2xl font-black text-amber-100">
                本局結算 · 神射手成績單
              </div>
              <div className="text-xs text-stone-400 mt-0.5">
                夜市射擊攤老闆：手法俐落，下次再來挑戰！
              </div>
            </div>
          )}
        </div>

        {/* Big Score Box */}
        <div className="w-full bg-stone-950/90 rounded-2xl border border-amber-900/80 p-5 mb-5 shadow-inner">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            本局最終得分
          </div>
          <div className="text-5xl font-black text-white font-mono tabular-nums tracking-tight">
            {score.toLocaleString()}
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3 mb-5">
          <div className="bg-stone-950/80 rounded-xl border border-stone-800 p-3">
            <div className="text-[10px] text-stone-400 font-bold">射擊命中率</div>
            <div className="text-xl font-black text-amber-200 font-mono mt-0.5">
              {accuracy}%
            </div>
            <div className="text-[9px] text-stone-500">
              {totalHits}/{totalShots} 發
            </div>
          </div>

          <div className="bg-stone-950/80 rounded-xl border border-stone-800 p-3">
            <div className="text-[10px] text-stone-400 font-bold">最高連擊</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              {maxCombo} 連中
            </div>
            <div className="text-[9px] text-stone-500">COMBO STREAK</div>
          </div>

          <div className="bg-stone-950/80 rounded-xl border border-stone-800 p-3">
            <div className="text-[10px] text-stone-400 font-bold">挑戰模式</div>
            <div className="text-sm font-black text-amber-300 mt-1 truncate">
              {gameMode === 'TIME_ATTACK'
                ? '60秒限時'
                : gameMode === 'TEN_SHOTS'
                ? '經典十發'
                : '極速滑行'}
            </div>
          </div>
        </div>

        {/* Animated Ticket Dispenser Ticket Tape */}
        <div className="w-full bg-gradient-to-r from-amber-950/80 via-stone-950 to-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce">🎟️</div>
            <div className="text-left">
              <div className="text-xs font-bold text-amber-300">
                彩票機出票中 (TICKETS EARNED)
              </div>
              <div className="text-[10px] text-stone-400">
                可至專櫃兌換巨型柴犬、水豚君與大雞排
              </div>
            </div>
          </div>
          <div className="text-3xl font-black text-yellow-300 font-mono tabular-nums">
            +{dispensedTickets} <span className="text-sm font-sans">張</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Submit to Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 active:scale-98 text-stone-950 font-black text-xs rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 cursor-pointer border border-yellow-300/40"
          >
            <Trophy className="w-4 h-4" />
            <span>登錄成績至 Google Sheet 排行榜 📊</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 active:scale-98 font-bold text-xs rounded-xl shadow transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>再玩一局 (PLAY AGAIN)</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenPrizeShop}
              className="py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 border border-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>獎品兌換處</span>
            </button>

            <button
              onClick={onOpenTrophyShelf}
              className="py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>戰利品展示架</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
