import { useGame } from '../hooks/useGame';

/**
 * 命数显示组件（v1.3.1 精简版，无冷却机制）
 *
 * PRD 规格：
 * - 命数 ≤ 5：显示 5 个 SVG 红桃心（实心=有命，空心=无命）
 * - 命数 > 5 且 ≤ 10：5 个实心红桃心 + ×{count}
 * - 命数 > 10：❤️ ×数字
 *
 * 位置：屏幕右上角，由 HUD 绝对定位注入（top-12 right-4）
 * v1.3.1 Bugfix: 添加 z-50 确保命心在 Canvas 之上
 * 不包含：冷却倒计时
 */
export function LivesDisplay() {
    const { engineLives } = useGame();
    const count = engineLives ?? 5; // 默认5命

    if (count > 10) {
        return (
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full z-50 relative">
                <span className="text-sm">❤️</span>
                <span className="text-xs font-bold text-red-400">×{count}</span>
            </div>
        );
    }

    if (count > 5) {
        return (
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full z-50 relative">
                {[1, 2, 3, 4, 5].map(i => (
                    <HeartIcon key={i} filled />
                ))}
                <span className="text-xs font-bold text-red-400 ml-0.5">×{count}</span>
            </div>
        );
    }

    // ≤ 5：实心/空心桃心
    return (
        <div className="flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-full z-50 relative">
            {[1, 2, 3, 4, 5].map(i => (
                <HeartIcon key={i} filled={i <= count} />
            ))}
        </div>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}
