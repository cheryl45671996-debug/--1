import React, { useState } from 'react';
import { PrizeItem } from '../types/game';
import { sound } from '../utils/audio';
import { X, Trophy, Sparkles } from 'lucide-react';

interface TrophyShelfProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: PrizeItem[];
  inventory: Record<string, number>;
  onOpenShop: () => void;
}

export const TrophyShelf: React.FC<TrophyShelfProps> = ({
  isOpen,
  onClose,
  prizes,
  inventory,
  onOpenShop,
}) => {
  const [activeInteractedId, setActiveInteractedId] = useState<string | null>(null);
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const ownedPrizes = prizes.filter(p => (inventory[p.id] || 0) > 0);

  const handleInteractPrize = (prize: PrizeItem) => {
    setActiveInteractedId(prize.id);
    sound.playToySound(prize.soundType);

    // Cute interactive messages
    const dialogs: Record<string, string[]> = {
      shiba_giant: [
        '「汪汪！主人好厲害！我現在是你的專屬大柴犬了！」',
        '（巨型柴犬甩了甩毛茸茸的尾巴，發出高興的呼嚕聲）',
        '「夜市老闆看到你滿靶抱走我時，眼角都泛著淚光！」',
      ],
      capybara_orange: [
        '（水豚君閉目沉思，頭上的蜜柑微微晃動了一下...）',
        '「心若冰清，天塌不驚。只要有柑橘，哪裡都是溫泉。」',
      ],
      giant_boba_pillow: [
        '（啵啵！吸管傳來飽滿大波霸黑糖珍珠的彈牙聲！）',
        '「半糖去冰特調，給你最完美的療癒靠枕擁抱！」',
      ],
      crispy_chicken: [
        '（滋滋作響！金黃薄脆外皮噴出銷魂胡椒鹽香氣！）',
        '「這塊雞排比臉還大！老闆：記得趁熱吃，切勿微波！」',
      ],
      sausage_garlic: [
        '（喀噠！炭火滋油烤香腸碰了碰旁邊的大蒜鑰匙圈！）',
        '「老饕秘訣：一口烤香腸、一口辛辣生大蒜，神仙組合！」',
      ],
      sweet_potato_balls: [
        '（噗啾！金黃地瓜球被你捏扁後又頑強地膨脹回彈！）',
        '「外脆內軟空心 Q 彈，逛夜市手裡少不了這一包！」',
      ],
      retro_windup_rabbit: [
        '（喀啦喀啦喀啦！發條小兔開始在木架上歡快狂跳！）',
        '「童年回憶殺！眼睛還會一閃一閃放紅白光芒喔！」',
      ],
    };

    const list = dialogs[prize.id] || ['（獎品發出清脆的嘉年華歡呼聲！）'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    setBubbleMessage(chosen);

    setTimeout(() => {
      setActiveInteractedId(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-6 py-4 border-b border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-black text-amber-200 tracking-tight flex items-center gap-2">
                <span>玩家專屬戰利品展示架</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  已收藏 {ownedPrizes.length} / {prizes.length} 款
                </span>
              </h2>
              <div className="text-xs text-stone-400">
                點擊展示架上的娃娃與紀念品，可互動觸發特殊音效與動作！
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

        {/* Interactive Speech Bubble Notification */}
        {bubbleMessage && (
          <div className="bg-amber-950/90 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">{bubbleMessage}</span>
            </div>
            <button
              onClick={() => setBubbleMessage(null)}
              className="text-[10px] text-stone-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Shelf Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/40">
          {ownedPrizes.length === 0 ? (
            /* Empty State */
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-800 rounded-2xl">
              <span className="text-6xl mb-3 opacity-50">🧸</span>
              <h3 className="text-lg font-bold text-stone-300 mb-1">
                展示架上目前空空如也！
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mb-4 leading-relaxed">
                快前往夜市攤位射擊累積彩票，或是挑戰「經典十發包廂」10發全中，把巨型柴犬娃娃抱回家！
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenShop();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                前往獎品兌換處 🎟️
              </button>
            </div>
          ) : (
            /* Tiered Wooden Shelves */
            <div className="flex flex-col gap-8">
              {/* Shelf Row 1: Giant Plushes & High Tier */}
              <div className="relative pt-4 pb-2">
                <div className="text-[11px] font-bold text-amber-400/80 mb-3 flex items-center gap-1.5">
                  <span>🥇 特等與頭獎展位</span>
                  <span className="text-stone-600">·</span>
                  <span className="text-stone-400">點擊互動</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                  {ownedPrizes.map(prize => {
                    const count = inventory[prize.id] || 0;
                    const isInteracting = activeInteractedId === prize.id;

                    return (
                      <div
                        key={prize.id}
                        onClick={() => handleInteractPrize(prize)}
                        className={`group relative bg-stone-900/90 rounded-2xl border-2 p-4 flex flex-col items-center justify-between cursor-pointer transition-all duration-200 shadow-xl ${
                          isInteracting
                            ? 'border-yellow-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                            : 'border-amber-800/80 hover:border-amber-400/80 hover:-translate-y-1'
                        }`}
                      >
                        {/* Count Stamp */}
                        <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          x{count}
                        </div>

                        {/* Visual */}
                        <div className="w-full h-36 flex items-center justify-center overflow-hidden rounded-xl bg-stone-950/70 mb-2">
                          {prize.image ? (
                            <img
                              src={prize.image}
                              alt={prize.name}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover transition-transform duration-300 ${
                                isInteracting ? 'scale-115 rotate-2' : 'group-hover:scale-105'
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-6xl transition-transform ${
                                isInteracting ? 'scale-125' : 'group-hover:scale-110'
                              }`}
                            >
                              {prize.icon}
                            </span>
                          )}
                        </div>

                        {/* Title & Category */}
                        <div className="text-center">
                          <h4 className="text-sm font-black text-amber-100 group-hover:text-yellow-300 transition-colors">
                            {prize.name}
                          </h4>
                          <span className="text-[10px] text-stone-400">
                            {prize.category}
                          </span>
                        </div>

                        {/* Click to Squeak Hint */}
                        <div className="mt-2 text-[9px] text-amber-400/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          🔊 點擊發出聲響
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Polished Mahogany Wooden Shelf Plank Underneath */}
                <div className="w-full h-5 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 border-t-2 border-amber-600 rounded-b-md shadow-2xl mt-4" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-amber-900/60 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            💾 所有兌換之戰利品已自動保存於本機儲存空間
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenShop();
            }}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg shadow transition-colors cursor-pointer"
          >
            兌換更多獎品 🎟️
          </button>
        </div>
      </div>
    </div>
  );
};
