import React, { useState, useEffect } from 'react';
import { X, Trophy, Check, Copy, RefreshCw, Send, ShieldCheck, Database } from 'lucide-react';

interface GameRecordItem {
  time: string;
  playerName: string;
  gameMode: string;
  score: number;
  accuracy: string;
  hits: number;
  maxCombo: number;
  weapon: string;
  coins: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer?: { name: string; lastLogin: string } | null;
  currentRoundScore?: number;
  currentRoundMode?: string;
  currentRoundAccuracy?: number;
  currentRoundHits?: number;
  currentRoundCombo?: number;
  currentRoundWeapon?: string;
  currentRoundCoins?: number;
  isPerfectTen?: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  currentRoundScore,
  currentRoundMode = '60秒限時挑戰',
  currentRoundAccuracy = 0,
  currentRoundHits = 0,
  currentRoundCombo = 0,
  currentRoundWeapon = '復古軟木塞手槍',
  currentRoundCoins = 0,
  isPerfectTen = false,
}) => {
  const [records, setRecords] = useState<GameRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [source, setSource] = useState<string>('local');
  const [sheetStatus, setSheetStatus] = useState<any>(null);

  // Score submission
  const [playerName, setPlayerName] = useState<string>(currentPlayer?.name || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Sheet ID configuration input
  const [sheetIdInput, setSheetIdInput] = useState<string>('');
  const [isUpdatingSheetId, setIsUpdatingSheetId] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  useEffect(() => {
    if (currentPlayer?.name) {
      setPlayerName(currentPlayer.name);
    }
  }, [currentPlayer]);

  const fetchStatusAndRecords = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch sheets status
      const statusRes = await fetch('/api/sheets/status');
      const statusData = await statusRes.json();
      setSheetStatus(statusData);
      if (statusData.sheetId) {
        setSheetIdInput(statusData.sheetId);
      }

      // 2. Fetch game records
      const recRes = await fetch('/api/records');
      const recData = await recRes.json();
      setRecords(recData.records || []);
      setSource(recData.source || 'local');
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatusAndRecords();
      setSubmitMessage(null);
    }
  }, [isOpen]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          gameMode: currentRoundMode,
          score: currentRoundScore || 0,
          accuracy: `${currentRoundAccuracy}%`,
          hits: currentRoundHits,
          maxCombo: currentRoundCombo,
          weapon: currentRoundWeapon,
          coins: currentRoundCoins,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage({
          text: data.message || '戰績已成功寫入 Google Sheet「遊戲記錄」工作表！',
          success: true,
        });
        fetchStatusAndRecords();
      } else {
        setSubmitMessage({
          text: data.error || data.warning || '登錄失敗，請重試',
          success: false,
        });
      }
    } catch (err: any) {
      setSubmitMessage({
        text: '連線伺服器失敗: ' + err.message,
        success: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSheetId = async () => {
    if (!sheetIdInput.trim()) return;
    setIsUpdatingSheetId(true);
    try {
      const res = await fetch('/api/sheets/set-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetIdInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatusAndRecords();
      }
    } catch (err) {
      console.error('Failed to update sheet id:', err);
    } finally {
      setIsUpdatingSheetId(false);
    }
  };

  const copyServiceAccountEmail = () => {
    const email =
      sheetStatus?.clientEmail ||
      'google-sheets-api-for-students@sais-1546494421072.iam.gserviceaccount.com';
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-6 py-4 border-b border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-black text-amber-200 tracking-tight flex items-center gap-2">
                <span>夜市神射手 · 遊戲記錄風雲榜</span>
                {source === 'google_sheets' ? (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" />
                    Google Sheets 雙工作表同步中
                  </span>
                ) : (
                  <span className="text-[10px] bg-stone-800 text-stone-400 border border-stone-700 px-2 py-0.5 rounded font-mono">
                    本地榜單
                  </span>
                )}
              </h2>
              <div className="text-xs text-stone-400">
                串接 Google Sheets 工作表：『玩家』與『遊戲記錄』
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatusAndRecords}
              disabled={isLoading}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              title="重新整理記錄"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & GitHub Safe Banner */}
        <div className="bg-amber-950/40 border-b border-amber-900/60 px-6 py-2.5 flex items-center justify-between text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>安全防護提醒：</strong>機密金鑰存於本地 <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">.env</code>，已受 <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">.gitignore</code> 嚴格排除，絕不會上傳或 Push 至 GitHub。
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* 1. Score Submission Card (if launched with round score) */}
          {currentRoundScore !== undefined && currentRoundScore > 0 && (
            <div className="bg-gradient-to-r from-amber-950/70 via-stone-950 to-amber-950/70 border border-amber-500/50 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300">
                  登錄本局戰績至「遊戲記錄」工作表 ({currentRoundScore} 分 · {currentRoundMode} · {currentRoundAccuracy}% 命中)
                </span>
                {isPerfectTen && (
                  <span className="text-[10px] font-bold text-yellow-300 bg-red-950/80 px-2 py-0.5 rounded border border-yellow-500/50">
                    十發全中滿靶
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmitScore} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="輸入玩家名稱 (已登入者自動帶入)"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={18}
                  className="flex-1 bg-stone-900 border border-stone-700 focus:border-amber-500 px-3.5 py-2 rounded-lg text-xs text-white placeholder-stone-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !playerName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? '寫入中...' : '寫入遊戲記錄'}</span>
                </button>
              </form>

              {submitMessage && (
                <div
                  className={`mt-2 text-xs font-bold ${
                    submitMessage.success ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}
            </div>
          )}

          {/* 2. Worksheets Schema Information & Google Sheet ID Binding */}
          <div className="bg-stone-950 rounded-xl border border-stone-800 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Google Sheet 工作表欄位規範</span>
              </span>

              {/* Service Account Email Copy Button */}
              <button
                onClick={copyServiceAccountEmail}
                className="flex items-center gap-1 text-[11px] bg-stone-900 hover:bg-stone-800 border border-stone-700 px-2.5 py-1 rounded text-stone-300 transition-colors cursor-pointer"
                title="複製 Google Service Account 帳號以加入共用"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">已複製服務帳號 Email!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>複製服務帳號 Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Worksheets Specification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
                <div className="font-bold text-amber-200 mb-1">
                  1. 『玩家』工作表
                </div>
                <div className="text-stone-400 font-mono text-[10px]">
                  欄位：[玩家名稱, 密碼, 最後一次登入時間]
                </div>
                <div className="text-stone-500 text-[10px] mt-0.5">
                  支援會員註冊與登入驗證，每次登入自動更新時間。
                </div>
              </div>

              <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
                <div className="font-bold text-amber-200 mb-1">
                  2. 『遊戲記錄』工作表
                </div>
                <div className="text-stone-400 font-mono text-[10px]">
                  欄位：[時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣]
                </div>
                <div className="text-stone-500 text-[10px] mt-0.5">
                  每局射擊成績即時自動追加寫入。
                </div>
              </div>
            </div>

            {/* Sheet ID Input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="貼上 Google Sheet ID (例如: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)"
                value={sheetIdInput}
                onChange={e => setSheetIdInput(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-700 focus:border-amber-500 px-3 py-1.5 rounded-lg text-xs text-white placeholder-stone-500 outline-none font-mono"
              />
              <button
                onClick={handleSaveSheetId}
                disabled={isUpdatingSheetId || !sheetIdInput.trim()}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isUpdatingSheetId ? '綁定中...' : '綁定試算表'}
              </button>
            </div>
          </div>

          {/* 3. Game Records Table matching the 9 columns */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-stone-400 flex items-center justify-between">
              <span>📊 遊戲記錄表（對應工作表：遊戲記錄）</span>
              <span className="text-[11px] text-stone-500">共 {records.length} 筆記錄</span>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-stone-800 bg-stone-950">
              <table className="w-full text-left text-xs text-stone-300 whitespace-nowrap">
                <thead className="bg-stone-900 text-stone-400 text-[11px] border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">排名</th>
                    <th className="py-2.5 px-3 font-bold">時間</th>
                    <th className="py-2.5 px-3 font-bold">玩家名稱</th>
                    <th className="py-2.5 px-3 font-bold">遊戲模式</th>
                    <th className="py-2.5 px-3 font-bold">最終得分</th>
                    <th className="py-2.5 px-3 font-bold">命中率</th>
                    <th className="py-2.5 px-3 font-bold">擊破數</th>
                    <th className="py-2.5 px-3 font-bold">最高連擊</th>
                    <th className="py-2.5 px-3 font-bold">使用武器</th>
                    <th className="py-2.5 px-3 font-bold">獲得夜市幣</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                  {records.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-stone-900/60 transition-colors ${
                        idx === 0
                          ? 'bg-amber-950/30 font-bold text-yellow-300'
                          : idx === 1
                          ? 'text-amber-100'
                          : idx === 2
                          ? 'text-amber-200/80'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-black">
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-stone-500 font-sans">{r.time}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-white">{r.playerName}</td>
                      <td className="py-2.5 px-3 font-sans text-stone-400">{r.gameMode}</td>
                      <td className="py-2.5 px-3 font-black text-amber-300 tabular-nums">
                        {r.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-stone-300">{r.accuracy}</td>
                      <td className="py-2.5 px-3 text-stone-300">{r.hits} 發</td>
                      <td className="py-2.5 px-3 text-amber-400">{r.maxCombo}x</td>
                      <td className="py-2.5 px-3 font-sans text-stone-300">{r.weapon}</td>
                      <td className="py-2.5 px-3 text-yellow-400 font-bold">+{r.coins} 幣</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-amber-900/60 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            自動確保 Google Sheet 具備「玩家」與「遊戲記錄」兩大工作表及欄位
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
