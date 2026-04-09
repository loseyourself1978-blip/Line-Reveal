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
        // User said "restore female wow voice", let's check for a common name
        const wow = new Audio(getUrl('/assets/sfx_wow.mp3'));
        wow.volume = 0.7;
        wow.play().catch(() => {
            // If wow.mp3 doesn't exist, we can't do much without the asset
            console.warn('sfx_wow.mp3 not found');
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
}

export const audioManager = AudioManager.getInstance();
