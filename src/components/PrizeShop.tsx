import React from 'react';
import { PrizeItem } from '../types/game';
import { sound } from '../utils/audio';
import { X, ShoppingBag, Check } from 'lucide-react';

interface PrizeShopProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: number;
  prizes: PrizeItem[];
  inventory: Record<string, number>;
  onRedeemPrize: (prizeId: string) => void;
  onOpenShelf: () => void;
}

export const PrizeShop: React.FC<PrizeShopProps> = ({
  isOpen,
  onClose,
  tickets,
  prizes,
  inventory,
  onRedeemPrize,
  onOpenShelf,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-6 py-4 border-b border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <h2 className="text-xl font-black text-amber-200 tracking-tight">
                夜市彩票獎品兌換處
              </h2>
              <div className="text-xs text-stone-400">
                憑神射手累積彩票兌換 · 滿靶特獎立即領取
              </div>
            </div>
          </div>

          {/* Right: Ticket Balance & Close */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-stone-950/80 border border-amber-500/50 px-4 py-2 rounded-xl">
              <span className="text-xl">🎟️</span>
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">持有彩票</div>
                <div className="text-lg font-black text-amber-400 font-mono tabular-nums leading-none">
                  {tickets} 張
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prize List Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prizes.map(prize => {
            const ownedCount = inventory[prize.id] || 0;
            const canAfford = tickets >= prize.cost;

            return (
              <div
                key={prize.id}
                className="relative bg-stone-950/90 rounded-xl border border-amber-900/60 p-4 flex flex-col justify-between hover:border-amber-500/80 transition-all shadow-md group"
              >
                {/* Prize Image / Icon Showcase */}
                <div>
                  <div className="relative w-full h-44 rounded-lg bg-stone-900 overflow-hidden border border-amber-950 flex items-center justify-center mb-3">
                    {prize.image ? (
                      <img
                        src={prize.image}
                        alt={prize.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform">
                        {prize.icon}
                      </div>
                    )}

                    {/* Category Label */}
                    <div className="absolute top-2 left-2 bg-amber-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-800">
                      {prize.category}
                    </div>

                    {/* Owned Badge */}
                    {ownedCount > 0 && (
                      <div className="absolute bottom-2 right-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                        <Check className="w-3.5 h-3.5" />
                        <span>已擁有 x{ownedCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Lore */}
                  <h3 className="text-base font-black text-amber-100 mb-1">
                    {prize.name}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed mb-4">
                    {prize.flavorText}
                  </p>
                </div>

                {/* Redeem Action Strip */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800/80">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🎟️</span>
                    <span className="text-base font-black text-amber-400 font-mono tabular-nums">
                      {prize.cost}
                    </span>
                    <span className="text-[11px] text-stone-400">張</span>
                  </div>

                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      onRedeemPrize(prize.id);
                      sound.playPrizeRedeem();
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md active:scale-95'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{canAfford ? '兌換獎品' : '彩票不足'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-6 py-3.5 border-t border-amber-900/60 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            💡 提示：在「經典十發包廂」模式達成 10/10 滿靶，可額外獲贈巨額彩票！
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenShelf();
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
          >
            前往我的戰利品展示架 →
          </button>
        </div>
      </div>
    </div>
  );
};
