/**
 * Types & Game State Definitions for Night Market Sharpshooter
 */

export type WeaponType = 'cork' | 'bb' | 'dart' | 'laser';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  nameZh: string;
  desc: string;
  maxAmmo: number;
  fireCooldownMs: number;
  damage: number;
  spread: number; // bullet spread in px
  recoil: number; // visual gun recoil in px
  iconName: string;
}

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  cork: {
    id: 'cork',
    name: 'Cork Gun',
    nameZh: '復古軟木塞手槍',
    desc: '經典拔塞音效、軟木塞拋物彈射、強勁推力',
    maxAmmo: 6,
    fireCooldownMs: 380,
    damage: 1,
    spread: 3,
    recoil: 8,
    iconName: 'Target',
  },
  bb: {
    id: 'bb',
    name: 'BB Rifle',
    nameZh: '連發BB玩具步槍',
    desc: '25發大彈量、極低延遲連發掃射、快速點射',
    maxAmmo: 25,
    fireCooldownMs: 130,
    damage: 1,
    spread: 7,
    recoil: 4,
    iconName: 'Zap',
  },
  dart: {
    id: 'dart',
    name: 'Night Market Darts',
    nameZh: '磁吸夜市飛鏢',
    desc: '直感投擲、精準零後座力、手感扎實',
    maxAmmo: 5,
    fireCooldownMs: 280,
    damage: 1,
    spread: 1,
    recoil: 2,
    iconName: 'Crosshair',
  },
  laser: {
    id: 'laser',
    name: 'Neon Laser Gun',
    nameZh: '霓虹雷射手槍',
    desc: '高科技紅外線準星、貫穿射線、炫目光斑',
    maxAmmo: 12,
    fireCooldownMs: 220,
    damage: 1,
    spread: 0,
    recoil: 3,
    iconName: 'Flame',
  },
};

export type GameMode = 'TIME_ATTACK' | 'TEN_SHOTS' | 'SLIDING_RUSH';

export interface GameModeInfo {
  id: GameMode;
  name: string;
  tagline: string;
  desc: string;
  icon: string;
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: 'TIME_ATTACK',
    name: '60秒限時挑戰',
    tagline: '連擊狂熱 2x 雙倍爆發',
    desc: '在 60 秒內擊落最多的目標！連續命中可累積連擊倍率，並觸發全螢幕狂熱黃金時間！',
    icon: 'Timer',
  },
  {
    id: 'TEN_SHOTS',
    name: '經典十發包廂',
    tagline: '正宗十發制！滿靶必抱大柴犬',
    desc: '夜市最經典 10 發規則！十發十中達成「特等神射手」，直接抱走特等獎巨型柴犬娃娃！',
    icon: 'Award',
  },
  {
    id: 'SLIDING_RUSH',
    name: '橫向滑行極速',
    tagline: '甩槍反應極限衝刺',
    desc: '全軌道高密度橫向滑動！目標以不同速度與方向快速閃過，考驗極限動態視力與甩槍技巧！',
    icon: 'Gauge',
  },
];

export type TargetKind =
  | 'duck'
  | 'helmet_duck'
  | 'golden_duck'
  | 'balloon_red'
  | 'balloon_blue'
  | 'balloon_green'
  | 'balloon_purple'
  | 'balloon_rainbow'
  | 'bullseye'
  | 'boba'
  | 'bomb';

export interface TargetEntity {
  id: string;
  kind: TargetKind;
  name: string;
  points: number;
  hp: number; // For helmet duck, hp=2
  maxHp: number;
  // Position & physics
  location: 'RAIL_TOP' | 'WINDOW';
  windowIndex?: number; // 0..5
  x: number; // percentage (0..100) or px
  y: number; // percentage
  speedX: number; // movement delta
  direction: 1 | -1;
  width: number;
  height: number;
  // Timing
  lifetimeMs: number;
  maxLifetimeMs: number;
  isHit: boolean;
  isPeekOut: boolean; // For window popups
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
  type: 'spark' | 'feather' | 'balloon_rubber' | 'confetti' | 'smoke' | 'score_text' | 'cork_tether';
  text?: string;
}

export interface PrizeItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  image?: string;
  icon: string;
  flavorText: string;
  soundType: string;
  claimedCount: number;
}

export interface PlayerStats {
  tickets: number;
  highScore: number;
  totalGamesPlayed: number;
  perfectTenShotsCount: number;
  totalHits: number;
  totalShots: number;
  inventory: Record<string, number>; // prizeId -> count
}
