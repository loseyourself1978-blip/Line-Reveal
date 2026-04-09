import { useState, useEffect } from 'react';

const STORAGE_KEY = 'line_reveal_save_v1';

export interface SaveData {
    fragments: number;
    unlockedLevels: number[];
    unlockedGalleryItems: string[];
    levelStars: Record<number, number>; // levelId -> 1-3 stars
    settings: {
        audio: boolean;
        haptic: boolean;
        spiritSpeed: 1 | 2 | 3;
        fogDensity: 1 | 2 | 3;
        lineWeight: number;
        lineColor: string;
        match3Audio: boolean;
    };
    stats: {
        totalAreaUnlocked: number;
        totalPlayTime: number;
        perfectClears: number;
        totalPlays: number;
        totalStars: number;
        longestStreak: number;
        currentStreak: number;
        lastPlayDate: string;
        match3Wins: number;
        maxCombo: number;
        totalEliminations: number;
    };
    achievements: Record<string, boolean>;
    favoriteImages: string[];
    playedBgImages: string[];
}

const DEFAULT_SAVE: SaveData = {
    fragments: 0,
    unlockedLevels: [1],
    unlockedGalleryItems: [],
    levelStars: {},
    settings: {
        audio: true,
        haptic: true,
        spiritSpeed: 2,
        fogDensity: 2,
        lineWeight: 4,
        lineColor: '#facc15',
        match3Audio: true
    },
    stats: {
        totalAreaUnlocked: 0,
        totalPlayTime: 0,
        perfectClears: 0,
        totalPlays: 0,
        totalStars: 0,
        longestStreak: 0,
        currentStreak: 0,
        lastPlayDate: '',
        match3Wins: 0,
        maxCombo: 0,
        totalEliminations: 0
    },
    achievements: {},
    favoriteImages: [],
    playedBgImages: []
};

export function usePersistence() {
    const [data, setData] = useState<SaveData>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_SAVE;
        try {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_SAVE,
                ...parsed,
                settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
                stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
                achievements: { ...DEFAULT_SAVE.achievements, ...(parsed.achievements || {}) }
            };
        } catch (e) {
            return DEFAULT_SAVE;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const addFragments = (amount: number) => {
        setData(prev => ({ ...prev, fragments: prev.fragments + amount }));
    };

    const unlockLevel = (levelId: number) => {
        setData(prev => {
            if (prev.unlockedLevels.includes(levelId)) return prev;
            return { ...prev, unlockedLevels: [...prev.unlockedLevels, levelId] };
        });
    };

    const unlockGalleryItem = (itemId: string) => {
        setData(prev => {
            if (prev.unlockedGalleryItems.includes(itemId)) return prev;
            return { ...prev, unlockedGalleryItems: [...prev.unlockedGalleryItems, itemId] };
        });
    };

    const spendFragments = (amount: number): boolean => {
        if (data.fragments >= amount) {
            setData(prev => ({ ...prev, fragments: prev.fragments - amount }));
            return true;
        }
        return false;
    };

    const updateSettings = (settings: Partial<SaveData['settings']>) => {
        setData(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    };

    const setLevelStars = (levelId: number, stars: number) => {
        setData(prev => {
            const currentStars = prev.levelStars[levelId] || 0;
            if (stars <= currentStars) return prev;
            return {
                ...prev,
                levelStars: { ...prev.levelStars, [levelId]: stars }
            };
        });
    };

    const updateStats = (stats: Partial<SaveData['stats']>) => {
        setData(prev => ({ ...prev, stats: { ...prev.stats, ...stats } }));
    };

    const unlockAchievement = (id: string) => {
        setData(prev => {
            if (prev.achievements[id]) return prev;
            return { ...prev, achievements: { ...prev.achievements, [id]: true } };
        });
    };

    const toggleFavorite = (imagePath: string) => {
        setData(prev => {
            const isFav = prev.favoriteImages.includes(imagePath);
            return {
                ...prev,
                favoriteImages: isFav
                    ? prev.favoriteImages.filter(i => i !== imagePath)
                    : [...prev.favoriteImages, imagePath]
            };
        });
    };

    const setPlayedBgImages = (images: string[]) => {
        setData(prev => ({ ...prev, playedBgImages: images }));
    };

    return {
        saveData: data,
        addFragments,
        unlockLevel,
        unlockGalleryItem,
        spendFragments,
        updateSettings,
        setLevelStars,
        updateStats,
        unlockAchievement,
        toggleFavorite,
        setPlayedBgImages
    };
}
