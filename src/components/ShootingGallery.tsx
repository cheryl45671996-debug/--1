import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TargetEntity, Particle, WeaponType, WEAPONS } from '../types/game';
import { sound } from '../utils/audio';

interface ShootingGalleryProps {
  currentWeapon: WeaponType;
  ammo: number;
  isFever: boolean;
  onFire: (hit: boolean) => void;
  onTargetHit: (target: TargetEntity, hitX: number, hitY: number) => void;
  onReloadRequested: () => void;
  gameActive: boolean;
}

export const ShootingGallery: React.FC<ShootingGalleryProps> = ({
  currentWeapon,
  ammo,
  isFever,
  onFire,
  onTargetHit,
  onReloadRequested,
  gameActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Crosshair coordinates
  const [crosshairPos, setCrosshairPos] = useState({ x: -100, y: -100 });
  const [isAimingInside, setIsAimingInside] = useState(false);
  const [isMuzzleFlashing, setIsMuzzleFlashing] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Targets state
  const [railTargets, setRailTargets] = useState<TargetEntity[]>([]);
  // 6 windows state: windowIndex 0..5
  const [windowTargets, setWindowTargets] = useState<(TargetEntity | null)[]>([null, null, null, null, null, null]);
  const [windowOpenStates, setWindowOpenStates] = useState<boolean[]>([false, false, false, false, false, false]);

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Weapon cooldown tracking
  const lastShotTimeRef = useRef<number>(0);

  // Spawn timers
  useEffect(() => {
    if (!gameActive) {
      setRailTargets([]);
      setWindowTargets([null, null, null, null, null, null]);
      setWindowOpenStates([false, false, false, false, false, false]);
      particlesRef.current = [];
      return;
    }

    // 1. Initial rail targets
    const initialDucks: TargetEntity[] = [
      {
        id: 'duck_init_1',
        kind: 'duck',
        name: '經典黃色小鴨',
        points: 120,
        hp: 1,
        maxHp: 1,
        location: 'RAIL_TOP',
        x: 10,
        y: 12,
        speedX: 0.18,
        direction: 1,
        width: 64,
        height: 64,
        lifetimeMs: 999999,
        maxLifetimeMs: 999999,
        isHit: false,
        isPeekOut: true,
      },
      {
        id: 'duck_init_2',
        kind: 'helmet_duck',
        name: '鋼盔特技鴨',
        points: 200,
        hp: 2,
        maxHp: 2,
        location: 'RAIL_TOP',
        x: 55,
        y: 12,
        speedX: 0.22,
        direction: 1,
        width: 68,
        height: 68,
        lifetimeMs: 999999,
        maxLifetimeMs: 999999,
        isHit: false,
        isPeekOut: true,
      },
    ];
    setRailTargets(initialDucks);

    // Rail spawner interval
    const railInterval = setInterval(() => {
      setRailTargets(prev => {
        if (prev.length >= 4) return prev;
        const rand = Math.random();
        let kind: TargetEntity['kind'] = 'duck';
        let points = 120;
        let hp = 1;
        let speed = 0.2 + Math.random() * 0.15;
        let name = '經典黃色小鴨';

        if (rand < 0.25) {
          kind = 'golden_duck';
          name = '黃金招財鴨';
          points = 350;
          speed = 0.45; // high speed
        } else if (rand < 0.6) {
          kind = 'helmet_duck';
          name = '鋼盔特技鴨';
          points = 200;
          hp = 2;
        }

        const newTarget: TargetEntity = {
          id: 'rail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          kind,
          name,
          points,
          hp,
          maxHp: hp,
          location: 'RAIL_TOP',
          x: -12,
          y: 12,
          speedX: speed,
          direction: 1,
          width: 64,
          height: 64,
          lifetimeMs: 999999,
          maxLifetimeMs: 999999,
          isHit: false,
          isPeekOut: true,
        };
        return [...prev, newTarget];
      });
    }, 2800);

    // 2. Window pop-up spawner
    const windowInterval = setInterval(() => {
      setWindowTargets(prevTargets => {
        const nextTargets = [...prevTargets];
        // find closed windows
        const availableIndices = prevTargets
          .map((t, idx) => (t === null ? idx : null))
          .filter((v): v is number => v !== null);

        if (availableIndices.length === 0) return prevTargets;

        // Pick 1 or 2 random windows to open
        const numToOpen = Math.random() > 0.6 && availableIndices.length >= 2 ? 2 : 1;
        for (let i = 0; i < numToOpen; i++) {
          if (availableIndices.length === 0) break;
          const pickIndex = availableIndices.splice(Math.floor(Math.random() * availableIndices.length), 1)[0];

          // Determine random target
          const r = Math.random();
          let kind: TargetEntity['kind'] = 'balloon_red';
          let points = 80;
          let hp = 1;
          let name = '紅色氣球';
          let lifetime = 3200 + Math.random() * 1000;

          if (r < 0.12) {
            kind = 'bomb';
            name = '惡作劇排炮炸彈';
            points = -150;
            lifetime = 4000;
          } else if (r < 0.22) {
            kind = 'boba';
            name = '波霸珍珠奶茶';
            points = 150;
            lifetime = 3500;
          } else if (r < 0.35) {
            kind = 'bullseye';
            name = '同心圓木靶';
            points = 180;
            lifetime = 3000;
          } else if (r < 0.45) {
            kind = 'balloon_rainbow';
            name = '彩虹狂熱氣球';
            points = 250;
            lifetime = 2600;
          } else if (r < 0.6) {
            kind = 'balloon_blue';
            name = '藍色氣球';
            points = 70;
          } else if (r < 0.75) {
            kind = 'balloon_green';
            name = '綠色氣球';
            points = 80;
          } else if (r < 0.9) {
            kind = 'balloon_purple';
            name = '紫色氣球';
            points = 90;
          } else {
            kind = 'duck';
            name = '經典黃色小鴨';
            points = 120;
          }

          nextTargets[pickIndex] = {
            id: 'win_' + pickIndex + '_' + Date.now(),
            kind,
            name,
            points,
            hp,
            maxHp: hp,
            location: 'WINDOW',
            windowIndex: pickIndex,
            x: 50,
            y: 50,
            speedX: Math.random() > 0.5 ? 0.08 : -0.08,
            direction: 1,
            width: 70,
            height: 70,
            lifetimeMs: lifetime,
            maxLifetimeMs: lifetime,
            isHit: false,
            isPeekOut: true,
          };

          // Mark window open
          setWindowOpenStates(wPrev => {
            const nw = [...wPrev];
            nw[pickIndex] = true;
            return nw;
          });
        }

        return nextTargets;
      });
    }, 1500);

    return () => {
      clearInterval(railInterval);
      clearInterval(windowInterval);
    };
  }, [gameActive]);

  // Main animation tick: updates rail targets & window fuses
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (gameActive) {
        // Move rail targets
        setRailTargets(prev => {
          return prev
            .map(t => {
              const nx = t.x + t.speedX * (dt / 16);
              return { ...t, x: nx };
            })
            .filter(t => t.x < 115); // off-screen right
        });

        // Decrease window targets countdown fuse
        setWindowTargets(prev => {
          let hasChange = false;
          const next = prev.map((t, idx) => {
            if (!t) return null;
            const rem = t.lifetimeMs - dt;
            if (rem <= 0 || t.isHit) {
              hasChange = true;
              // Close window
              setWindowOpenStates(w => {
                const nw = [...w];
                nw[idx] = false;
                return nw;
              });
              return null;
            }
            return { ...t, lifetimeMs: rem };
          });
          return hasChange ? next : prev;
        });
      }

      // Update particle canvas
      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cvs.width, cvs.height);

          // Update & draw particles
          particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // gravity
            p.rotation += p.rotSpeed;
            p.alpha -= p.decay;

            if (p.alpha <= 0) return false;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);

            if (p.type === 'score_text' && p.text) {
              ctx.font = 'bold 20px "Outfit", "Noto Sans TC", sans-serif';
              ctx.fillStyle = p.color;
              ctx.shadowColor = 'black';
              ctx.shadowBlur = 4;
              ctx.fillText(p.text, 0, 0);
            } else if (p.type === 'feather') {
              // Fluttering feather shape
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.ellipse(0, 0, p.size, p.size * 2.2, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.type === 'balloon_rubber') {
              // Curved rubber shard
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.moveTo(-p.size, -p.size / 2);
              ctx.lineTo(p.size, -p.size);
              ctx.lineTo(0, p.size);
              ctx.closePath();
              ctx.fill();
            } else if (p.type === 'confetti') {
              ctx.fillStyle = p.color;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
            } else if (p.type === 'cork_tether') {
              // Cork bounce
              ctx.fillStyle = '#b45309';
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Spark / smoke
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
            return true;
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameActive]);

  // Adjust canvas resolution to match container
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const cvs = canvasRef.current;
      if (container && cvs) {
        cvs.width = container.clientWidth;
        cvs.height = container.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spawn particle helpers
  const spawnHitParticles = useCallback((x: number, y: number, target: TargetEntity) => {
    const list: Particle[] = [];

    // Floating score text
    const isNegative = target.points < 0;
    list.push({
      id: 'score_' + Math.random(),
      x,
      y: y - 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5,
      size: 20,
      color: isNegative ? '#ef4444' : target.kind === 'golden_duck' ? '#fbbf24' : '#22c55e',
      alpha: 1,
      decay: 0.02,
      rotation: 0,
      rotSpeed: 0,
      type: 'score_text',
      text: (target.points > 0 ? `+${target.points}` : `${target.points}`) + (isFever ? ' (2x!)' : ''),
    });

    if (target.kind === 'duck' || target.kind === 'helmet_duck' || target.kind === 'golden_duck') {
      // Feathers flutter
      const featherColors = target.kind === 'golden_duck' ? ['#fde047', '#f59e0b', '#fff'] : ['#facc15', '#fef08a', '#ffffff'];
      for (let i = 0; i < 18; i++) {
        list.push({
          id: 'feather_' + Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: -3 - Math.random() * 4,
          size: 4 + Math.random() * 4,
          color: featherColors[Math.floor(Math.random() * featherColors.length)],
          alpha: 1,
          decay: 0.018,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          type: 'feather',
        });
      }
    } else if (target.kind.startsWith('balloon_')) {
      // Rubber shards & pop
      const colorMap: Record<string, string[]> = {
        balloon_red: ['#ef4444', '#f87171', '#b91c1c'],
        balloon_blue: ['#3b82f6', '#60a5fa', '#1d4ed8'],
        balloon_green: ['#22c55e', '#4ade80', '#15803d'],
        balloon_purple: ['#a855f7', '#c084fc', '#7e22ce'],
        balloon_rainbow: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
      };
      const colors = colorMap[target.kind] || ['#f87171'];
      const count = target.kind === 'balloon_rainbow' ? 36 : 16;
      for (let i = 0; i < count; i++) {
        list.push({
          id: 'shard_' + Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.025,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          type: target.kind === 'balloon_rainbow' ? 'confetti' : 'balloon_rubber',
        });
      }
    } else if (target.kind === 'bomb') {
      // Explosion smoke & sparks
      for (let i = 0; i < 25; i++) {
        list.push({
          id: 'bomb_' + Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 9,
          vy: (Math.random() - 0.5) * 9,
          size: 6 + Math.random() * 8,
          color: Math.random() > 0.5 ? '#ef4444' : '#475569',
          alpha: 1,
          decay: 0.03,
          rotation: 0,
          rotSpeed: 0,
          type: 'smoke',
        });
      }
    }

    particlesRef.current.push(...list);
  }, [isFever]);

  // Handle shooting action
  const handleShoot = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!gameActive) return;

    const now = performance.now();
    const config = WEAPONS[currentWeapon];
    if (now - lastShotTimeRef.current < config.fireCooldownMs) {
      return; // Weapon in cooldown
    }
    lastShotTimeRef.current = now;

    // Check ammo
    if (ammo <= 0) {
      sound.playDryFire();
      // Show empty text particle
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let clientX = crosshairPos.x;
        let clientY = crosshairPos.y;
        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX - rect.left;
          clientY = e.touches[0].clientY - rect.top;
        }
        particlesRef.current.push({
          id: 'empty_' + Math.random(),
          x: clientX,
          y: clientY,
          vx: 0,
          vy: -1.5,
          size: 16,
          color: '#ef4444',
          alpha: 1,
          decay: 0.03,
          rotation: 0,
          rotSpeed: 0,
          type: 'score_text',
          text: '按 R 裝填！(RELOAD)',
        });
      }
      return;
    }

    // Play weapon sound
    if (currentWeapon === 'cork') {
      sound.playCorkGun();
    } else if (currentWeapon === 'bb') {
      sound.playBBRifle();
    } else if (currentWeapon === 'dart') {
      sound.playDart();
    } else if (currentWeapon === 'laser') {
      sound.playLaser();
    }

    // Muzzle flash
    setIsMuzzleFlashing(true);
    setTimeout(() => setIsMuzzleFlashing(false), 60);

    // Get click coords relative to gallery container
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clickX = 0;
    let clickY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clickX = e.touches[0].clientX - rect.left;
      clickY = e.touches[0].clientY - rect.top;
    } else if ('clientX' in e) {
      clickX = e.clientX - rect.left;
      clickY = e.clientY - rect.top;
    }

    // Add slight spread
    const spreadX = (Math.random() - 0.5) * config.spread * 2;
    const spreadY = (Math.random() - 0.5) * config.spread * 2;
    const actualX = clickX + spreadX;
    const actualY = clickY + spreadY;

    // Muzzle sparks / cork tether particle
    if (currentWeapon === 'cork') {
      particlesRef.current.push({
        id: 'cork_pop_' + Math.random(),
        x: actualX,
        y: actualY,
        vx: (Math.random() - 0.5) * 4,
        vy: -2,
        size: 8,
        color: '#b45309',
        alpha: 1,
        decay: 0.04,
        rotation: Math.random(),
        rotSpeed: 0.1,
        type: 'cork_tether',
      });
    }

    // Raycast / Hit Detection:
    // Priority:
    // 1. Window targets (if window is open)
    // 2. Rail targets
    let hitDetected = false;

    // A. Check 6 Louvered Windows
    // We check DOM bounding rect of each window target element
    for (let i = 0; i < 6; i++) {
      if (!windowOpenStates[i] || !windowTargets[i]) continue;
      const targetElem = document.getElementById(`window-target-${i}`);
      if (targetElem) {
        const tRect = targetElem.getBoundingClientRect();
        const winX = tRect.left - rect.left;
        const winY = tRect.top - rect.top;
        if (
          actualX >= winX &&
          actualX <= winX + tRect.width &&
          actualY >= winY &&
          actualY <= winY + tRect.height
        ) {
          const target = windowTargets[i]!;
          hitDetected = true;
          handleHitTarget(target, actualX, actualY, 'WINDOW', i);
          break;
        }
      }
    }

    // B. Check Top Rail Targets
    if (!hitDetected) {
      for (const t of railTargets) {
        const targetElem = document.getElementById(`rail-target-${t.id}`);
        if (targetElem) {
          const tRect = targetElem.getBoundingClientRect();
          const targetX = tRect.left - rect.left;
          const targetY = tRect.top - rect.top;
          if (
            actualX >= targetX &&
            actualX <= targetX + tRect.width &&
            actualY >= targetY &&
            actualY <= targetY + tRect.height
          ) {
            hitDetected = true;
            handleHitTarget(t, actualX, actualY, 'RAIL_TOP');
            break;
          }
        }
      }
    }

    onFire(hitDetected);
  };

  const handleHitTarget = (
    target: TargetEntity,
    hitX: number,
    hitY: number,
    location: 'WINDOW' | 'RAIL_TOP',
    windowIdx?: number
  ) => {
    // Check HP (e.g. Helmet duck has 2 HP)
    if (target.kind === 'helmet_duck' && target.hp > 1) {
      sound.playShieldHit();
      // Sparks on shield
      particlesRef.current.push({
        id: 'shield_spark_' + Math.random(),
        x: hitX,
        y: hitY,
        vx: 0,
        vy: -2,
        size: 16,
        color: '#e2e8f0',
        alpha: 1,
        decay: 0.03,
        rotation: 0,
        rotSpeed: 0,
        type: 'score_text',
        text: '鋼盔破裂！(1 HIT LEFT)',
      });

      // Reduce HP
      if (location === 'RAIL_TOP') {
        setRailTargets(prev =>
          prev.map(t => (t.id === target.id ? { ...t, hp: t.hp - 1 } : t))
        );
      }
      return;
    }

    // Target killed!
    spawnHitParticles(hitX, hitY, target);

    // Audio by target kind
    if (target.kind === 'duck' || target.kind === 'helmet_duck') {
      sound.playDuckQuack();
    } else if (target.kind === 'golden_duck') {
      sound.playDuckQuack();
      sound.playFeverTrigger();
    } else if (target.kind === 'bullseye') {
      sound.playMetalBell();
    } else if (target.kind === 'boba') {
      sound.playBobaRefill();
    } else if (target.kind === 'bomb') {
      sound.playBombExplosion();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);
    } else if (target.kind.startsWith('balloon_')) {
      sound.playBalloonPop(target.kind === 'balloon_rainbow');
    }

    // Trigger parent hit handler
    onTargetHit(target, hitX, hitY);

    // Remove from state
    if (location === 'RAIL_TOP') {
      setRailTargets(prev => prev.filter(t => t.id !== target.id));
    } else if (location === 'WINDOW' && windowIdx !== undefined) {
      setWindowTargets(prev => {
        const next = [...prev];
        next[windowIdx] = null;
        return next;
      });
      setWindowOpenStates(w => {
        const nw = [...w];
        nw[windowIdx] = false;
        return nw;
      });
    }
  };

  // Crosshair mouse tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCrosshairPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsAimingInside(true)}
      onMouseLeave={() => setIsAimingInside(false)}
      onClick={handleShoot}
      className={`relative w-full max-w-5xl h-[560px] md:h-[620px] mx-auto rounded-2xl overflow-hidden cursor-none select-none transition-transform duration-75 shadow-2xl border-4 ${
        isFever
          ? 'fever-active-border border-amber-400'
          : 'border-amber-900/80'
      } ${screenShake ? 'animate-shutter-shake' : ''}`}
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(30, 15, 5, 0.45) 0%, rgba(15, 7, 2, 0.92) 100%), url('/src/assets/images/night_market_booth_bg_1794225665776.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Carnival Awning / Wooden Trim */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        {/* Striped Canopy Roof */}
        <div className="h-9 w-full bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_20px,#fef08a_20px,#fef08a_40px)] shadow-md flex items-center justify-between px-6 border-b-2 border-amber-950">
          <span className="text-xs font-bold text-amber-950 tracking-wider bg-amber-100/90 px-3 py-0.5 rounded shadow-sm">
            🎪 台灣正宗夜市 · 滿靶特獎射擊場
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-red-700 bg-yellow-300 px-2.5 py-0.5 rounded animate-pulse">
              10 發 50 元 · 滿靶抱柴犬
            </span>
          </div>
        </div>

        {/* Lanterns string visual */}
        <div className="flex justify-around items-center px-8 -mt-1">
          {['🏮', '🏮', '🏮', '🏮', '🏮', '🏮', '🏮'].map((lantern, idx) => (
            <span
              key={idx}
              className="text-lg opacity-90 drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)] animate-pulse"
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              {lantern}
            </span>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. 頂層機械滑軌窗 (Top Mechanical Slider Track)           */}
      {/* ======================================================== */}
      <div className="absolute top-14 left-4 right-4 h-24 bg-gradient-to-b from-amber-950/90 via-stone-900/95 to-amber-950/80 rounded-xl border-2 border-amber-700/60 shadow-inner overflow-hidden z-10 backdrop-blur-xs">
        {/* Steel Track Rail with Cogs */}
        <div className="absolute top-3 left-0 right-0 h-2 bg-gradient-to-r from-stone-400 via-amber-200 to-stone-400 border-y border-stone-600 shadow-sm">
          {/* Small metallic track rivets */}
          <div className="w-full h-full flex justify-between px-2 opacity-60">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className="w-1 h-1 bg-stone-800 rounded-full my-auto" />
            ))}
          </div>
        </div>

        {/* Track Label */}
        <div className="absolute bottom-1 left-3 text-[10px] text-amber-300/70 font-mono tracking-wider">
          ⚙️ 頂層機械連續滑軌 [TRACK SPEED: AUTO]
        </div>

        {/* Rail Moving Targets */}
        {railTargets.map(target => {
          return (
            <div
              key={target.id}
              id={`rail-target-${target.id}`}
              className="absolute top-4 -translate-y-1 transition-transform cursor-pointer"
              style={{
                left: `${target.x}%`,
                width: `${target.width}px`,
                height: `${target.height}px`,
              }}
            >
              {/* Hanging mechanical roller hook */}
              <div className="w-2 h-4 bg-stone-300 mx-auto -mt-2 rounded-xs shadow border border-stone-600" />

              {/* Target Graphic */}
              <div className="relative w-full h-full flex items-center justify-center transition-transform hover:scale-110">
                {target.kind === 'golden_duck' && (
                  <div className="relative filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-bounce">
                    <span className="text-4xl">👑</span>
                    <span className="text-4xl -ml-3">🦆</span>
                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 text-[9px] font-black px-1 rounded-sm shadow">
                      狂熱 350
                    </span>
                  </div>
                )}

                {target.kind === 'helmet_duck' && (
                  <div className="relative">
                    {/* Steel Helmet if hp > 1 */}
                    {target.hp > 1 ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-slate-600 border border-slate-300 text-white rounded-t-full px-2 py-0.5 text-[9px] font-bold shadow flex items-center gap-0.5">
                        <span>🪖</span>
                        <span>2HP</span>
                      </div>
                    ) : (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] text-red-400 font-bold bg-black/60 px-1 rounded">
                        破盾!
                      </div>
                    )}
                    <span className="text-4xl filter drop-shadow">🦆</span>
                    <span className="absolute -bottom-1 right-0 bg-stone-900 text-amber-300 text-[9px] font-bold px-1 rounded">
                      200
                    </span>
                  </div>
                )}

                {target.kind === 'duck' && (
                  <div className="relative">
                    <span className="text-4xl filter drop-shadow">🐤</span>
                    <span className="absolute -bottom-1 right-0 bg-stone-900 text-yellow-300 text-[9px] font-bold px-1 rounded">
                      120
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. 中層六大百葉窗口 (Middle 6 Louvered Windows Grid)       */}
      {/* ======================================================== */}
      <div className="absolute top-44 left-4 right-4 bottom-20 grid grid-cols-3 grid-rows-2 gap-4 z-10">
        {[0, 1, 2, 3, 4, 5].map(winIndex => {
          const isOpen = windowOpenStates[winIndex];
          const target = windowTargets[winIndex];
          const fusePercent = target
            ? Math.max(0, (target.lifetimeMs / target.maxLifetimeMs) * 100)
            : 0;

          return (
            <div
              key={winIndex}
              className="relative rounded-xl overflow-hidden border-3 border-amber-900 bg-stone-950 shadow-2xl flex flex-col justify-between"
              style={{
                boxShadow: isOpen
                  ? 'inset 0 0 25px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0,0,0,0.7)'
                  : 'inset 0 0 15px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              {/* Wooden Window Frame Header & Window Number */}
              <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 opacity-80 pointer-events-none">
                <span className="text-[10px] font-black font-mono text-amber-200/90 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                  #{winIndex + 1}
                </span>
                {isOpen && target && (
                  <span className="text-[9px] text-amber-300 font-bold bg-red-950/90 px-1 rounded animate-pulse">
                    探頭中!
                  </span>
                )}
              </div>

              {/* Countdown Fuse Bar (倒數引信條) */}
              {isOpen && target && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-800 z-30 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      fusePercent > 40 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                    }`}
                    style={{ width: `${fusePercent}%` }}
                  />
                </div>
              )}

              {/* Window Interior Chamber / Target Spot */}
              <div className="relative w-full h-full flex items-center justify-center p-2">
                {/* Carnival booth wallpaper backwall */}
                <div className="absolute inset-0 bg-[radial-gradient(#291508_1px,transparent_1px)] bg-[size:10px_10px] opacity-40" />

                {/* Target inside window */}
                {isOpen && target && (
                  <div
                    id={`window-target-${winIndex}`}
                    className="relative cursor-pointer transition-transform transform scale-100 hover:scale-105 active:scale-95 flex flex-col items-center justify-center"
                  >
                    {/* Target Visual Renderers */}
                    {target.kind === 'balloon_red' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow-[0_4px_8px_rgba(239,68,68,0.7)]">🎈</span>
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow -mt-2">
                          80 分
                        </span>
                      </div>
                    )}

                    {target.kind === 'balloon_blue' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow-[0_4px_8px_rgba(59,130,246,0.7)]">🎈</span>
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow -mt-2">
                          70 分
                        </span>
                      </div>
                    )}

                    {target.kind === 'balloon_green' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow-[0_4px_8px_rgba(34,197,94,0.7)]">🎈</span>
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow -mt-2">
                          80 分
                        </span>
                      </div>
                    )}

                    {target.kind === 'balloon_purple' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow-[0_4px_8px_rgba(168,85,247,0.7)]">🎈</span>
                        <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow -mt-2">
                          90 分
                        </span>
                      </div>
                    )}

                    {target.kind === 'balloon_rainbow' && (
                      <div className="relative flex flex-col items-center animate-pulse">
                        <div className="text-5xl filter drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]">
                          🌈
                        </div>
                        <span className="bg-gradient-to-r from-red-500 via-yellow-500 to-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow mt-1">
                          狂熱氣球 250
                        </span>
                      </div>
                    )}

                    {target.kind === 'bullseye' && (
                      <div className="relative flex flex-col items-center">
                        <span className="text-5xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">🎯</span>
                        <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 rounded shadow mt-1">
                          正中靶心 180
                        </span>
                      </div>
                    )}

                    {target.kind === 'boba' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">🧋</span>
                        <span className="bg-amber-600 text-amber-100 text-[9px] font-black px-1.5 rounded shadow mt-0.5">
                          彈藥全滿! +150
                        </span>
                      </div>
                    )}

                    {target.kind === 'bomb' && (
                      <div className="relative flex flex-col items-center animate-pulse">
                        <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">💣</span>
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 rounded shadow mt-0.5">
                          ⚠️ 惡作劇! -150
                        </span>
                      </div>
                    )}

                    {target.kind === 'duck' && (
                      <div className="relative flex flex-col items-center animate-bounce">
                        <span className="text-5xl filter drop-shadow">🐤</span>
                        <span className="bg-yellow-400 text-stone-900 text-[9px] font-black px-1.5 rounded shadow mt-0.5">
                          小鴨 120
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wooden Shutter / Blinds Overlay (木窗百葉隨機彈開/關閉) */}
              <div
                className={`absolute inset-0 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 transition-all duration-300 ease-in-out pointer-events-none flex flex-col justify-around p-1 border border-amber-950 ${
                  isOpen
                    ? '-translate-y-full opacity-0 pointer-events-none'
                    : 'translate-y-0 opacity-100'
                }`}
              >
                {/* Louver Slats (百葉扇葉) */}
                {Array.from({ length: 6 }).map((_, slatIdx) => (
                  <div
                    key={slatIdx}
                    className="w-full h-3 bg-amber-900/90 border-b-2 border-amber-950 shadow-inner rounded-xs flex items-center justify-between px-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-950 opacity-50" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-950 opacity-50" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. Wooden Counter & Shooting Mat (Bottom Foreground)     */}
      {/* ======================================================== */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-950 via-amber-950 to-amber-900/90 border-t-4 border-amber-700/80 z-20 flex items-center justify-between px-6 shadow-[0_-10px_20px_rgba(0,0,0,0.6)]">
        {/* Left booth stamp */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-900 border border-amber-500/50 flex items-center justify-center text-lg shadow">
            🎯
          </div>
          <div>
            <div className="text-xs font-bold text-amber-200">
              射擊席位 · 按 [R] 鍵快速裝填
            </div>
            <div className="text-[10px] text-stone-400">
              數字鍵 [1 - 4] 切換武器庫
            </div>
          </div>
        </div>

        {/* Quick Reload Button on table for mouse / touch users */}
        <button
          onClick={e => {
            e.stopPropagation();
            onReloadRequested();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-lg border border-yellow-300/40 transition-transform cursor-pointer"
        >
          <span>🔄</span>
          <span>裝填彈藥 (RELOAD [R])</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. Canvas Overlay for Particles, Smoke, Feathers & Text  */}
      {/* ======================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-30 pointer-events-none"
      />

      {/* Muzzle Flash Overlay */}
      {isMuzzleFlashing && (
        <div className="absolute inset-0 bg-amber-200/20 z-25 pointer-events-none transition-opacity duration-75" />
      )}

      {/* ======================================================== */}
      {/* 5. Custom Crosshair Layer                                */}
      {/* ======================================================== */}
      {isAimingInside && (
        <div
          className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-0"
          style={{
            left: `${crosshairPos.x}px`,
            top: `${crosshairPos.y}px`,
          }}
        >
          {/* Weapon Specific Reticle */}
          {currentWeapon === 'cork' && (
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Vintage Brass Circle */}
              <div className="w-10 h-10 rounded-full border-2 border-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60" />
              <div className="absolute left-0 right-0 h-0.5 bg-amber-400/60" />
            </div>
          )}

          {currentWeapon === 'bb' && (
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Tactical BB Reticle */}
              <div className="w-9 h-9 rounded-full border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex items-center justify-center">
                <div className="w-1 h-1 bg-red-400 rounded-full" />
              </div>
              {/* 4 tick notches */}
              <div className="absolute top-1 w-0.5 h-2 bg-red-400" />
              <div className="absolute bottom-1 w-0.5 h-2 bg-red-400" />
              <div className="absolute left-1 h-0.5 w-2 bg-red-400" />
              <div className="absolute right-1 h-0.5 w-2 bg-red-400" />
            </div>
          )}

          {currentWeapon === 'dart' && (
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* Tri-blade Dart Reticle */}
              <div className="w-12 h-12 border-2 border-emerald-400/80 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-300 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              </div>
              <span className="absolute -top-3 text-[10px] font-mono text-emerald-300">🎯</span>
            </div>
          )}

          {currentWeapon === 'laser' && (
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* Holographic Laser Crosshair with Corner Brackets */}
              <div className="w-12 h-12 border border-cyan-400/50 rounded-lg relative flex items-center justify-center animate-pulse">
                {/* Glowing red center infrared dot */}
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,1)]" />
              </div>
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
