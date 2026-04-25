import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class AudioManager {
    private static instance: AudioManager;
    private bgm: HTMLAudioElement | null = null;
    private drawSFX: HTMLAudioElement | null = null;
    private collisionSFX: HTMLAudioElement | null = null;
    private victorySFX: HTMLAudioElement | null = null;

    private constructor() {
        const getUrl = (s: string) => new URL(s, window.location.origin).href;
        this.collisionSFX = new Audio(getUrl('/assets/sfx_collision.mp3'));
        this.victorySFX = new Audio(getUrl('/assets/sfx_victory.mp3'));
        this.drawSFX = new Audio(getUrl('/assets/sfx_draw.mp3'));
        if (this.drawSFX) {
            this.drawSFX.loop = true;
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public static async resume() {
        const instance = AudioManager.getInstance();
        if (instance.bgm) {
            instance.bgm.play().catch(() => { });
        }
    }

    public playBGM(src: string) {
        if (this.bgm && this.bgm.src.includes(src)) return; // Already playing correctly

        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }

        if (!src) return;

        const audioUrl = new URL(src, window.location.origin).href;
        this.bgm = new Audio(audioUrl);
        this.bgm.loop = true;
        this.bgm.volume = 0.4;
        this.bgm.play().catch(() => {
            const resume = () => {
                this.bgm?.play();
                document.removeEventListener('click', resume);
            };
            document.addEventListener('click', resume);
        });
    }

    public playClassicBGM() {
        // Line mode BGM (using a distinct one if possible, otherwise random)
        this.playBGM('/assets/bgm_light.mp3');
    }

    public playJigsawBGM() {
        // Lively and light
        this.playBGM('/assets/bgm_light1.mp3');
    }

    public playMatch3BGM() {
        // Light and happy
        this.playBGM('/assets/bgm_light.mp3');
    }

    public stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }
    }

    public startDrawSFX() {
        if (this.drawSFX && this.drawSFX.paused) {
            this.drawSFX.currentTime = 0;
            this.drawSFX.play().catch(e => console.log('SFX play blocked:', e));
        }
    }

    public stopDrawSFX() {
        if (this.drawSFX && !this.drawSFX.paused) {
            this.drawSFX.pause();
        }
    }

    public playCollisionSFX() {
        if (this.collisionSFX) {
            this.collisionSFX.currentTime = 0;
            this.collisionSFX.play().catch(e => console.log('SFX play blocked:', e));
        }
        this.triggerHaptic();
    }

    public playVictorySFX() {
        if (this.victorySFX) {
            this.victorySFX.currentTime = 0;
            this.victorySFX.play().catch(() => { });
        }
        // Play the female "Wow" voice (if it was a separate file, we'd call it here)
        // Since the user says it's "missing", I'll try to find if there's a wow.mp3
        // For now, assume sfx_victory might have it or we need to add a call
        this.playWowVoice();
    }

    public playWowVoice() {
        const getUrl = (s: string) => new URL(s, window.location.origin).href;
        // v1.4.2+: 尝试播放 sfx_wow.mp3，如果不存在则使用 sfx_victory.mp3
        const wow = new Audio(getUrl('/assets/sfx_wow.mp3'));
        wow.volume = 0.8;
        wow.play().catch(() => {
            // Fallback to victory SFX if wow not found
            const victory = new Audio(getUrl('/assets/sfx_victory.mp3'));
            victory.volume = 0.8;
            victory.play().catch(() => {});
        });
    }

    public async triggerHaptic() {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Fallback for non-native environments
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }
    }

    public async triggerLightHaptic() {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Fallback
        }
    }

    public playMatchSFX() {
        if (this.drawSFX) {
            const clone = this.drawSFX.cloneNode() as HTMLAudioElement;
            clone.loop = false;
            clone.play().catch(() => { });
        }
        this.triggerLightHaptic();
    }

    public playMatchSuccessSFX() {
        const getUrl = (s: string) => new URL(s, window.location.origin).href;
        const bell = new Audio(getUrl('/assets/sfx_match_success.mp3'));
        bell.volume = 0.6;
        bell.play().catch(() => {
            // Fallback to standard match sfx if bell missing
            this.playMatchSFX();
        });
        this.triggerLightHaptic();
    }

    public playMatchFailSFX() {
        const getUrl = (s: string) => new URL(s, window.location.origin).href;
        const dud = new Audio(getUrl('/assets/sfx_match_fail.mp3'));
        dud.volume = 0.5;
        dud.play().catch(() => { });
        this.triggerHaptic();
    }

    /**
     * v1.5.0: Pinball Reveal 专属音效
     * 复用已有音效文件（无专属文件时降级处理）
     */
    public playPinballSFX(type: 'paddle_hit' | 'brick_hit' | 'brick_crack' | 'explosion' | 'spirit_release' | 'spirit_hit' | 'bonus' | 'ball_lost' | 'win' | 'lose') {
        const getUrl = (s: string) => new URL(s, window.location.origin).href;
        const play = (src: string, vol = 0.6) => {
            const a = new Audio(getUrl(src));
            a.volume = vol;
            a.play().catch(() => {});
        };

        switch (type) {
            case 'paddle_hit':
                play('/assets/sfx_collision.mp3', 0.4);
                break;
            case 'brick_hit':
                play('/assets/sfx_collision.mp3', 0.3);
                break;
            case 'brick_crack':
                play('/assets/sfx_collision.mp3', 0.5);
                break;
            case 'explosion':
                play('/assets/sfx_collision.mp3', 0.8);
                this.triggerHaptic();
                break;
            case 'spirit_release':
                play('/assets/sfx_wow.mp3', 0.5);
                break;
            case 'spirit_hit':
                play('/assets/sfx_match_success.mp3', 0.6);
                break;
            case 'bonus':
                play('/assets/sfx_match_success.mp3', 0.7);
                break;
            case 'ball_lost':
                play('/assets/sfx_collision.mp3', 0.7);
                break;
            case 'win':
                this.playVictorySFX();
                break;
            case 'lose':
                play('/assets/sfx_collision.mp3', 0.8);
                break;
        }
    }

    public playPinballBGM() {
        // Pinball 使用相同的轻音乐背景，后续可替换为专属轨道
        this.playBGM('/assets/bgm_light1.mp3');
    }
}

export const audioManager = AudioManager.getInstance();
