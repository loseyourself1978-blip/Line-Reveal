export interface GalleryItem {
    id: string;
    title: string;
    src: string;
    requiredFragments: number;
    isUnlocked: boolean; // Runtime state, derived from persistence
}

export const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: 'img_001',
        title: 'Cyberpunk Girl',
        src: '/assets/手机小游戏借鉴与设计 (1).png',
        requiredFragments: 2,
        isUnlocked: false
    },
    {
        id: 'img_002',
        title: 'Fantasy Forest',
        src: '/assets/手机小游戏借鉴与设计 (2).png',
        requiredFragments: 5,
        isUnlocked: false
    },
    {
        id: 'img_003',
        title: 'Magical Evening',
        src: '/assets/手机小游戏借鉴与设计 (3).png',
        requiredFragments: 10,
        isUnlocked: false
    }
];
