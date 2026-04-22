import type { SpiritType } from '../game/entities';

export interface LevelConfig {
    id: number;
    chapterId: number;
    title: string;
    description: string;
    bgImage: string;
    timeLimit: number; // seconds
    spirits: {
        type: SpiritType;
        count: number;
        speed?: number;
    }[];
    unlockThreshold: number; // 0.7 for 70%
    perfectThreshold: number; // 0.9 for 90%
}

export interface Chapter {
    id: number;
    title: string;
    description: string;
    icon: string;
    category: 'Minimal' | 'Portrait' | 'Landscape' | 'Modern' | 'Challenge' | 'Endless';
}

export const CHAPTERS: Chapter[] = [
    { id: 1, title: 'Chapter 1: Minimal Art', description: 'Simple shapes and shadows. Perfect for beginners.', icon: '/assets/images/chapters/icons/ch1.png', category: 'Minimal' },
    { id: 2, title: 'Chapter 2: Portrait Art', description: 'Focus on characters and faces. Intermediate challenge.', icon: '/assets/images/chapters/icons/ch2.png', category: 'Portrait' },
    { id: 3, title: 'Chapter 3: Landscape Art', description: 'Vast environments to explore. Advanced terrain.', icon: '/assets/images/chapters/icons/ch3.png', category: 'Landscape' },
    { id: 4, title: 'Chapter 4: Modern Art', description: 'Complex and abstract aesthetics. Expert only.', icon: '/assets/images/chapters/icons/ch4.png', category: 'Modern' },
    { id: 5, title: 'Chapter 5: Challenge Mode', description: 'Speed and precision. Master challenges.', icon: '/assets/images/chapters/icons/ch5.png', category: 'Challenge' },
    { id: 6, title: 'Chapter 6: Endless Mode', description: 'The ultimate test. How far can you go?', icon: '/assets/images/chapters/icons/ch6.png', category: 'Endless' },
];

// Pool of all available background images
export const BG_IMAGE_POOL = [
    '/assets/手机小游戏借鉴与设计.png',
    '/assets/手机小游戏借鉴与设计_副本.png',
    '/assets/手机小游戏借鉴与设计 (1).png',
    '/assets/手机小游戏借鉴与设计 (1)_副本.png',
    '/assets/手机小游戏借鉴与设计 (2).png',
    '/assets/手机小游戏借鉴与设计 (2)_副本.png',
    ...Array.from({ length: 54 }, (_, i) => `/assets/手机小游戏借鉴与设计 (${i + 3}).png`)
];

export const ALL_BGM_TRACKS = [
    '/assets/bgm_light.mp3',
    '/assets/bgm_light1.mp3'
];

export const SFX_CONFIG = {
    draw: '/assets/sfx_draw.mp3',
    collision: '/assets/sfx_collision.mp3',
    victory: '/assets/sfx_victory.mp3'
};

// Helper to get a random image from the pool
export function getRandomBgImage(): string {
    return BG_IMAGE_POOL[Math.floor(Math.random() * BG_IMAGE_POOL.length)];
}

// Export the pool for WelcomeScreen
export const ALL_BG_IMAGES = BG_IMAGE_POOL;

// Base levels (bgImage will be randomized at runtime)
export const LEVELS: LevelConfig[] = [
    // CHAPTER 1: Levels 1-8
    { id: 1, chapterId: 1, title: "1-1: Shadow Start", description: "The beginning of beauty.", bgImage: '', timeLimit: 60, spirits: [{ type: 'butterfly', count: 2, speed: 120 }], unlockThreshold: 0.7, perfectThreshold: 0.9 },
    { id: 2, chapterId: 1, title: "1-2: Twin Spirits", description: "Dodge the duo.", bgImage: '', timeLimit: 60, spirits: [{ type: 'butterfly', count: 3, speed: 130 }], unlockThreshold: 0.7, perfectThreshold: 0.9 },
    { id: 3, chapterId: 1, title: "1-3: Scorpion Sting", description: "Stay away from tails.", bgImage: '', timeLimit: 90, spirits: [{ type: 'scorpion', count: 2, speed: 150 }], unlockThreshold: 0.7, perfectThreshold: 0.9 },
    { id: 4, chapterId: 1, title: "1-4: The Web", description: "Spiders are slow but many.", bgImage: '', timeLimit: 90, spirits: [{ type: 'spider', count: 4, speed: 110 }], unlockThreshold: 0.7, perfectThreshold: 0.9 },
    { id: 5, chapterId: 1, title: "1-5: Mixed Omens", description: "Butterflies and Scorpions.", bgImage: '', timeLimit: 120, spirits: [{ type: 'butterfly', count: 2, speed: 140 }, { type: 'scorpion', count: 1, speed: 160 }], unlockThreshold: 0.75, perfectThreshold: 0.92 },
    { id: 6, chapterId: 1, title: "1-6: Fast Flash", description: "High speed butterflies.", bgImage: '', timeLimit: 120, spirits: [{ type: 'butterfly', count: 4, speed: 180 }], unlockThreshold: 0.75, perfectThreshold: 0.92 },
    { id: 7, chapterId: 1, title: "1-7: Guardian Spirit", description: "Watch the big one.", bgImage: '', timeLimit: 150, spirits: [{ type: 'scorpion', count: 3, speed: 170 }], unlockThreshold: 0.8, perfectThreshold: 0.94 },
    { id: 8, chapterId: 1, title: "1-8: Chapter Finale", description: "End of the minimal era.", bgImage: '', timeLimit: 180, spirits: [{ type: 'spider', count: 3, speed: 140 }, { type: 'scorpion', count: 2, speed: 180 }], unlockThreshold: 0.85, perfectThreshold: 0.95 },

    // CHAPTER 2: Levels 9-16
    { id: 9, chapterId: 2, title: "2-1: Portrait Reveal", description: "Focus on the gaze.", bgImage: '', timeLimit: 100, spirits: [{ type: 'butterfly', count: 4, speed: 150 }], unlockThreshold: 0.8, perfectThreshold: 0.92 },
    { id: 10, chapterId: 2, title: "2-2: Silent Watcher", description: "Spiders in the corners.", bgImage: '', timeLimit: 100, spirits: [{ type: 'spider', count: 6, speed: 120 }], unlockThreshold: 0.8, perfectThreshold: 0.92 },
    { id: 11, chapterId: 2, title: "2-3: Red Stingers", description: "Scorpions are angry.", bgImage: '', timeLimit: 120, spirits: [{ type: 'scorpion', count: 4, speed: 190 }], unlockThreshold: 0.8, perfectThreshold: 0.92 },
    { id: 12, chapterId: 2, title: "2-4: Chaotic Dance", description: "Spirits everywhere.", bgImage: '', timeLimit: 150, spirits: [{ type: 'butterfly', count: 6, speed: 170 }], unlockThreshold: 0.82, perfectThreshold: 0.93 },
    { id: 13, chapterId: 2, title: "2-5: Web of Grace", description: "Delicate movement needed.", bgImage: '', timeLimit: 150, spirits: [{ type: 'spider', count: 5, speed: 150 }, { type: 'scorpion', count: 1, speed: 200 }], unlockThreshold: 0.82, perfectThreshold: 0.93 },
    { id: 14, chapterId: 2, title: "2-6: Fast and Sharp", description: "Quick turns only.", bgImage: '', timeLimit: 180, spirits: [{ type: 'scorpion', count: 3, speed: 220 }], unlockThreshold: 0.85, perfectThreshold: 0.95 },
    { id: 15, chapterId: 2, title: "2-7: Swarm Attack", description: "8 butterflies at once.", bgImage: '', timeLimit: 200, spirits: [{ type: 'butterfly', count: 8, speed: 140 }], unlockThreshold: 0.88, perfectThreshold: 0.96 },
    { id: 16, chapterId: 2, title: "2-8: Master Class", description: "The ultimate selection.", bgImage: '', timeLimit: 240, spirits: [{ type: 'spider', count: 4, speed: 180 }, { type: 'scorpion', count: 3, speed: 210 }, { type: 'butterfly', count: 2, speed: 190 }], unlockThreshold: 0.9, perfectThreshold: 0.97 },

    // CHAPTER 3: Landscape Art (Levels 17-23)
    { id: 17, chapterId: 3, title: "3-1: Mountain Path", description: "Navigate through the peaks.", bgImage: '', timeLimit: 120, spirits: [{ type: 'butterfly', count: 5, speed: 160 }], unlockThreshold: 0.82, perfectThreshold: 0.94 },
    { id: 18, chapterId: 3, title: "3-2: Forest Edge", description: "Spiders guard the woods.", bgImage: '', timeLimit: 120, spirits: [{ type: 'spider', count: 7, speed: 130 }], unlockThreshold: 0.82, perfectThreshold: 0.94 },
    { id: 19, chapterId: 3, title: "3-3: Desert Storm", description: "Scorpions rule the dunes.", bgImage: '', timeLimit: 150, spirits: [{ type: 'scorpion', count: 5, speed: 200 }], unlockThreshold: 0.84, perfectThreshold: 0.95 },
    { id: 20, chapterId: 3, title: "3-4: Ocean Waves", description: "Butterflies in the breeze.", bgImage: '', timeLimit: 150, spirits: [{ type: 'butterfly', count: 7, speed: 180 }, { type: 'spider', count: 2, speed: 140 }], unlockThreshold: 0.85, perfectThreshold: 0.95 },
    { id: 21, chapterId: 3, title: "3-5: Sunset Valley", description: "A peaceful yet challenging scene.", bgImage: '', timeLimit: 180, spirits: [{ type: 'scorpion', count: 4, speed: 210 }, { type: 'butterfly', count: 3, speed: 170 }], unlockThreshold: 0.87, perfectThreshold: 0.96 },
    { id: 22, chapterId: 3, title: "3-6: Storm Approaching", description: "Chaos in the wilderness.", bgImage: '', timeLimit: 200, spirits: [{ type: 'spider', count: 6, speed: 160 }, { type: 'scorpion', count: 3, speed: 220 }], unlockThreshold: 0.88, perfectThreshold: 0.96 },
    { id: 23, chapterId: 3, title: "3-7: Landscape Master", description: "The ultimate nature challenge.", bgImage: '', timeLimit: 240, spirits: [{ type: 'butterfly', count: 5, speed: 190 }, { type: 'spider', count: 4, speed: 170 }, { type: 'scorpion', count: 3, speed: 230 }], unlockThreshold: 0.9, perfectThreshold: 0.97 },

    // CHAPTER 4: Modern Art (Levels 24-30)
    { id: 24, chapterId: 4, title: "4-1: Abstract Beginnings", description: "Simple shapes, complex logic.", bgImage: '', timeLimit: 150, spirits: [{ type: 'butterfly', count: 6, speed: 170 }], unlockThreshold: 0.85, perfectThreshold: 0.95 },
    { id: 25, chapterId: 4, title: "4-2: Geometric Chaos", description: "Patterns everywhere.", bgImage: '', timeLimit: 150, spirits: [{ type: 'spider', count: 8, speed: 150 }], unlockThreshold: 0.86, perfectThreshold: 0.95 },
    { id: 26, chapterId: 4, title: "4-3: Neon Nights", description: "Fast scorpions in the city.", bgImage: '', timeLimit: 180, spirits: [{ type: 'scorpion', count: 6, speed: 240 }], unlockThreshold: 0.87, perfectThreshold: 0.96 },
    { id: 27, chapterId: 4, title: "4-4: Digital Dreams", description: "A mix of worlds.", bgImage: '', timeLimit: 180, spirits: [{ type: 'butterfly', count: 8, speed: 200 }, { type: 'spider', count: 4, speed: 160 }], unlockThreshold: 0.88, perfectThreshold: 0.96 },
    { id: 28, chapterId: 4, title: "4-5: Color Splash", description: "Vibrant and intense.", bgImage: '', timeLimit: 200, spirits: [{ type: 'scorpion', count: 5, speed: 250 }, { type: 'butterfly', count: 6, speed: 190 }], unlockThreshold: 0.9, perfectThreshold: 0.97 },
    { id: 29, chapterId: 4, title: "4-6: Modern Masterpiece", description: "The art of precision.", bgImage: '', timeLimit: 240, spirits: [{ type: 'spider', count: 6, speed: 180 }, { type: 'scorpion', count: 4, speed: 260 }, { type: 'butterfly', count: 4, speed: 210 }], unlockThreshold: 0.92, perfectThreshold: 0.98 },
    { id: 30, chapterId: 4, title: "4-7: Ultimate Art", description: "The final challenge.", bgImage: '', timeLimit: 300, spirits: [{ type: 'butterfly', count: 8, speed: 220 }, { type: 'spider', count: 6, speed: 190 }, { type: 'scorpion', count: 5, speed: 270 }], unlockThreshold: 0.95, perfectThreshold: 0.99 },

    // CHAPTER 5: Challenge Mode (Levels 31-35)
    { id: 31, chapterId: 5, title: "5-1: Speed Trial", description: "Fast spirits, steady hands.", bgImage: '', timeLimit: 60, spirits: [{ type: 'butterfly', count: 10, speed: 280 }], unlockThreshold: 0.88, perfectThreshold: 0.96 },
    { id: 32, chapterId: 5, title: "5-2: Web Masters", description: "Spiders everywhere.", bgImage: '', timeLimit: 90, spirits: [{ type: 'spider', count: 12, speed: 200 }], unlockThreshold: 0.90, perfectThreshold: 0.97 },
    { id: 33, chapterId: 5, title: "5-3: Deadly Dance", description: "Scorpion swarm.", bgImage: '', timeLimit: 120, spirits: [{ type: 'scorpion', count: 10, speed: 300 }], unlockThreshold: 0.92, perfectThreshold: 0.98 },
    { id: 34, chapterId: 5, title: "5-4: Chaos Theory", description: "All spirits united.", bgImage: '', timeLimit: 150, spirits: [{ type: 'butterfly', count: 6, speed: 240 }, { type: 'spider', count: 6, speed: 200 }, { type: 'scorpion', count: 6, speed: 280 }], unlockThreshold: 0.94, perfectThreshold: 0.98 },
    { id: 35, chapterId: 5, title: "5-5: True Master", description: "The ultimate test.", bgImage: '', timeLimit: 180, spirits: [{ type: 'butterfly', count: 8, speed: 260 }, { type: 'spider', count: 8, speed: 220 }, { type: 'scorpion', count: 8, speed: 320 }], unlockThreshold: 0.96, perfectThreshold: 0.99 },

    // CHAPTER 6: Endless Mode (Levels 36-40)
    { id: 36, chapterId: 6, title: "6-1: Endless Beginnings", description: "How far can you go?", bgImage: '', timeLimit: 200, spirits: [{ type: 'butterfly', count: 10, speed: 280 }], unlockThreshold: 0.90, perfectThreshold: 0.97 },
    { id: 37, chapterId: 6, title: "6-2: Web of Doom", description: "Spiders never rest.", bgImage: '', timeLimit: 200, spirits: [{ type: 'spider', count: 14, speed: 240 }], unlockThreshold: 0.92, perfectThreshold: 0.98 },
    { id: 38, chapterId: 6, title: "6-3: Scorpion Storm", description: "Speed is key.", bgImage: '', timeLimit: 200, spirits: [{ type: 'scorpion', count: 12, speed: 340 }], unlockThreshold: 0.94, perfectThreshold: 0.98 },
    { id: 39, chapterId: 6, title: "6-4: Perfect Storm", description: "Everything at once.", bgImage: '', timeLimit: 240, spirits: [{ type: 'butterfly', count: 8, speed: 280 }, { type: 'spider', count: 8, speed: 240 }, { type: 'scorpion', count: 8, speed: 340 }], unlockThreshold: 0.96, perfectThreshold: 0.99 },
    { id: 40, chapterId: 6, title: "6-5: Legend", description: "You are the legend.", bgImage: '', timeLimit: 300, spirits: [{ type: 'butterfly', count: 10, speed: 300 }, { type: 'spider', count: 10, speed: 260 }, { type: 'scorpion', count: 10, speed: 360 }], unlockThreshold: 0.98, perfectThreshold: 1.0 }
];
