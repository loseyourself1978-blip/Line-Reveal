import type { RefObject } from 'react';
import { BigSpirit, SmallSpirit, type Spirit, type SpiritType } from './entities';
import { circleSegmentIntersect, dist } from './math';
import type { Point } from './math';
import { isPointInPolygon, getPolygonArea, getClosestPointOnPolygon, splitPolygon } from './polygon';
import type { Polygon } from './polygon';
import { audioManager } from './AudioManager';

export class GameEngine {
    private canvasRef: RefObject<HTMLCanvasElement | null>;
    private bgImage: HTMLImageElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private bufferCanvas: HTMLCanvasElement;
    private bufferCtx: CanvasRenderingContext2D;
    private blurredBgCanvas: HTMLCanvasElement;
    private blurredBgCtx: CanvasRenderingContext2D;
    private isRunning: boolean = false;
    private animationId: number = 0;
    private lastFrameTime: number = 0;
    private activePolygon: Polygon = [];
    private unlockedPolygons: Polygon[] = [];
    private originalActivePolygon: Polygon | null = null;
    private playerPos: Point = { x: 0, y: 0 };
    private playerSegmentIndex: number = 0;
    private isDrawing: boolean = false;
    private drawPath: Point[] = [];
    private drawStart: { point: Point, segmentIndex: number } | null = null;
    private spirits: Spirit[] = [];
    private bigSpirit: BigSpirit | null = null;
    public isWon = false;
    public winAnimProgress: number = 0; // v1.4.2: 迷雾消散动画进度 (0-1)
    public showTapHint = false;
    public hintVisible = true;
    public hintBlinkTime = 0;
    public onWonClick: (() => void) | null = null;
    public lastUnlockPercent = 0;
    public cumulativeUnlockedPercent = 0;
    public spiritSpeed: 1 | 2 | 3 = 2;
    public fogDensity: 1 | 2 | 3 = 2;
    public lives = 1;
    public initialLives = 1;
    public hapticEnabled = true;
    public levelTimeElapsed = 0;
    public onLivesZero: (() => void) | null = null;
    private cancelDrawInProgress = false;
    private readonly MIN_UNLOCK_RATIO = 0.03;
    private totalArea = 0;
    private readonly SPEED = 250;
    private readonly DRAW_SPEED = 300;

    constructor(canvasRef: RefObject<HTMLCanvasElement | null>) {
        this.canvasRef = canvasRef;
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d')!;
        this.blurredBgCanvas = document.createElement('canvas');
        this.blurredBgCtx = this.blurredBgCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    init(config: { spirits: any[], bgImage: string, spiritSpeed?: 1 | 2 | 3, fogDensity?: 1 | 2 | 3, lives?: number, haptic?: boolean, onLivesZero?: () => void, onWonClick?: () => void }) {
        const canvas = this.canvasRef.current;
        if (!canvas || !this.bufferCtx) return;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;
        this.stop();
        this.activePolygon = [];
        this.originalActivePolygon = null;
        this.totalArea = 0;
        this.unlockedPolygons = [];
        this.isWon = false;
        this.winAnimProgress = 0; // v1.4.2: 初始化迷雾消散动画
        this.showTapHint = false;
        this.hintVisible = true;
        this.hintBlinkTime = 0;
        this.onWonClick = config.onWonClick ?? null;
        this.levelTimeElapsed = 0;
        this.cumulativeUnlockedPercent = 0;
        this.bgImage = new Image();
        this.bgImage.src = new URL(config.bgImage, window.location.origin).href;
        this.bgImage.onload = () => { if (this.bgImage) this.prepareSilhouetteBackground(); };
        this.bgImage.onerror = () => { console.error('Failed to load level background:', config.bgImage); this.prepareSilhouetteBackground(); };
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
        canvas.addEventListener('pointerdown', this.handleInput.bind(this));
        canvas.addEventListener('pointermove', this.handleInput.bind(this));
        canvas.addEventListener('pointerup', this.handleRelease.bind(this));
        this.spirits = [];
        this.spiritSpeed = config.spiritSpeed || 2;
        this.fogDensity = config.fogDensity || 2;
        this.initialLives = config.lives || 1;
        this.lives = this.initialLives;
        this.hapticEnabled = config.haptic ?? true;
        this.onLivesZero = config.onLivesZero ?? null;
        this.bigSpirit = new BigSpirit(canvas.width / 2, canvas.height / 2);
        this.spirits.push(this.bigSpirit);
        config.spirits.forEach(s => {
            let count = s.count;
            let speed = s.speed || 150;
            if (this.spiritSpeed === 3) { count = Math.floor(count * 1.5); speed = speed * 1.5; }
            else if (this.spiritSpeed === 1) { count = Math.max(1, Math.floor(count * 0.7)); speed = speed * 0.7; }
            for (let i = 0; i < count; i++) {
                const x = Math.random() * (this.canvasRef.current!.width - 100) + 50;
                const y = Math.random() * (this.canvasRef.current!.height - 100) + 50;
                const spirit = new SmallSpirit(x, y, s.type as SpiritType);
                const angle = Math.random() * Math.PI * 2;
                spirit.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
                this.spirits.push(spirit);
            }
        });
        this.lastFrameTime = performance.now();
        this.start();
    }

    prepareSilhouetteBackground() {
        if (!this.bgImage || !this.bgImage.complete || this.bgImage.naturalWidth === 0) {
            const { width, height } = this.bufferCanvas;
            this.blurredBgCanvas.width = width;
            this.blurredBgCanvas.height = height;
            this.blurredBgCtx.fillStyle = '#000000';
            this.blurredBgCtx.fillRect(0, 0, width, height);
            return;
        }
        const { width, height } = this.bufferCanvas;
        this.blurredBgCanvas.width = width;
        this.blurredBgCanvas.height = height;
        const scale = Math.max(width / this.bgImage.width, height / this.bgImage.height);
        const imgWidth = this.bgImage.width * scale;
        const imgHeight = this.bgImage.height * scale;
        const x = width / 2 - imgWidth / 2;
        const y = height / 2 - imgHeight / 2;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
        tempCtx.drawImage(this.bgImage, x, y, imgWidth, imgHeight);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const grayscale = new Float32Array(width * height);
        for (let i = 0; i < data.length; i += 4) { grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; }
        const edges = new Float32Array(width * height);
        const kernelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const kernelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        for (let row = 1; row < height - 1; row++) {
            for (let col = 1; col < width - 1; col++) {
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (row + ky) * width + (col + kx);
                        gx += grayscale[idx] * kernelX[ky + 1][kx + 1];
                        gy += grayscale[idx] * kernelY[ky + 1][kx + 1];
                    }
                }
                edges[row * width + col] = Math.sqrt(gx * gx + gy * gy);
            }
        }
        let maxEdge = 0;
        for (let i = 0; i < edges.length; i++) { if (edges[i] > maxEdge) maxEdge = edges[i]; }
        this.blurredBgCtx.fillStyle = '#000000';
        this.blurredBgCtx.fillRect(0, 0, width, height);
        const output = this.blurredBgCtx.getImageData(0, 0, width, height);
        const outData = output.data;
        const threshold = 30;
        for (let i = 0; i < edges.length; i++) {
            const edgeValue = maxEdge > 0 ? (edges[i] / maxEdge) * 255 : 0;
            if (edgeValue > threshold) {
                const brightness = Math.min(255, edgeValue * 2);
                outData[i * 4] = brightness;
                outData[i * 4 + 1] = brightness;
                outData[i * 4 + 2] = brightness;
                outData[i * 4 + 3] = 255;
            }
        }
        this.blurredBgCtx.putImageData(output, 0, 0);
        this.blurredBgCtx.filter = 'blur(1px)';
        this.blurredBgCtx.drawImage(this.blurredBgCanvas, 0, 0);
        this.blurredBgCtx.filter = 'none';
    }

    resize() {
        if (!this.canvasRef.current || !this.ctx) return;
        // v1.3.4 Bug Fix: 使用 canvas 元素的实际渲染尺寸，而非 window.innerWidth/innerHeight
        // 在 iOS Capacitor WKWebView 中 window.innerHeight 可能不含 safe area，
        // 导致 canvas.height < 实际屏幕高度，背景图底部出现黑边
        const rect = this.canvasRef.current.getBoundingClientRect();
        const cssWidth = rect.width > 0 ? rect.width : (this.canvasRef.current.offsetWidth || window.innerWidth);
        const cssHeight = rect.height > 0 ? rect.height : (this.canvasRef.current.offsetHeight || window.innerHeight);
        const width = Math.round(cssWidth);
        const height = Math.round(cssHeight);
        this.canvasRef.current.width = width;
        this.canvasRef.current.height = height;
        this.bufferCanvas.width = width;
        this.bufferCanvas.height = height;
        this.prepareSilhouetteBackground();
        if (this.activePolygon.length === 0) {
            this.activePolygon = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
            this.totalArea = width * height;
            this.playerPos = { x: width / 2, y: height };
            const snap = getClosestPointOnPolygon(this.playerPos, this.activePolygon);
            this.playerPos = snap.point;
            this.playerSegmentIndex = snap.segmentIndex;
        }
    }

    targetInputPos: Point | null = null;

    handleInput(e: PointerEvent) {
        if (!this.canvasRef.current) return;
        const rect = this.canvasRef.current.getBoundingClientRect();
        this.targetInputPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        // 胜利后点击显示 ResultScreen
        if (this.isWon && this.showTapHint && this.onWonClick) {
            this.onWonClick();
        }
    }

    handleRelease() {
        this.targetInputPos = null;
        if (this.isDrawing) {
            this.isDrawing = false;
            audioManager.stopDrawSFX();
        }
    }

    cancelDraw() {
        if (!this.cancelDrawInProgress) {
            this.cancelDrawInProgress = true;
            this.lives--;
            if (this.lives > 0) {
                if (this.drawPath.length > 0) this.playerPos = { ...this.drawPath[0] };
                else if (this.drawStart) this.playerPos = { ...this.drawStart.point };
                this.isDrawing = false;
                this.drawPath = [];
                this.drawStart = null;
                audioManager.stopDrawSFX();
                audioManager.triggerHaptic();
                this.cancelDrawInProgress = false;
                return;
            }
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            this.isDrawing = false;
            this.drawPath = [];
            this.drawStart = null;
            audioManager.stopDrawSFX();
            audioManager.triggerHaptic();
            this.onLivesZero && this.onLivesZero();
            this.cancelDrawInProgress = false;
        }
    }

    start() { if (!this.isRunning) { this.isRunning = true; this.loop(); } }
    stop() { this.isRunning = false; cancelAnimationFrame(this.animationId); }

    loop(timestamp = 0) {
        if (!this.isRunning) return;
        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        this.update(dt);
        this.render();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    update(dt: number) {
        if (this.isWon) {
            // v1.4.2: 迷雾消散动画 (0.5 秒从中心扩散)
            if (this.winAnimProgress < 1) {
                this.winAnimProgress = Math.min(1, this.winAnimProgress + dt * 2);
            }
            // 迷雾消散完成后显示提示
            if (this.winAnimProgress >= 0.8 && !this.showTapHint) {
                this.showTapHint = true;
                this.hintBlinkTime = 0;
            }
            // 提示闪烁动画（0.5 秒周期）
            if (this.showTapHint) {
                this.hintBlinkTime += dt;
                this.hintVisible = Math.sin(this.hintBlinkTime * Math.PI * 2) > 0;
            }
            this.render();
            return;
        }
        this.levelTimeElapsed += dt;
        const { width, height } = this.canvasRef.current!;
        this.spirits.forEach(s => {
            s.update(dt, { width, height });
            if (!isPointInPolygon(s.position, this.activePolygon)) {
                const closest = getClosestPointOnPolygon(s.position, this.activePolygon);
                s.position = closest.point;
                s.velocity.x *= -1.1;
                s.velocity.y *= -1.1;
            }
        });
        if (this.targetInputPos) this.movePlayer(dt);
        if (this.isDrawing) this.checkCollisions();
    }

    movePlayer(dt: number) {
        if (!this.targetInputPos) return;
        const maxStep = (this.isDrawing ? this.DRAW_SPEED : this.SPEED) * dt;
        if (!this.isDrawing) {
            if (isPointInPolygon(this.targetInputPos, this.activePolygon)) {
                const snap = getClosestPointOnPolygon(this.targetInputPos, this.activePolygon);
                this.playerPos = { ...snap.point };
                this.playerSegmentIndex = snap.segmentIndex;
                this.startDrawing();
                return;
            }
            const draggingState = getClosestPointOnPolygon(this.targetInputPos, this.activePolygon);
            this.playerPos = draggingState.point;
            this.playerSegmentIndex = draggingState.segmentIndex;
        } else {
            const dx = this.targetInputPos.x - this.playerPos.x;
            const dy = this.targetInputPos.y - this.playerPos.y;
            const d = Math.hypot(dx, dy);
            if (d > 0) {
                const moveDist = Math.min(d, maxStep);
                const nextPos = { x: this.playerPos.x + (dx / d) * moveDist, y: this.playerPos.y + (dy / d) * moveDist };
                if (this.drawPath.length === 0 || dist(nextPos, this.drawPath[this.drawPath.length - 1]) > 5) {
                    this.drawPath.push(nextPos);
                    if (this.hapticEnabled && this.drawPath.length % 4 === 0) audioManager.triggerLightHaptic();
                }
                this.playerPos = nextPos;
                const closest = getClosestPointOnPolygon(nextPos, this.activePolygon);
                if (closest.distance < 10 && this.drawStart && dist(nextPos, this.drawStart.point) > 30) {
                    this.finishDrawing(closest);
                }
            }
        }
    }

    startDrawing() {
        this.isDrawing = true;
        this.drawPath = [this.playerPos];
        this.originalActivePolygon = this.activePolygon.map(p => ({ ...p }));
        this.drawStart = { point: { ...this.playerPos }, segmentIndex: this.playerSegmentIndex };
        audioManager.startDrawSFX();
    }

    finishDrawing(closest: { point: Point; segmentIndex: number; distance: number }) {
        if (!this.drawStart) return;
        const [poly1, poly2] = splitPolygon(this.activePolygon, this.drawStart, closest, this.drawPath);
        const area1 = getPolygonArea(poly1);
        const area2 = getPolygonArea(poly2);
        if (area1 < 100 && area2 < 100) {
            this.isDrawing = false;
            this.drawPath = [];
            this.drawStart = null;
            audioManager.stopDrawSFX();
            return;
        }
        let keepPoly: Polygon, trashPoly: Polygon;
        const checkSpiritIn = (spirit: Spirit, poly: Polygon) => {
            if (isPointInPolygon(spirit.position, poly)) return true;
            const margin = 4;
            const offsets = [
                { x: spirit.position.x + margin, y: spirit.position.y },
                { x: spirit.position.x - margin, y: spirit.position.y },
                { x: spirit.position.x, y: spirit.position.y + margin },
                { x: spirit.position.x, y: spirit.position.y - margin },
                { x: spirit.position.x + margin * 0.7, y: spirit.position.y + margin * 0.7 },
                { x: spirit.position.x - margin * 0.7, y: spirit.position.y + margin * 0.7 },
                { x: spirit.position.x + margin * 0.7, y: spirit.position.y - margin * 0.7 },
                { x: spirit.position.x - margin * 0.7, y: spirit.position.y - margin * 0.7 }
            ];
            for (const offset of offsets) { if (isPointInPolygon(offset, poly)) return true; }
            return false;
        };
        if (this.bigSpirit) {
            const p1HasBig = checkSpiritIn(this.bigSpirit, poly1);
            const p2HasBig = checkSpiritIn(this.bigSpirit, poly2);
            if (p1HasBig && !p2HasBig) { keepPoly = poly1; trashPoly = poly2; }
            else if (!p1HasBig && p2HasBig) { keepPoly = poly2; trashPoly = poly1; }
            else {
                const ratio = Math.max(area1, area2) / Math.max(Math.min(area1, area2), 1);
                if (ratio < 2) { if (area1 > area2) { keepPoly = poly1; trashPoly = poly2; } else { keepPoly = poly2; trashPoly = poly1; } }
                else { if (area1 > area2) { keepPoly = poly1; trashPoly = poly2; } else { keepPoly = poly2; trashPoly = poly1; } }
            }
        } else {
            if (area1 > area2) { keepPoly = poly1; trashPoly = poly2; } else { keepPoly = poly2; trashPoly = poly1; }
        }
        const trashArea = getPolygonArea(trashPoly);
        const percent = trashArea / this.totalArea;
        if (percent < this.MIN_UNLOCK_RATIO) {
            if (this.originalActivePolygon) this.activePolygon = this.originalActivePolygon;
            this.isDrawing = false;
            this.drawPath = [];
            this.drawStart = null;
            audioManager.stopDrawSFX();
            return;
        }
        this.activePolygon = keepPoly;
        this.unlockedPolygons.push(trashPoly);
        this.lastUnlockPercent = percent;
        this.cumulativeUnlockedPercent = Math.min(1, this.cumulativeUnlockedPercent + percent);
        this.originalActivePolygon = keepPoly;
        this.spirits = this.spirits.filter(s => { if (s instanceof BigSpirit) return true; return !isPointInPolygon(s.position, trashPoly); });
        const newRef = getClosestPointOnPolygon(this.playerPos, this.activePolygon);
        this.playerPos = newRef.point;
        this.playerSegmentIndex = newRef.segmentIndex;
        this.isDrawing = false;
        this.drawPath = [];
        this.drawStart = null;
        audioManager.stopDrawSFX();
    }

    checkCollisions() {
        if (!this.cancelDrawInProgress) {
            for (const spirit of this.spirits) {
                if (spirit instanceof SmallSpirit || spirit instanceof BigSpirit) {
                    for (let i = 0; i < this.drawPath.length - 1; i++) {
                        if (circleSegmentIntersect(spirit.position, spirit.radius, this.drawPath[i], this.drawPath[i + 1])) {
                            if (this.hapticEnabled) audioManager.triggerHaptic();
                            audioManager.playCollisionSFX();
                            this.cancelDraw();
                            return;
                        }
                    }
                }
            }
        }
    }

    render() {
        if (!this.ctx || !this.canvasRef.current) return;
        const { width, height } = this.canvasRef.current;
        this.ctx.clearRect(0, 0, width, height);
        
        // 1. 绘制背景图片（保持纵横比，完全展示在屏幕内）
        if (this.bgImage && this.bgImage.complete) {
            const scale = Math.min(width / this.bgImage.width, height / this.bgImage.height);
            const imgW = this.bgImage.width * scale;
            const imgH = this.bgImage.height * scale;
            const x = width / 2 - imgW / 2;
            const y = height / 2 - imgH / 2;
            this.ctx.drawImage(this.bgImage, x, y, imgW, imgH);
        }
        
        // 2. 绘制迷雾（胜利时渐变消散）
        if (this.isWon) {
            // v1.4.2: 迷雾渐变消散动画 - 覆盖整个屏幕
            const fogAlpha = Math.max(0, 1 - this.winAnimProgress);
            if (fogAlpha > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = fogAlpha;
                
                // 使用径向渐变从中心消散
                const centerX = width / 2;
                const centerY = height / 2;
                const maxRadius = Math.sqrt(width * width + height * height);
                
                const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(Math.min(1, this.winAnimProgress + 0.1), 'rgba(0, 0, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, width, height);
                this.ctx.restore();
            }
            
            // 迷雾消散后显示提示
            if (this.winAnimProgress >= 0.8 && this.showTapHint && this.hintVisible) {
                this.ctx.save();
                this.ctx.globalAlpha = 1;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                this.ctx.shadowBlur = 10;
                this.ctx.fillText('TAP ANYWHERE TO CONTINUE', width / 2, height - 100);
                this.ctx.restore();
            }
            return;
        }
        
        // 3. 绘制迷雾（未胜利时）
        if (this.activePolygon.length > 0) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(this.activePolygon[0].x, this.activePolygon[0].y);
            for (let i = 1; i < this.activePolygon.length; i++) {
                this.ctx.lineTo(this.activePolygon[i].x, this.activePolygon[i].y);
            }
            this.ctx.closePath();
            
            if (this.fogDensity === 1) this.ctx.globalAlpha = 0.4;
            else if (this.fogDensity === 2) this.ctx.globalAlpha = 0.8;
            else this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 4. 绘制划线
        if (this.isDrawing && this.drawPath.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawPath[0].x, this.drawPath[0].y);
            for (let i = 1; i < this.drawPath.length; i++) {
                this.ctx.lineTo(this.drawPath[i].x, this.drawPath[i].y);
            }
            this.ctx.strokeStyle = '#facc15';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
        
        // 5. 绘制玩家
        this.ctx.beginPath();
        this.ctx.arc(this.playerPos.x, this.playerPos.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#facc15';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        
        // 6. 绘制精灵
        this.spirits.forEach(s => s.draw(this.ctx!));
    }

    calculateStars(timeElapsed: number, targetTime: number, percent: number, threshold: number): number {
        let stars = 1;
        const perfectBonus = percent >= 0.95 ? 1 : 0;
        const timeBonus = timeElapsed < targetTime * 0.5 ? 1 : 0;
        if (percent >= threshold) stars = 1 + perfectBonus + timeBonus;
        return Math.min(3, stars);
    }
}
