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
    category: 'Minimal' | 'Portrait' | 'Landscape' | 'Modern';
}

export const CHAPTERS: Chapter[] = [
    { id: 1, title: 'Chapter 1: Minimal Art', description: 'Simple shapes and shadows.', icon: '/assets/images/chapters/icons/ch1.png', category: 'Minimal' },
    { id: 2, title: 'Chapter 2: Portrait Art', description: 'Focus on characters and faces.', icon: '/assets/images/chapters/icons/ch2.png', category: 'Portrait' },
    { id: 3, title: 'Chapter 3: Landscape Art', description: 'Vast environments to explore.', icon: '/assets/images/chapters/icons/ch3.png', category: 'Landscape' },
    { id: 4, title: 'Chapter 4: Modern Art', description: 'Complex and abstract aesthetics.', icon: '/assets/images/chapters/icons/ch4.png', category: 'Modern' },
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

    // Placeholder for other chapters (Chapter 3 & 4)
    ...Array.from({ length: 14 }, (_, i) => ({
        id: 17 + i,
        chapterId: i < 7 ? 3 : 4,
        title: `${i < 7 ? '3' : '4'}-${(i % 7) + 1}: Art Advance`,
        description: "Reserved for future beauty.",
        bgImage: '',
        timeLimit: 180,
        spirits: [{ type: 'butterfly' as SpiritType, count: 5 + i % 3, speed: 150 + i * 5 }],
        unlockThreshold: 0.85,
        perfectThreshold: 0.95
    }))
];
