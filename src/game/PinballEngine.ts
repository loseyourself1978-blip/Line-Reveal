/**
 * PinballEngine.ts — v1.5.1
 * Pinball Reveal 弹球物理引擎
 *
 * v1.5.1 Bugfix:
 * - 砖块改为不透明（rgba 0.85-0.9）
 * - 背景图片保持原始比例（letterbox）
 *
 * 决策记录（2026-04-25）：
 * - Q2: 多球同时存在时，等全部球落底才扣1球
 * - Q4: 独立球数系统，不消耗桃心命数
 */

import { generateBrickLayout, calcRevealedPercent, type BrickDef, type BrickType } from './BrickLayout';
import { audioManager } from './AudioManager';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// ─── 类型定义 ───────────────────────────────────────────

export interface Point {
    x: number;
    y: number;
}

export interface Ball {
    id: string;
    pos: Point;
    velocity: Point;  // px/s
    radius: number;   // 默认 8
    trail: Point[];   // 光痕（最近 12 帧）
    active: boolean;
}

export interface Paddle {
    x: number;      // 挡板中心 x
    width: number;  // 当前宽度（受道具影响）
    height: number; // 固定高度
    y: number;      // 固定在 canvasH - 80
}

export type PowerUpType = 'multi_ball' | 'wide_paddle' | 'slow_motion' | 'laser_beam' | 'ball_saver';

export interface ActivePowerUp {
    type: PowerUpType;
    remainingMs: number;  // 剩余时间（ms），-1 = 永久/单次
}

export interface FloatingSpirit {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'butterfly' | 'scorpion' | 'spider';
    alive: boolean;
    radius: number;
    animTick: number;
}

export interface CollisionEvent {
    type: 'brick' | 'paddle' | 'wall' | 'spirit';
    brickId?: string;
    brickType?: BrickType;
    spiritId?: string;
}

export interface PinballEngineConfig {
    canvasW: number;
    canvasH: number;
    levelId: number;
    bgImageSrc: string;
    initialBalls: number;   // 初始球数（通常3）
    timeLimit: number;      // 秒
    unlockThreshold: number; // 0~1
    perfectThreshold: number;
    initialSpeed?: number;  // px/s，默认 400
    spiritGuardRatio?: number;
    onBallLost?: () => void;        // 所有球落底时通知
    onGameWon?: (percent: number, timeElapsed: number) => void;
    onGameLost?: () => void;
    onRevealUpdate?: (percent: number) => void;
    onSpiritReleased?: (spirit: FloatingSpirit) => void;
}

// ─── 常量 ───────────────────────────────────────────────

const BALL_RADIUS = 8;
const PADDLE_HEIGHT = 14;
const MAX_TRAIL_LEN = 12;
const INITIAL_SPEED = 400;          // px/s
const SPEED_SCALE_PER_CHAPTER = 1.08;
const MAX_DEFLECT_ANGLE = 30;       // 挡板偏斜最大角度
const SLOW_MOTION_FACTOR = 0.6;
const WIDE_PADDLE_FACTOR = 1.5;
const BALL_SAVER_HEIGHT = 16;

// ─── PinballEngine ───────────────────────────────────────

export class PinballEngine {
    private config: PinballEngineConfig;
    private canvasW: number;
    private canvasH: number;

    // 游戏状态
    private running = false;
    private animId = 0;
    private lastFrameTime = 0;
    private timeElapsed = 0;    // 秒
    private paused = false;

    // 弹球系统（Q2：多球等全部落底才扣）
    private balls: Ball[] = [];
    private ballsRemaining: number;    // 当前剩余发球数（不含场上球）
    private ballIdCounter = 0;

    // 挡板
    private paddle: Paddle;
    private basePaddleWidth: number;

    // 砖块
    private bricks: BrickDef[] = [];
    private brickW = 0;   // 单个砖块像素宽
    private brickH = 0;   // 单个砖块像素高
    private gridW = 20;
    private gridH = 30;
    private brickAreaH = 0;  // 砖块区域高度

    // 精灵
    private spirits: FloatingSpirit[] = [];
    private spiritIdCounter = 0;

    // 道具
    private activePowerUps: ActivePowerUp[] = [];
    private ballSaverActive = false;

    // 背景图
    private bgImage: HTMLImageElement | null = null;
    private bgImageLoaded = false;
    private offscreenCanvas: HTMLCanvasElement | null = null;

    // 渲染 Canvas
    private canvasRef: React.RefObject<HTMLCanvasElement | null> | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // 解锁进度
    private revealedPercent = 0;

    // 游戏结束标志
    private gameEnded = false;

    // 回调
    private onBallLost?: () => void;
    private onGameWon?: (percent: number, timeElapsed: number) => void;
    private onGameLost?: () => void;
    private onRevealUpdate?: (percent: number) => void;
    private onSpiritReleased?: (spirit: FloatingSpirit) => void;

    constructor(config: PinballEngineConfig) {
        this.config = config;
        this.canvasW = config.canvasW;
        this.canvasH = config.canvasH;
        this.ballsRemaining = config.initialBalls;

        this.onBallLost = config.onBallLost;
        this.onGameWon = config.onGameWon;
        this.onGameLost = config.onGameLost;
        this.onRevealUpdate = config.onRevealUpdate;
        this.onSpiritReleased = config.onSpiritReleased;

        // 初始化挡板
        this.basePaddleWidth = Math.floor(this.canvasW * 0.22);
        this.paddle = {
            x: this.canvasW / 2,
            width: this.basePaddleWidth,
            height: PADDLE_HEIGHT,
            y: this.canvasH - 80,
        };

        // 砖块区域占上方 65% 高度
        this.brickAreaH = Math.floor(this.canvasH * 0.65);
        this.brickW = Math.floor(this.canvasW / this.gridW);
        this.brickH = Math.floor(this.brickAreaH / this.gridH);
    }

    /** 绑定 Canvas 并加载背景图 */
    init(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
        this.canvasRef = canvasRef;
        const canvas = canvasRef.current;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d');

        // 加载背景图，完成后生成砖块布局
        this.bgImage = new Image();
        this.bgImage.onload = () => {
            console.log('[PinballEngine] ✅ bgImage loaded:', this.config.bgImageSrc);
            this.bgImageLoaded = true;
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = this.bgImage!.width;
            this.offscreenCanvas.height = this.bgImage!.height;
            const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
            offCtx.drawImage(this.bgImage!, 0, 0);
            const imageData = offCtx.getImageData(0, 0, this.bgImage!.width, this.bgImage!.height);
            this._generateBricks(imageData);
        };
        this.bgImage.onerror = (e) => {
            console.error('[PinballEngine] ❌ bgImage failed to load:', this.config.bgImageSrc, e);
            // 即使图片加载失败，也生成默认空白布局（避免黑屏）
            this._generateBricksFromColor();
        };
        console.log('[PinballEngine] Loading bgImage:', this.config.bgImageSrc);
        this.bgImage.src = this.config.bgImageSrc;
    }

    private _generateBricks(imageData: ImageData) {
        const { levelId } = this.config;
        const spiritGuardRatio = this.config.spiritGuardRatio ?? (levelId < 6 ? 0 : 0.10);
        this.bricks = generateBrickLayout(imageData, {
            levelId,
            gridW: this.gridW,
            gridH: this.gridH,
            spiritGuardRatio,         // Q1: 1-5关=0，6+关=比例
            shieldEnabled: levelId >= 6,  // Q3
            toughEnabled: levelId >= 6,
            explosiveRatio: 0.08,
            bonusRatio: 0.05,
        });
    }

    /** 图片加载失败时：生成默认彩色砖块布局 */
    private _generateBricksFromColor() {
        console.log('[PinballEngine] Using fallback brick generation');
        const { levelId } = this.config;
        this.bricks = [];
        for (let gy = 0; gy < this.gridH; gy++) {
            for (let gx = 0; gx < this.gridW; gx++) {
                // 跳过底部 2 行（留出发球区）
                if (gy >= this.gridH - 2) continue;
                // 随机生成少量空砖块
                if (Math.random() < 0.05) continue;
                const isSpiritGuard = levelId >= 6 && Math.random() < 0.08;
                const isExplosive = Math.random() < 0.05;
                const isTough = levelId >= 6 && Math.random() < 0.15;
                const isShield = levelId >= 6 && Math.random() < 0.03;
                const isBonus = Math.random() < 0.04;
                this.bricks.push({
                    id: `b_${gx}_${gy}`,
                    gridX: gx,
                    gridY: gy,
                    type: isShield ? 'shield' : isExplosive ? 'explosive' : isBonus ? 'bonus' : isSpiritGuard ? 'spirit_guard' : isTough ? 'tough' : 'standard',
                    hp: isTough ? 2 : 1,
                    revealed: false,
                    spiritReleased: false,
                });
            }
        }
        console.log('[PinballEngine] Fallback bricks generated:', this.bricks.length);
    }

    /** 开始游戏循环 */
    start() {
        if (this.running) return;
        console.log('[PinballEngine] start() called, bricks:', this.bricks.length, 'bgImageLoaded:', this.bgImageLoaded);
        this.running = true;
        this._launchBall();
        this.lastFrameTime = performance.now();
        this.animId = requestAnimationFrame(this._loop.bind(this));
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.animId);
    }

    destroy() {
        this.stop();
        this.bgImage = null;
        this.offscreenCanvas = null;
        this.ctx = null;
    }

    // ─── 挡板控制 ────────────────────────────────────────

    movePaddle(x: number) {
        const hw = this.paddle.width / 2;
        this.paddle.x = Math.max(hw, Math.min(this.canvasW - hw, x));
    }

    // ─── 道具激活 ────────────────────────────────────────

    activatePowerUp(type: PowerUpType) {
        switch (type) {
            case 'multi_ball':
                this._spawnExtraBalls(2);
                break;
            case 'wide_paddle':
                this.paddle.width = this.basePaddleWidth * WIDE_PADDLE_FACTOR;
                this.activePowerUps.push({ type, remainingMs: 8000 });
                break;
            case 'slow_motion':
                this.activePowerUps.push({ type, remainingMs: 5000 });
                break;
            case 'ball_saver':
                this.ballSaverActive = true;
                this.activePowerUps.push({ type, remainingMs: -1 });
                break;
            case 'laser_beam':
                this._fireLaser();
                break;
        }
    }

    private _spawnExtraBalls(count: number) {
        for (let i = 0; i < count; i++) {
            const angle = (-80 + i * 20) * Math.PI / 180; // -80°, -60°
            const spd = this._currentSpeed();
            this.balls.push({
                id: `ball_${this.ballIdCounter++}`,
                pos: { x: this.paddle.x + (i - 1) * 20, y: this.paddle.y - BALL_RADIUS - 2 },
                velocity: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
                radius: BALL_RADIUS,
                trail: [],
                active: true,
            });
        }
    }

    private _fireLaser() {
        // 激光：消除挡板 x 位置整列砖块
        const col = Math.round(this.paddle.x / this.brickW);
        this.bricks.forEach(b => {
            if (b.gridX === col && b.type !== 'shield' && !b.revealed) {
                b.revealed = true;
            }
        });
        this._updateRevealedPercent();
    }

    // ─── 主循环 ──────────────────────────────────────────

    private _loop(now: number) {
        if (!this.running) return;
        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05); // cap at 50ms
        this.lastFrameTime = now;

        if (!this.paused) {
            this._update(dt);
            this._draw();
        }

        this.animId = requestAnimationFrame(this._loop.bind(this));
    }

    private _update(dt: number) {
        // 时间统计
        this.timeElapsed += dt;

        // 检查时间限制
        if (this.timeElapsed >= this.config.timeLimit && !this.gameEnded) {
            this._triggerLost();
            return;
        }

        // 慢动作缩放
        const slowMo = this.activePowerUps.some(p => p.type === 'slow_motion');
        const effectiveDt = slowMo ? dt * SLOW_MOTION_FACTOR : dt;

        // 更新道具计时
        this.activePowerUps = this.activePowerUps.filter(p => {
            if (p.remainingMs < 0) return true; // 永久型
            p.remainingMs -= dt * 1000;
            if (p.remainingMs <= 0) {
                // 道具到期处理
                if (p.type === 'wide_paddle') {
                    this.paddle.width = this.basePaddleWidth;
                }
                return false;
            }
            return true;
        });

        // 更新精灵
        this.spirits.forEach(s => {
            if (!s.alive) return;
            s.x += s.vx * effectiveDt;
            s.y += s.vy * effectiveDt;
            s.animTick += dt;
            // 精灵在砖块区域内弹射
            if (s.x - s.radius < 0) { s.x = s.radius; s.vx = Math.abs(s.vx); }
            if (s.x + s.radius > this.canvasW) { s.x = this.canvasW - s.radius; s.vx = -Math.abs(s.vx); }
            if (s.y - s.radius < 0) { s.y = s.radius; s.vy = Math.abs(s.vy); }
            if (s.y + s.radius > this.brickAreaH) { s.y = this.brickAreaH; s.vy = -Math.abs(s.vy); }
        });

        // 更新弹球
        this.balls.forEach(ball => {
            if (!ball.active) return;
            // 记录轨迹
            ball.trail.push({ x: ball.pos.x, y: ball.pos.y });
            if (ball.trail.length > MAX_TRAIL_LEN) ball.trail.shift();

            // 移动
            ball.pos.x += ball.velocity.x * effectiveDt;
            ball.pos.y += ball.velocity.y * effectiveDt;

            // 边界反弹（上/左/右）
            if (ball.pos.x - ball.radius < 0) {
                ball.pos.x = ball.radius;
                ball.velocity.x = Math.abs(ball.velocity.x);
            }
            if (ball.pos.x + ball.radius > this.canvasW) {
                ball.pos.x = this.canvasW - ball.radius;
                ball.velocity.x = -Math.abs(ball.velocity.x);
            }
            if (ball.pos.y - ball.radius < 0) {
                ball.pos.y = ball.radius;
                ball.velocity.y = Math.abs(ball.velocity.y);
            }

            // 检测砖块碰撞
            this._checkBrickCollisions(ball);

            // 检测精灵碰撞
            this._checkSpiritCollisions(ball);

            // 检测挡板碰撞
            this._checkPaddleCollision(ball);

            // 底部死亡线（Ball Saver 保护）
            if (ball.pos.y + ball.radius > this.canvasH) {
                if (this.ballSaverActive) {
                    // 护网弹回
                    ball.pos.y = this.canvasH - ball.radius;
                    ball.velocity.y = -Math.abs(ball.velocity.y);
                    this.ballSaverActive = false;
                    this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'ball_saver');
                } else {
                    ball.active = false;
                    this._tryHaptic(ImpactStyle.Heavy);
                    audioManager.playPinballSFX('ball_lost');
                }
            }
        });

        // Q2: 等全部活跃球都落底才扣1球
        const activeBalls = this.balls.filter(b => b.active);
        if (activeBalls.length === 0 && this.balls.length > 0) {
            this.balls = [];
            this.ballsRemaining -= 1;
            this.onBallLost?.();

            if (this.ballsRemaining > 0) {
                // 还有球，延迟发球
                setTimeout(() => {
                    if (this.running && !this.gameEnded) {
                        this._launchBall();
                    }
                }, 800);
            } else {
                // 无球可用 → 失败
                this._triggerLost();
            }
        }
    }

    // ─── 碰撞检测 ────────────────────────────────────────

    private _checkBrickCollisions(ball: Ball) {
        // 计算砖块区域的偏移（砖块从顶部开始）
        const offsetY = 0;

        for (const brick of this.bricks) {
            if (brick.revealed || brick.type === 'empty') continue;

            // 砖块像素范围
            const bx = brick.gridX * this.brickW;
            const by = offsetY + brick.gridY * this.brickH;
            const bRight = bx + this.brickW;
            const bBottom = by + this.brickH;

            // AABB 圆形碰撞
            const nearX = Math.max(bx, Math.min(bRight, ball.pos.x));
            const nearY = Math.max(by, Math.min(bBottom, ball.pos.y));
            const dx = ball.pos.x - nearX;
            const dy = ball.pos.y - nearY;
            const distSq = dx * dx + dy * dy;

            if (distSq >= ball.radius * ball.radius) continue;

            // 反弹：判断法线方向
            const overlapX = Math.min(ball.pos.x - bx, bRight - ball.pos.x);
            const overlapY = Math.min(ball.pos.y - by, bBottom - ball.pos.y);

            if (overlapX < overlapY) {
                ball.velocity.x = -ball.velocity.x;
                ball.pos.x += ball.velocity.x > 0 ? overlapX : -overlapX;
            } else {
                ball.velocity.y = -ball.velocity.y;
                ball.pos.y += ball.velocity.y > 0 ? overlapY : -overlapY;
            }

            // 砖块受击
            this._hitBrick(brick, ball);
            break; // 每帧只处理一个砖块碰撞（防止穿透连锁）
        }
    }

    private _hitBrick(brick: BrickDef, ball: Ball) {
        if (brick.type === 'shield') return; // Shield 不可消除

        brick.hp -= 1;
        audioManager.playPinballSFX('brick_hit');

        if (brick.hp <= 0) {
            brick.revealed = true;

            if (brick.type === 'spirit_guard' && !brick.spiritReleased) {
                brick.spiritReleased = true;
                this._releaseSpirit(brick.gridX * this.brickW + this.brickW / 2,
                    brick.gridY * this.brickH + this.brickH / 2);
                this._tryHaptic(ImpactStyle.Medium);
                audioManager.playPinballSFX('spirit_release');
            } else if (brick.type === 'explosive') {
                this._explodeBrick(brick);
                this._tryHaptic(ImpactStyle.Heavy);
                audioManager.playPinballSFX('explosion');
            } else if (brick.type === 'bonus') {
                this._dropPowerUp(brick);
                audioManager.playPinballSFX('bonus');
            } else {
                audioManager.playPinballSFX('brick_crack');
            }

            this._updateRevealedPercent();

            // 检查通关
            if (this.revealedPercent >= this.config.unlockThreshold && !this.gameEnded) {
                this._triggerWon();
            }
        }
    }

    private _explodeBrick(center: BrickDef) {
        // 爆炸：消除 8 邻格
        const neighbors = [-1, 0, 1];
        for (const dy of neighbors) {
            for (const dx of neighbors) {
                if (dx === 0 && dy === 0) continue;
                const nx = center.gridX + dx;
                const ny = center.gridY + dy;
                const neighbor = this.bricks.find(b =>
                    b.gridX === nx && b.gridY === ny && !b.revealed && b.type !== 'shield'
                );
                if (neighbor) {
                    neighbor.hp = 0;
                    neighbor.revealed = true;
                }
            }
        }
        this._updateRevealedPercent();
    }

    private _dropPowerUp(brick: BrickDef) {
        // 随机掉落道具（不含 laser_beam 和 ball_saver 由其他机制触发）
        const types: PowerUpType[] = ['multi_ball', 'wide_paddle', 'slow_motion'];
        const t = types[Math.floor(Math.random() * types.length)];
        this.activatePowerUp(t);
    }

    private _checkSpiritCollisions(ball: Ball) {
        for (const spirit of this.spirits) {
            if (!spirit.alive) continue;
            const dx = ball.pos.x - spirit.x;
            const dy = ball.pos.y - spirit.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < ball.radius + spirit.radius) {
                // 精灵偏转球方向 ±20°
                const spiritAngle = Math.atan2(spirit.vy, spirit.vx);
                const deflect = (Math.random() * 40 - 20) * Math.PI / 180; // ±20°
                const ballAngle = Math.atan2(ball.velocity.y, ball.velocity.x);
                const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
                const newAngle = ballAngle + deflect + spiritAngle * 0.3;
                ball.velocity.x = Math.cos(newAngle) * speed;
                ball.velocity.y = Math.sin(newAngle) * speed;

                // 击中精灵 → 精灵消失，激活慢动作
                spirit.alive = false;
                this.activatePowerUp('slow_motion');
                audioManager.playPinballSFX('spirit_hit');
            }
        }
    }

    private _checkPaddleCollision(ball: Ball) {
        const pw = this.paddle.width / 2;
        const px = this.paddle.x;
        const py = this.paddle.y;

        // 球是否在挡板范围内（从上方接触）
        if (
            ball.velocity.y > 0 &&
            ball.pos.y + ball.radius >= py - this.paddle.height / 2 &&
            ball.pos.y - ball.radius <= py + this.paddle.height / 2 &&
            ball.pos.x >= px - pw - ball.radius &&
            ball.pos.x <= px + pw + ball.radius
        ) {
            // 偏斜角度：偏离挡板中心越远，偏斜越大
            const hitOffset = (ball.pos.x - px) / pw; // -1~1
            const deflect = hitOffset * MAX_DEFLECT_ANGLE * Math.PI / 180;
            const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);

            ball.pos.y = py - this.paddle.height / 2 - ball.radius;
            ball.velocity.x = Math.sin(deflect) * speed;
            ball.velocity.y = -Math.cos(deflect) * speed;

            // 挡板闪光触发（通过标志位，由 React 组件检测）
            this._paddleFlashTick = 5;
            this._tryHaptic(ImpactStyle.Light);
            audioManager.playPinballSFX('paddle_hit');
        }
    }

    public _paddleFlashTick = 0; // React 组件轮询此值实现挡板闪光

    // ─── 精灵 ─────────────────────────────────────────────

    private _releaseSpirit(x: number, y: number) {
        const types: FloatingSpirit['type'][] = ['butterfly', 'scorpion', 'spider'];
        const type = types[Math.floor(Math.random() * types.length)];
        const spd = 80 + Math.random() * 60;
        const angle = Math.random() * Math.PI * 2;
        const spirit: FloatingSpirit = {
            id: `spirit_${this.spiritIdCounter++}`,
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            type,
            alive: true,
            radius: 14,
            animTick: 0,
        };
        this.spirits.push(spirit);
        this.onSpiritReleased?.(spirit);
    }

    // ─── 发球 ─────────────────────────────────────────────

    private _launchBall() {
        const speed = this._currentSpeed();
        // 发球角度：-70°（向左上方）
        const angle = -70 * Math.PI / 180;
        this.balls.push({
            id: `ball_${this.ballIdCounter++}`,
            pos: { x: this.paddle.x, y: this.paddle.y - BALL_RADIUS - this.paddle.height / 2 - 2 },
            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            radius: BALL_RADIUS,
            trail: [],
            active: true,
        });
    }

    private _currentSpeed(): number {
        const { levelId, initialSpeed } = this.config;
        const base = initialSpeed ?? INITIAL_SPEED;
        const chapter = Math.floor((levelId - 1) / 5); // 每5关一章
        return base * Math.pow(SPEED_SCALE_PER_CHAPTER, chapter);
    }

    // ─── 胜负触发 ────────────────────────────────────────

    private _triggerWon() {
        this.gameEnded = true;
        this.running = false;
        audioManager.playPinballSFX('win');
        this._tryHaptic(ImpactStyle.Heavy);
        this.onGameWon?.(this.revealedPercent, this.timeElapsed);
    }

    private _triggerLost() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.running = false;
        audioManager.playPinballSFX('lose');
        this.onGameLost?.();
    }

    // ─── 解锁进度 ────────────────────────────────────────

    private _updateRevealedPercent() {
        const prev = this.revealedPercent;
        this.revealedPercent = calcRevealedPercent(this.bricks);
        if (this.revealedPercent !== prev) {
            this.onRevealUpdate?.(this.revealedPercent);
        }
    }

    // ─── 渲染 ─────────────────────────────────────────────

    private _draw() {
        const ctx = this.ctx;
        if (!ctx) return;

        const W = this.canvasW;
        const H = this.canvasH;

        // 清空
        ctx.clearRect(0, 0, W, H);

        // 背景图（全画面模糊版，保持原始比例，添加黑边）
        if (this.bgImageLoaded && this.bgImage) {
            ctx.save();
            ctx.filter = 'blur(4px) brightness(0.35)';

            // 计算 letterbox：保持原始宽高比
            const imgW = this.bgImage.width;
            const imgH = this.bgImage.height;
            const canvasRatio = W / H;
            const imgRatio = imgW / imgH;

            let drawW: number, drawH: number, drawX: number, drawY: number;

            if (imgRatio > canvasRatio) {
                // 图片更宽，按宽度填充，两侧黑边
                drawW = W;
                drawH = W / imgRatio;
                drawX = 0;
                drawY = (H - drawH) / 2;
            } else {
                // 图片更高，按高度填充，上下黑边
                drawH = H;
                drawW = H * imgRatio;
                drawX = (W - drawW) / 2;
                drawY = 0;
            }

            // 先画黑边背景
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, W, H);

            // 画图片（9参数版本：src sx,sy,sW,sH → dst dx,dy,dW,dH）
            ctx.drawImage(this.bgImage, 0, 0, imgW, imgH, drawX, drawY, drawW, drawH);
            ctx.filter = 'none';
            ctx.restore();
        }

        // 绘制砖块
        this._drawBricks(ctx);

        // 绘制 Ball Saver 护网
        if (this.ballSaverActive) {
            ctx.save();
            const grad = ctx.createLinearGradient(0, H - BALL_SAVER_HEIGHT, W, H - BALL_SAVER_HEIGHT);
            grad.addColorStop(0, 'rgba(251,191,36,0)');
            grad.addColorStop(0.5, 'rgba(251,191,36,0.7)');
            grad.addColorStop(1, 'rgba(251,191,36,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, H - BALL_SAVER_HEIGHT, W, BALL_SAVER_HEIGHT);
            ctx.restore();
        }

        // 绘制精灵
        this._drawSpirits(ctx);

        // 绘制弹球（含光痕）
        this.balls.forEach(ball => {
            if (!ball.active) return;
            this._drawBallTrail(ctx, ball);
            this._drawBall(ctx, ball);
        });

        // 绘制挡板
        this._drawPaddle(ctx);
    }

    private _drawBricks(ctx: CanvasRenderingContext2D) {
        for (const brick of this.bricks) {
            if (brick.revealed) {
                // 已消除的砖块：显示底图片段
                if (this.bgImageLoaded && this.bgImage && this.offscreenCanvas) {
                    const srcX = (brick.gridX / this.gridW) * this.bgImage.width;
                    const srcY = (brick.gridY / this.gridH) * this.bgImage.height;
                    const srcW = this.bgImage.width / this.gridW;
                    const srcH = this.bgImage.height / this.gridH;
                    ctx.drawImage(
                        this.offscreenCanvas,
                        srcX, srcY, srcW, srcH,
                        brick.gridX * this.brickW, brick.gridY * this.brickH,
                        this.brickW, this.brickH
                    );
                }
                continue;
            }

            const x = brick.gridX * this.brickW;
            const y = brick.gridY * this.brickH;
            const w = this.brickW - 1;
            const h = this.brickH - 1;

            ctx.save();
            // 砖块底色（不透明，遮住背景）
            switch (brick.type) {
                case 'standard':
                    ctx.fillStyle = 'rgba(139,92,246,0.85)'; // 紫色半透明但不透背景
                    break;
                case 'tough':
                    ctx.fillStyle = 'rgba(59,130,246,0.9)'; // 蓝色高亮
                    break;
                case 'spirit_guard':
                    ctx.fillStyle = 'rgba(251,146,60,0.9)'; // 橙色
                    ctx.shadowColor = '#FB923C';
                    ctx.shadowBlur = 8;
                    break;
                case 'explosive':
                    ctx.fillStyle = 'rgba(239,68,68,0.9)'; // 红色
                    break;
                case 'shield':
                    ctx.fillStyle = 'rgba(148,163,184,0.85)'; // 灰色
                    break;
                case 'bonus':
                    ctx.fillStyle = 'rgba(250,204,21,0.9)'; // 金色
                    ctx.shadowColor = '#FACC15';
                    ctx.shadowBlur = 6;
                    break;
            }
            ctx.fillRect(x, y, w, h);

            // 边框
            ctx.strokeStyle = this._brickBorderColor(brick.type);
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

            // Tough 砖块显示 HP 数字
            if (brick.type === 'tough' && brick.hp > 1) {
                ctx.fillStyle = '#93C5FD';
                ctx.font = `bold ${Math.min(w, h) * 0.55}px system-ui`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(brick.hp), x + w / 2, y + h / 2);
            }

            ctx.restore();
        }
    }

    private _brickBorderColor(type: BrickType): string {
        switch (type) {
            case 'standard': return 'rgba(167,139,250,0.6)';
            case 'tough': return '#60A5FA';
            case 'spirit_guard': return '#FDBA74';
            case 'explosive': return '#FCA5A5';
            case 'shield': return '#CBD5E1';
            case 'bonus': return '#FDE047';
            default: return 'rgba(255,255,255,0.3)';
        }
    }

    private _drawBallTrail(ctx: CanvasRenderingContext2D, ball: Ball) {
        if (ball.trail.length < 2) return;
        ctx.save();
        for (let i = 1; i < ball.trail.length; i++) {
            const alpha = i / ball.trail.length * 0.6;
            const r = ball.radius * (i / ball.trail.length) * 0.8;
            ctx.beginPath();
            ctx.arc(ball.trail[i].x, ball.trail[i].y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,180,${alpha})`;
            ctx.fill();
        }
        ctx.restore();
    }

    private _drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
        ctx.save();
        const grad = ctx.createRadialGradient(
            ball.pos.x - ball.radius * 0.3, ball.pos.y - ball.radius * 0.3, 1,
            ball.pos.x, ball.pos.y, ball.radius
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#FDE68A');
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(253,230,138,0.8)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    }

    private _drawPaddle(ctx: CanvasRenderingContext2D) {
        const flash = this._paddleFlashTick > 0;
        if (this._paddleFlashTick > 0) this._paddleFlashTick--;

        const x = this.paddle.x - this.paddle.width / 2;
        const y = this.paddle.y - this.paddle.height / 2;
        const w = this.paddle.width;
        const h = this.paddle.height;
        const r = h / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();

        if (flash) {
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 20;
        } else {
            const grad = ctx.createLinearGradient(x, y, x, y + h);
            grad.addColorStop(0, '#FBBF24');
            grad.addColorStop(1, '#F59E0B');
            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(251,191,36,0.5)';
            ctx.shadowBlur = 8;
        }
        ctx.fill();

        // 精灵存在时：挡板两侧金色护盾
        const hasSpirits = this.spirits.some(s => s.alive);
        if (hasSpirits) {
            ctx.strokeStyle = '#FCD34D';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    private _drawSpirits(ctx: CanvasRenderingContext2D) {
        for (const spirit of this.spirits) {
            if (!spirit.alive) continue;
            const pulse = 0.7 + 0.3 * Math.sin(spirit.animTick * 6);
            ctx.save();
            ctx.beginPath();
            ctx.arc(spirit.x, spirit.y, spirit.radius * pulse, 0, Math.PI * 2);
            const colorMap = {
                butterfly: '#F9A8D4',
                scorpion: '#86EFAC',
                spider: '#C4B5FD',
            };
            ctx.fillStyle = colorMap[spirit.type] + '99';
            ctx.shadowColor = colorMap[spirit.type];
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
    }

    // ─── Haptic ──────────────────────────────────────────

    private async _tryHaptic(style: ImpactStyle) {
        try {
            await Haptics.impact({ style });
        } catch (_) { /* 模拟器/浏览器忽略 */ }
    }

    // ─── 公开 Getters ────────────────────────────────────

    get currentBallsOnField() { return this.balls.filter(b => b.active).length; }
    get currentBallsRemaining() { return this.ballsRemaining; }
    get currentTimeElapsed() { return this.timeElapsed; }
    get currentRevealedPercent() { return this.revealedPercent; }
    get isGameEnded() { return this.gameEnded; }
    get timeLimit() { return this.config.timeLimit; }
    get activePowerUpList() { return [...this.activePowerUps]; }
    get liveSpirits() { return this.spirits.filter(s => s.alive); }
    get isRunning() { return this.running; }
    get allBricks() { return this.bricks; }
    get brickCellSize() { return { w: this.brickW, h: this.brickH }; }
}
