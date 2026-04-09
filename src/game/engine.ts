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

    // Rendering Contexts
    // Rendering Contexts
    private ctx: CanvasRenderingContext2D | null = null;
    private bufferCanvas: HTMLCanvasElement;
    private bufferCtx: CanvasRenderingContext2D;
    private blurredBgCanvas: HTMLCanvasElement;
    private blurredBgCtx: CanvasRenderingContext2D;

    // Game Loop
    private isRunning: boolean = false;
    private animationId: number = 0;
    private lastFrameTime: number = 0;

    // Game Logic
    private activePolygon: Polygon = []; // The current Dark Area (Fog)
    private unlockedPolygons: Polygon[] = []; // Areas cleared (for visual reference if needed)

    // Player State
    private playerPos: Point = { x: 0, y: 0 };
    private playerSegmentIndex: number = 0; // Which segment of activePolygon player is on
    private isDrawing: boolean = false;
    private drawPath: Point[] = [];
    private drawStart: { point: Point, segmentIndex: number } | null = null; // Where we started leaving the border

    // Entities
    private spirits: Spirit[] = [];
    private bigSpirit: BigSpirit | null = null;

    public isWon = false;
    public lastUnlockPercent = 0;
    public spiritSpeed: 1 | 2 | 3 = 2;
    public fogDensity: 1 | 2 | 3 = 2;
    public lives = 1;
    public initialLives = 1;
    public hapticEnabled = true;
    public levelTimeElapsed = 0;
    private winAnimProgress = 0;
    private totalArea = 0;

    // Constants
    private readonly SPEED = 250; // px/s movement speed on border
    private readonly DRAW_SPEED = 300; // px/s drawing speed

    constructor(canvasRef: RefObject<HTMLCanvasElement | null>) {
        this.canvasRef = canvasRef;
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d')!;
        this.blurredBgCanvas = document.createElement('canvas');
        this.blurredBgCtx = this.blurredBgCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    init(config: { spirits: any[], bgImage: string, spiritSpeed?: 1 | 2 | 3, fogDensity?: 1 | 2 | 3, lives?: number, haptic?: boolean }) {
        const canvas = this.canvasRef.current;
        if (!canvas || !this.bufferCtx) return;

        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;

        this.stop();
        this.activePolygon = [];
        this.totalArea = 0;
        this.unlockedPolygons = [];
        this.isWon = false;
        this.winAnimProgress = 0;
        this.levelTimeElapsed = 0;

        // Load Background
        this.bgImage = new Image();
        this.bgImage.src = new URL(config.bgImage, window.location.origin).href;
        this.bgImage.onload = () => {
            if (this.bgImage) this.prepareSilhouetteBackground();
        };
        this.bgImage.onerror = () => {
            console.error('Failed to load level background:', config.bgImage);
            // Even if image fails, we might still want to allow the game to start with a black background
            // or we could signal a failure. For now, let's allow it to run so the user isn't stuck.
            this.prepareSilhouetteBackground(); // Will handle null/incomplete image
        };

        // Setup Initial State
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        canvas.addEventListener('pointerdown', this.handleInput.bind(this));
        canvas.addEventListener('pointermove', this.handleInput.bind(this));
        canvas.addEventListener('pointerup', this.handleRelease.bind(this));

        // Initial Entities
        this.spirits = [];
        this.spiritSpeed = config.spiritSpeed || 2;
        this.fogDensity = config.fogDensity || 2;
        this.initialLives = config.lives || 1;
        this.lives = this.initialLives;
        this.hapticEnabled = config.haptic ?? true;

        // Spawn exactly one Big Spirit per level in the center
        this.bigSpirit = new BigSpirit(canvas.width / 2, canvas.height / 2);
        this.spirits.push(this.bigSpirit);

        config.spirits.forEach(s => {
            // Apply speed scaling base on 1-3 setting
            let count = s.count;
            let speed = s.speed || 150;

            if (this.spiritSpeed === 3) {
                count = Math.floor(count * 1.5);
                speed = speed * 1.5;
            } else if (this.spiritSpeed === 1) {
                count = Math.max(1, Math.floor(count * 0.7));
                speed = speed * 0.7;
            }

            for (let i = 0; i < count; i++) {
                const x = Math.random() * (this.canvasRef.current!.width - 100) + 50;
                const y = Math.random() * (this.canvasRef.current!.height - 100) + 50;
                const spirit = new SmallSpirit(x, y, s.type as SpiritType);
                // Override the default random velocity with scaled speed
                const angle = Math.random() * Math.PI * 2;
                spirit.velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };
                this.spirits.push(spirit);
            }
        });

        this.lastFrameTime = performance.now();
        this.start();
    }

    private prepareSilhouetteBackground() {
        if (!this.bgImage || !this.bgImage.complete || this.bgImage.naturalWidth === 0) {
            // Fill with pure black if no image
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
        const imgW = this.bgImage.width * scale;
        const imgH = this.bgImage.height * scale;
        const x = (width / 2) - imgW / 2;
        const y = (height / 2) - imgH / 2;

        // Step 1: Draw the image to a temp canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
        tempCtx.drawImage(this.bgImage, x, y, imgW, imgH);

        // Step 2: Get image data for edge detection
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Step 3: Convert to grayscale
        const gray = new Float32Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Step 4: Sobel edge detection
        const edges = new Float32Array(width * height);
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        for (let yPos = 1; yPos < height - 1; yPos++) {
            for (let xPos = 1; xPos < width - 1; xPos++) {
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (yPos + ky) * width + (xPos + kx);
                        gx += gray[idx] * sobelX[ky + 1][kx + 1];
                        gy += gray[idx] * sobelY[ky + 1][kx + 1];
                    }
                }
                edges[yPos * width + xPos] = Math.sqrt(gx * gx + gy * gy);
            }
        }

        // Step 5: Normalize and draw edges as white lines on black
        let maxEdge = 0;
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] > maxEdge) maxEdge = edges[i];
        }

        // Fill with pure black background
        this.blurredBgCtx.fillStyle = '#000000';
        this.blurredBgCtx.fillRect(0, 0, width, height);

        // Draw white edges
        const outputData = this.blurredBgCtx.getImageData(0, 0, width, height);
        const outPx = outputData.data;
        const threshold = 30; // Edge detection threshold

        for (let i = 0; i < edges.length; i++) {
            const normalized = maxEdge > 0 ? (edges[i] / maxEdge) * 255 : 0;
            if (normalized > threshold) {
                // White edge with glow effect
                const brightness = Math.min(255, normalized * 2);
                outPx[i * 4] = brightness;
                outPx[i * 4 + 1] = brightness;
                outPx[i * 4 + 2] = brightness;
                outPx[i * 4 + 3] = 255;
            }
        }
        this.blurredBgCtx.putImageData(outputData, 0, 0);

        // Apply blur for glow effect
        this.blurredBgCtx.filter = 'blur(1px)';
        this.blurredBgCtx.drawImage(this.blurredBgCanvas, 0, 0);
        this.blurredBgCtx.filter = 'none';
    }


    resize() {
        if (!this.canvasRef.current || !this.ctx) return;
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvasRef.current.width = width;
        this.canvasRef.current.height = height;
        this.bufferCanvas.width = width;
        this.bufferCanvas.height = height;

        this.prepareSilhouetteBackground();

        // Init Polygon (Full Screen)
        if (this.activePolygon.length === 0) {
            this.activePolygon = [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
                { x: 0, y: height }
            ];
            this.totalArea = width * height;
            this.playerPos = { x: width / 2, y: height };
            const closest = getClosestPointOnPolygon(this.playerPos, this.activePolygon);
            this.playerPos = closest.point;
            this.playerSegmentIndex = closest.segmentIndex;
        }
    }

    // Input Handling
    private targetInputPos: Point | null = null;

    private handleInput(e: PointerEvent) {
        if (!this.canvasRef.current || this.isWon) return;
        const rect = this.canvasRef.current.getBoundingClientRect();
        this.targetInputPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    private handleRelease() {
        this.targetInputPos = null;

        if (this.isDrawing) {
            this.cancelDraw();
            if (this.drawStart) {
                this.playerPos = { ...this.drawStart.point };
                this.playerSegmentIndex = this.drawStart.segmentIndex;
                this.drawStart = null;
            }
        }
    }

    private cancelDraw() {
        if (this.lives > 1) {
            this.lives--;
            // Minimal recovery: player stays at start of current path instead of full reset
            // This is the "Mistake Protection"
            this.playerPos = { ...this.drawPath[0] };
            this.isDrawing = false;
            this.drawPath = [];
            this.drawStart = null;
            audioManager.stopDrawSFX();
            audioManager.triggerHaptic(); // Feedback for lost life
            return;
        }

        this.isDrawing = false;
        this.drawPath = [];
        audioManager.stopDrawSFX();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
    }

    loop(timestamp: number = 0) {
        if (!this.isRunning) return;
        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.update(dt);
        this.render();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    update(dt: number) {
        if (this.isWon) {
            this.winAnimProgress = Math.min(1, this.winAnimProgress + dt * 0.5);
            this.render();
            if (this.winAnimProgress < 1) requestAnimationFrame(this.loop.bind(this)); // Changed gameLoop to loop
            return;
        }

        this.levelTimeElapsed += dt;

        const { width, height } = this.canvasRef.current!;

        // 1. Entities
        this.spirits.forEach(s => {
            s.update(dt, { width, height });
            // SPIRIT CONTAINMENT: Bounce off activePolygon
            if (!isPointInPolygon(s.position, this.activePolygon)) {
                // If drifted outside, push back and reverse velocity
                const closest = getClosestPointOnPolygon(s.position, this.activePolygon);
                s.position = closest.point;
                // Simple reflection: reverse velocity components
                // (Could be more sophisticated using normal, but reverse works for chaos)
                (s as any).vx *= -1.1; // Kick back
                (s as any).vy *= -1.1;
            }
        });

        // 2. Player Movement
        if (this.targetInputPos) {
            this.movePlayer(dt);
        }

        // 3. Game Logic
        if (this.isDrawing) {
            this.checkCollisions();
        }
    }

    movePlayer(dt: number) {
        if (!this.targetInputPos) return;

        const maxStep = (this.isDrawing ? this.DRAW_SPEED : this.SPEED) * dt;

        if (!this.isDrawing) {
            // Feature: Snap to nearest boundary when clicking inside fog
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
                const nextPos = {
                    x: this.playerPos.x + (dx / d) * moveDist,
                    y: this.playerPos.y + (dy / d) * moveDist
                };

                if (this.drawPath.length === 0 || dist(nextPos, this.drawPath[this.drawPath.length - 1]) > 5) {
                    this.drawPath.push(nextPos);
                    // Light haptic feedback as the line extends
                    if (this.hapticEnabled) {
                        // Rate limit haptics to only trigger roughly every 15-20 pixels
                        if (this.drawPath.length % 4 === 0) {
                            audioManager.triggerLightHaptic();
                        }
                    }
                }

                this.playerPos = nextPos;

                const closest = getClosestPointOnPolygon(nextPos, this.activePolygon);
                if (closest.distance < 10) {
                    if (this.drawStart && dist(nextPos, this.drawStart.point) > 30) {
                        this.finishDrawing(closest);
                        return;
                    }
                }
            }
        }
    }

    startDrawing() {
        this.isDrawing = true;
        this.drawPath = [this.playerPos];
        this.drawStart = {
            point: { ...this.playerPos },
            segmentIndex: this.playerSegmentIndex
        };
        audioManager.startDrawSFX();
    }

    finishDrawing(hit: { point: Point, segmentIndex: number }) {
        if (!this.drawStart) return;

        const [poly1, poly2] = splitPolygon(this.activePolygon, this.drawStart, hit, this.drawPath);

        const area1 = getPolygonArea(poly1);
        const area2 = getPolygonArea(poly2);

        let keepPoly: Polygon;
        let trashPoly: Polygon;

        // More robust spirit detection: check center and a few points around it
        const checkSpiritIn = (spirit: Spirit, poly: Polygon) => {
            if (isPointInPolygon(spirit.position, poly)) return true;
            // Epsilon check around spirit
            const eps = 2;
            const probes = [
                { x: spirit.position.x + eps, y: spirit.position.y },
                { x: spirit.position.x - eps, y: spirit.position.y },
                { x: spirit.position.x, y: spirit.position.y + eps },
                { x: spirit.position.x, y: spirit.position.y - eps }
            ];
            return probes.some(p => isPointInPolygon(p, poly));
        };

        if (this.bigSpirit) {
            const p1HasBig = checkSpiritIn(this.bigSpirit, poly1);
            const p2HasBig = checkSpiritIn(this.bigSpirit, poly2);

            if (p1HasBig && !p2HasBig) {
                keepPoly = poly1;
                trashPoly = poly2;
            } else if (!p1HasBig && p2HasBig) {
                keepPoly = poly2;
                trashPoly = poly1;
            } else {
                // If the Big Spirit is in both (on line) or neither (logic failure),
                // we keep the largest area as a safety measure.
                // However, the user wants "Unlock area without Big Spirit".
                // In case of tie, we default to the larger area to prevent accidental "instant wins".
                if (area1 > area2) { keepPoly = poly1; trashPoly = poly2; }
                else { keepPoly = poly2; trashPoly = poly1; }
            }
        } else {
            // No Big Spirit? Clear smaller area.
            if (area1 > area2) { keepPoly = poly1; trashPoly = poly2; }
            else { keepPoly = poly2; trashPoly = poly1; }
        }

        this.activePolygon = keepPoly;
        this.unlockedPolygons.push(trashPoly);

        // CLEANUP SPIRITS: Remove those in trashPoly
        this.spirits = this.spirits.filter(s => {
            if (s instanceof BigSpirit) return true; // Keep Big Spirit always
            const inTrash = isPointInPolygon(s.position, trashPoly);
            return !inTrash; // ONLY keep if NOT in trash
        });

        const newRef = getClosestPointOnPolygon(this.playerPos, this.activePolygon);
        this.playerPos = newRef.point;
        this.playerSegmentIndex = newRef.segmentIndex;

        this.isDrawing = false;
        this.drawPath = [];
        this.drawStart = null;
        audioManager.stopDrawSFX();

        // Area Check
        const area = getPolygonArea(this.activePolygon);
        const percent = 1 - (area / this.totalArea);
        this.lastUnlockPercent = percent;
    }

    checkCollisions() {
        for (const spirit of this.spirits) {
            if (spirit instanceof SmallSpirit || spirit instanceof BigSpirit) {
                for (let i = 0; i < this.drawPath.length - 1; i++) {
                    if (circleSegmentIntersect(spirit.position, spirit.radius, this.drawPath[i], this.drawPath[i + 1])) {
                        if (this.hapticEnabled) {
                            audioManager.triggerHaptic();
                        }
                        audioManager.playCollisionSFX();
                        this.cancelDraw();
                        if (this.drawStart) {
                            this.playerPos = { ...this.drawStart.point };
                            this.playerSegmentIndex = this.drawStart.segmentIndex;
                            this.drawStart = null;
                        }
                        return;
                    }
                }
            }
        }
    }

    render() {
        if (!this.ctx || !this.canvasRef.current) return;
        const { width, height } = this.canvasRef.current;

        // Clear Main
        this.ctx.clearRect(0, 0, width, height);

        // --- BACKGROUND LAYERS ---
        const scale = Math.max(width / this.bgImage!.width, height / this.bgImage!.height);
        const x = (width / 2) - (this.bgImage!.width / 2) * scale;
        const y = (height / 2) - (this.bgImage!.height / 2) * scale;

        // 1. Draw Clear Background initially or everywhere?
        // Let's draw Clear Everywhere, then overlay Fog.
        if (this.bgImage && this.bgImage.complete) {
            this.ctx.drawImage(this.bgImage, x, y, this.bgImage.width * scale, this.bgImage.height * scale);
        }

        // 2. Draw Fog (Silhouette Outline) over the activePolygon
        if (this.activePolygon.length > 0 && this.winAnimProgress < 1) {
            this.ctx.save();

            // Masking: define the fog area
            this.ctx.beginPath();
            this.ctx.moveTo(this.activePolygon[0].x, this.activePolygon[0].y);
            for (let i = 1; i < this.activePolygon.length; i++) {
                this.ctx.lineTo(this.activePolygon[i].x, this.activePolygon[i].y);
            }
            this.ctx.closePath();

            if (this.isWon) {
                // Expanding effect: scale down the fog mask from center
                const cx = width / 2;
                const cy = height / 2;
                this.ctx.translate(cx, cy);
                this.ctx.scale(1 - this.winAnimProgress, 1 - this.winAnimProgress);
                this.ctx.translate(-cx, -cy);
                this.ctx.globalAlpha = 1 - this.winAnimProgress;
            } else {
                // Apply Custom Fog Density
                if (this.fogDensity === 1) this.ctx.globalAlpha = 0.4;
                else if (this.fogDensity === 2) this.ctx.globalAlpha = 0.8;
                else this.ctx.globalAlpha = 1.0;
            }

            this.ctx.clip();

            // Draw the SILHOUETTE OUTLINE (White edges on black)
            if (this.blurredBgCanvas.width > 0) {
                this.ctx.drawImage(this.blurredBgCanvas, 0, 0);
            } else {
                // Fallback to black if outline is not ready
                this.ctx.fillStyle = '#000000';
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        // Don't show entities/player if won
        if (this.isWon) return;

        // 3. Render Active Line
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

        // 4. Render Player
        this.ctx.beginPath();
        this.ctx.arc(this.playerPos.x, this.playerPos.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#facc15';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();

        // 5. Render Spirits
        this.spirits.forEach(s => s.draw(this.ctx!));

        // 6. Render HUD (Lives)
        if (this.initialLives > 1) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px Inter, system-ui';
            this.ctx.fillText(`LIVES: ${'❤️'.repeat(this.lives)}`, 20, 40);
        }
    }

    public calculateStars(timeElapsed: number, targetTime: number, percent: number, threshold: number): number {
        let stars = 1;
        const perfectBonus = percent >= 0.95 ? 1 : 0;
        const timeBonus = timeElapsed < targetTime * 0.5 ? 1 : 0;

        if (percent >= threshold) {
            stars = 1 + perfectBonus + timeBonus;
        }
        return Math.min(3, stars);
    }
}

