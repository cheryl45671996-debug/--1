import React, { useState } from 'react';
import { X, User, Lock, LogIn, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (player: { name: string; lastLogin: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('請填寫完整玩家名稱與密碼');
      return;
    }

    setIsLoading(true);
    const endpoint = mode === 'login' ? '/api/player/login' : '/api/player/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || '連線錯誤，請重試');
        return;
      }

      setSuccessMsg(data.message || (mode === 'login' ? '登入成功！' : '註冊成功！'));
      setTimeout(() => {
        onLoginSuccess(data.player);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg('伺服器連線失敗: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Striped Canopy Top Accent */}
        <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_15px,#fef08a_15px,#fef08a_30px)]" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-amber-200">
              {mode === 'login' ? '夜市玩家登入' : '註冊新玩家帳號'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Tabs for Login vs Register */}
          <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl mb-5 border border-stone-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>會員登入</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>快速註冊</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
                玩家名稱 (工作表：玩家 · 玩家名稱)
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-stone-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="輸入您的夜市大俠名稱"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={18}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-stone-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
                密碼 (工作表：玩家 · 密碼)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  placeholder="輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-stone-500 outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 border border-red-800/80 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 p-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-xs rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>連線同步中...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>登入帳號並更新最後登入時間</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>建立玩家帳號並同步至 Google Sheet</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-[10px] text-stone-500 text-center leading-relaxed">
            登入後，每局結束時戰績將自動紀錄到「遊戲記錄」工作表！
          </div>
        </div>
      </div>
    </div>
  );
};
