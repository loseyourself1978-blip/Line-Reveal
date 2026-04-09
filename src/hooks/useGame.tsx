import { createContext, useContext, useState, type ReactNode, useCallback, useEffect, useRef } from 'react';
import { LEVELS, type LevelConfig, BG_IMAGE_POOL } from '../data/levels';
import { usePersistence, type SaveData } from './usePersistence';
import { audioManager } from '../game/AudioManager';

type GameStatus = 'welcome' | 'playing' | 'won' | 'lost' | 'all_passed';
type AppTab = 'home' | 'gallery' | 'my' | 'settings';

interface GameState {
    status: GameStatus;
    activeTab: AppTab;
    currentLevelId: number;
    currentLevel: LevelConfig;
    score: number;
    unlockedPercent: number;
    gameTime: number; // Elapsed time
    allLevelsPassed: boolean;
    playMode: 'classic' | 'jigsaw' | 'match3';

    // Persistence
    saveData: SaveData;
    unlockGalleryItem: (id: string) => void;
    spendFragments: (amount: number) => boolean;
    updateSettings: (settings: Partial<SaveData['settings']>) => void;
    setLevelStars: (levelId: number, stars: number) => void;
    updateStats: (stats: Partial<SaveData['stats']>) => void;
    unlockAchievement: (id: string) => void;
    toggleFavorite: (imagePath: string) => void;

    startGame: (levelId: number) => void;
    endGame: (won: boolean, percent: number, timeElapsed: number, perfectLife?: boolean) => void;
    resetGame: () => void;
    restartGame: () => void;
    setStatus: (status: GameStatus) => void;
    setActiveTab: (tab: AppTab) => void;
    setUnlockedPercent: (percent: number) => void;
    setPlayMode: (mode: 'classic' | 'jigsaw' | 'match3') => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<GameStatus>('welcome');
    const [activeTab, setActiveTab] = useState<AppTab>('home');
    const [currentLevelId, setCurrentLevelId] = useState(1);
    const [score] = useState(0);
    const [unlockedPercent, setUnlockedPercent] = useState(0);
    const [gameTime, setGameTime] = useState(0);
    const [playedBgImages, setPlayedBgImages] = useState<string[]>([]);
    const [allLevelsPassed, setAllLevelsPassed] = useState(false);
    const [playMode, setPlayMode] = useState<'classic' | 'jigsaw' | 'match3'>('classic');

    const [currentLevel, setCurrentLevel] = useState<LevelConfig>({
        ...LEVELS[0],
        bgImage: BG_IMAGE_POOL[0]
    });

    const { saveData, addFragments, unlockLevel, unlockGalleryItem, spendFragments, updateSettings, setLevelStars, updateStats, toggleFavorite, unlockAchievement, setPlayedBgImages: persistPlayedImages } = usePersistence();

    // Track if we've done the initial sync from persistence
    const initializedRef = useRef(false);
    const isFirstPersistRef = useRef(true);

    // Sync playedBgImages from persistence on mount (once only)
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            if (saveData.playedBgImages.length > 0) {
                setPlayedBgImages(saveData.playedBgImages);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist playedBgImages when they change (skip first render)
    useEffect(() => {
        if (isFirstPersistRef.current) {
            isFirstPersistRef.current = false;
            return;
        }
        persistPlayedImages(playedBgImages);
    }, [playedBgImages]); // eslint-disable-line react-hooks/exhaustive-deps

    // Streak and Daily Check logic
    useEffect(() => {
        const today = new Date().toDateString();
        const lastPlay = saveData.stats.lastPlayDate;

        if (lastPlay !== today) {
            let newStreak = saveData.stats.currentStreak || 0;

            if (lastPlay) {
                const lastDate = new Date(lastPlay);
                // Simple day difference
                const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            updateStats({
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, saveData.stats.longestStreak || 0),
                lastPlayDate: today
            });

            if (newStreak >= 3 && !saveData.achievements?.['streak_3']) {
                unlockAchievement('streak_3');
            }
        }
    }, []); // Run only once on mount

    const getAvailableBgImage = useCallback(() => {
        const available = BG_IMAGE_POOL.filter((img: string) => !playedBgImages.includes(img));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }, [playedBgImages]);

    const startGame = (levelId: number) => {
        if (!saveData.unlockedLevels.includes(levelId)) return;

        const nextBg = getAvailableBgImage();
        if (!nextBg) {
            setAllLevelsPassed(true);
            setStatus('all_passed');
            return;
        }

        const baseLevel = LEVELS.find(l => l.id === levelId) || LEVELS[0];
        const levelWithRandomBg: LevelConfig = {
            ...baseLevel,
            bgImage: nextBg
        };

        setPlayedBgImages(prev => [...prev, nextBg]);
        setCurrentLevel(levelWithRandomBg);
        setCurrentLevelId(levelId);
        setStatus('playing');
        setUnlockedPercent(0);
        setGameTime(0);

        // Start BGM
        audioManager.playClassicBGM();

        // Stats Update
        updateStats({
            totalPlays: (saveData.stats.totalPlays || 0) + 1
        });
    };

    const endGame = (won: boolean, percent: number, timeElapsed: number, perfectLife: boolean = false) => {
        setStatus(won ? 'won' : 'lost');
        setUnlockedPercent(percent);

        audioManager.stopBGM();

        if (won) {
            audioManager.playVictorySFX();
            audioManager.playWowVoice();

            // Calculate stars
            const targetTime = currentLevel.timeLimit;
            let stars = 1;
            if (percent >= 0.95) stars++;
            if (timeElapsed < targetTime * 0.5) stars++;

            setLevelStars(currentLevelId, stars);

            // Update Global Stats
            updateStats({
                totalAreaUnlocked: (saveData.stats.totalAreaUnlocked || 0) + percent,
                totalPlayTime: (saveData.stats.totalPlayTime || 0) + timeElapsed,
                perfectClears: (saveData.stats.perfectClears || 0) + (percent >= 0.95 ? 1 : 0)
            });

            // Reward Logic
            const fragmentsEarned = stars * 2;
            addFragments(fragmentsEarned);

            // Unlock Next Level
            const nextLevelId = currentLevelId + 1;
            const nextLevelExists = LEVELS.some(l => l.id === nextLevelId);

            if (nextLevelExists) {
                unlockLevel(nextLevelId);

                // Automatic start next chapter logic
                const currentChapterId = currentLevel.chapterId;
                const nextLevel = LEVELS.find(l => l.id === nextLevelId);
                if (nextLevel && nextLevel.chapterId !== currentChapterId) {
                    // It was a chapter finale, wait a bit then start next chapter automatically
                    setTimeout(() => {
                        startGame(nextLevelId);
                    }, 2000);
                }
            } else {
                // All levels and chapters passed
                setAllLevelsPassed(true);
                setStatus('all_passed');
            }

            // Achievements Unlocking logic
            const { achievements = {}, settings } = saveData;
            if (!achievements['first_blood']) unlockAchievement('first_blood');
            if (percent >= 0.95 && !achievements['perfect_clear']) unlockAchievement('perfect_clear');
            if (timeElapsed < 30 && !achievements['speed_demon']) unlockAchievement('speed_demon');
            if (settings.spiritSpeed === 3 && perfectLife && !achievements['untouchable']) unlockAchievement('untouchable');

            if (saveData.unlockedLevels.length >= 14 && !achievements['completionist']) unlockAchievement('completionist');
        }
    };

    const resetGame = () => {
        setStatus('welcome');
        setActiveTab('home');
        audioManager.stopBGM();
    }

    const restartGame = () => {
        // Full restart from Ch 1, Level 1
        setPlayedBgImages([]);
        setAllLevelsPassed(false);
        unlockLevel(1);
        startGame(1);
    }

    return (
        <GameContext.Provider value={{
            status,
            activeTab,
            currentLevelId,
            currentLevel,
            score,
            unlockedPercent,
            gameTime,
            allLevelsPassed,
            playMode,
            saveData,
            unlockGalleryItem,
            spendFragments,
            updateSettings,
            setLevelStars,
            updateStats,
            unlockAchievement,
            toggleFavorite,
            startGame,
            endGame,
            resetGame,
            restartGame,
            setStatus,
            setActiveTab,
            setUnlockedPercent,
            setPlayMode
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
