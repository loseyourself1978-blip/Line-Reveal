export type SpiritType = 'basic' | 'spider' | 'scorpion' | 'butterfly';

export interface Point {
    x: number;
    y: number;
}

export abstract class Spirit {
    position: Point;
    velocity: Point;
    radius: number = 20;
    type: SpiritType;
    color: string;

    // Animation state
    angle: number = 0;
    animState: number = 0;

    image: HTMLImageElement | null = null;

    constructor(x: number, y: number, type: SpiritType) {
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.type = type;
        this.color = '#fff';
    }

    abstract update(dt: number, bounds: { width: number, height: number }): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;

    loadImage(src: string) {
        this.image = new Image();
        this.image.src = src;
    }

    // Helper to bounce off walls
    checkBounds(bounds: { width: number, height: number }) {
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x = Math.abs(this.velocity.x);
        } else if (this.position.x + this.radius > bounds.width) {
            this.position.x = bounds.width - this.radius;
            this.velocity.x = -Math.abs(this.velocity.x);
        }

        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.velocity.y = Math.abs(this.velocity.y);
        } else if (this.position.y + this.radius > bounds.height) {
            this.position.y = bounds.height - this.radius;
            this.velocity.y = -Math.abs(this.velocity.y);
        }
    }
}

export class BigSpirit extends Spirit {
    constructor(x: number, y: number) {
        super(x, y, 'basic');
        this.radius = 40;
        this.color = '#ef4444'; // Red-500
        this.velocity = { x: 50, y: 40 }; // Slow movement
    }

    update(dt: number, bounds: { width: number, height: number }) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.checkBounds(bounds);
        this.animState += dt * 2;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Draw Main Body (Ghostly shape)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-15, -10, 8, 0, Math.PI * 2);
        ctx.arc(15, -10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-15 + Math.sin(this.animState) * 2, -10, 3, 0, Math.PI * 2);
        ctx.arc(15 + Math.sin(this.animState) * 2, -10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class SmallSpirit extends Spirit {
    constructor(x: number, y: number, type: SpiritType) {
        super(x, y, type);
        this.radius = 15;
        this.velocity = {
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200
        };

        switch (type) {
            case 'spider':
                this.color = '#1a1a2e';
                this.loadImage('/assets/spirit_spider.png');
                break;
            case 'scorpion':
                this.color = '#a855f7';
                this.loadImage('/assets/spirit_scorpion.png');
                break;
            case 'butterfly':
                this.color = '#f472b6';
                this.loadImage('/assets/spirit_butterfly.png');
                break;
            default: this.color = '#60a5fa';
        }
    }

    update(dt: number, bounds: { width: number, height: number }) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.checkBounds(bounds);
        this.animState += dt * 10;
        this.angle = Math.atan2(this.velocity.y, this.velocity.x);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle + Math.PI / 2); // Orient forward

        if (this.image && this.image.complete) {
            const size = this.radius * 2.5; // Slightly larger than hitbox
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        } else {
            // Fallback: Primitive drawing
            if (this.type === 'spider') {
                // ... (Keep existing spider draw logic as fallback or just remove if confident)
                // Keeping minimal fallback
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'butterfly') {
                ctx.fillStyle = this.color;
                ctx.fillRect(-10, -10, 20, 20);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
