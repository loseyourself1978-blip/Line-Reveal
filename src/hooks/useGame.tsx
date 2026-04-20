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
    gameTime: number;
    allLevelsPassed: boolean;
    playMode: 'classic' | 'jigsaw' | 'match3';
    engineLives: number;

    saveData: SaveData;
    unlockGalleryItem: (id: string) => void;
    spendFragments: (amount: number) => boolean;
    updateSettings: (settings: Partial<SaveData['settings']>) => void;
    setLevelStars: (levelId: number, stars: number) => void;
    updateStats: (stats: Partial<SaveData['stats']>) => void;
    unlockAchievement: (id: string) => void;
    toggleFavorite: (imagePath: string) => void;
    setEngineLives: (lives: number) => void;

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
    const [engineLives, setEngineLives] = useState<number>(5);

    const [currentLevel, setCurrentLevel] = useState<LevelConfig>({
        ...LEVELS[0],
        bgImage: BG_IMAGE_POOL[0]
    });

    const { saveData, addFragments, unlockLevel, unlockGalleryItem, spendFragments, updateSettings, setLevelStars, updateStats, toggleFavorite, unlockAchievement, setPlayedBgImages: persistPlayedImages } = usePersistence();

    const initializedRef = useRef(false);
    const isFirstPersistRef = useRef(true);

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            if (saveData.playedBgImages.length > 0) {
                setPlayedBgImages(saveData.playedBgImages);
            }
        }
    }, []);

    useEffect(() => {
        if (isFirstPersistRef.current) {
            isFirstPersistRef.current = false;
            return;
        }
        persistPlayedImages(playedBgImages);
    }, [playedBgImages]);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastPlay = saveData.stats.lastPlayDate;

        if (lastPlay !== today) {
            let newStreak = saveData.stats.currentStreak || 0;

            if (lastPlay) {
                const lastDate = new Date(lastPlay);
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
    }, []);

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
        setEngineLives(5);

        audioManager.playClassicBGM();

        updateStats({
            totalPlays: (saveData.stats.totalPlays || 0) + 1
        });
    };

    // v1.4.0: 胜利后等待用户点击再显示 ResultScreen
    const endGame = (won: boolean, percent: number, timeElapsed: number, perfectLife: boolean = false) => {
        setUnlockedPercent(percent);
        audioManager.stopBGM();

        if (won) {
            audioManager.playVictorySFX();
            audioManager.playWowVoice();

            // v1.4.0: 不立即 setStatus，等待动画完成和用户点击
            // 动画和用户点击由 GameCanvas 的 onWonClick 回调处理

            const targetTime = currentLevel.timeLimit;
            let stars = 1;
            if (percent >= 0.95) stars++;
            if (timeElapsed < targetTime * 0.5) stars++;

            setLevelStars(currentLevelId, stars);

            updateStats({
                totalAreaUnlocked: (saveData.stats.totalAreaUnlocked || 0) + percent,
                totalPlayTime: (saveData.stats.totalPlayTime || 0) + timeElapsed,
                perfectClears: (saveData.stats.perfectClears || 0) + (percent >= 0.95 ? 1 : 0)
            });

            const fragmentsEarned = stars * 2;
            addFragments(fragmentsEarned);

            const nextLevelId = currentLevelId + 1;
            const nextLevelExists = LEVELS.some(l => l.id === nextLevelId);

            if (nextLevelExists) {
                unlockLevel(nextLevelId);

                const currentChapterId = currentLevel.chapterId;
                const nextLevel = LEVELS.find(l => l.id === nextLevelId);
                if (nextLevel && nextLevel.chapterId !== currentChapterId) {
                    // 章节切换逻辑移到 onWonClick
                }
            } else {
                setAllLevelsPassed(true);
            }

            const { achievements = {}, settings } = saveData;
            if (!achievements['first_blood']) unlockAchievement('first_blood');
            if (percent >= 0.95 && !achievements['perfect_clear']) unlockAchievement('perfect_clear');
            if (timeElapsed < 30 && !achievements['speed_demon']) unlockAchievement('speed_demon');
            if (settings.spiritSpeed === 3 && perfectLife && !achievements['untouchable']) unlockAchievement('untouchable');

            if (saveData.unlockedLevels.length >= 14 && !achievements['completionist']) unlockAchievement('completionist');
        } else {
            setStatus('lost');
        }
    };


    const resetGame = () => {
        setStatus('welcome');
        setActiveTab('home');
        audioManager.stopBGM();
    }

    const restartGame = () => {
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
            engineLives,
            saveData,
            unlockGalleryItem,
            spendFragments,
            updateSettings,
            setLevelStars,
            updateStats,
            unlockAchievement,
            toggleFavorite,
            setEngineLives,
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
