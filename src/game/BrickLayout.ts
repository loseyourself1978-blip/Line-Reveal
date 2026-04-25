/**
 * BrickLayout.ts — v1.5.0
 * 
 * 基于背景图主体轮廓生成砖块布局（Pinball Reveal 专用）
 * 
 * 决策记录（2026-04-25）：
 * - Q3: Shield 从第6关开始出现
 * - Q5: 下采样分辨率 20×30（细节更丰富）
 */

export type BrickType = 'standard' | 'tough' | 'spirit_guard' | 'explosive' | 'shield' | 'bonus' | 'empty';

export interface BrickDef {
    id: string;
    gridX: number;
    gridY: number;
    type: BrickType;
    hp: number;          // standard=1, tough=2-3, shield=Infinity
    revealed: boolean;   // 已消除 → true
    spiritReleased: boolean; // spirit_guard 已释放精灵
}

export interface BrickLayoutConfig {
    levelId: number;
    gridW?: number;   // 默认 20
    gridH?: number;   // 默认 30
    spiritGuardRatio: number;   // 0~0.3
    shieldEnabled: boolean;     // Q3: levelId >= 6
    toughEnabled: boolean;      // levelId >= 6
    explosiveRatio: number;     // 0.05~0.15
    bonusRatio: number;         // 0.03~0.08
}

/** Sobel 边缘检测（从 engine.ts 提取的独立函数） */
function applySobel(data: Uint8ClampedArray, width: number, height: number): Float32Array {
    const magnitude = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            // 灰度化
            const gray = (px: number, py: number) => {
                const i = (py * width + px) * 4;
                return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            };
            const gx =
                -gray(x - 1, y - 1) + gray(x + 1, y - 1) +
                -2 * gray(x - 1, y) + 2 * gray(x + 1, y) +
                -gray(x - 1, y + 1) + gray(x + 1, y + 1);
            const gy =
                -gray(x - 1, y - 1) - 2 * gray(x, y - 1) - gray(x + 1, y - 1) +
                gray(x - 1, y + 1) + 2 * gray(x, y + 1) + gray(x + 1, y + 1);
            magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
        }
    }
    return magnitude;
}

/**
 * 主函数：根据背景图 ImageData 生成砖块布局
 * 
 * @param imageData  背景图的 ImageData（从 offscreen canvas 获取）
 * @param config     关卡配置
 */
export function generateBrickLayout(
    imageData: ImageData,
    config: BrickLayoutConfig
): BrickDef[] {
    const { levelId } = config;
    const gridW = config.gridW ?? 20;
    const gridH = config.gridH ?? 30;

    // 1. 下采样至 gridW×gridH
    const offscreen = document.createElement('canvas');
    offscreen.width = gridW;
    offscreen.height = gridH;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true })!;

    // 将 imageData 绘制到临时 canvas 再缩放
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    ctx.drawImage(srcCanvas, 0, 0, gridW, gridH);
    const smallData = ctx.getImageData(0, 0, gridW, gridH);

    // 2. Sobel 边缘检测
    const edgeMag = applySobel(smallData.data, gridW, gridH);

    // 3. 计算亮度均值，判断每格是否属于"主体区域"
    const brightness = new Float32Array(gridW * gridH);
    for (let i = 0; i < gridW * gridH; i++) {
        const r = smallData.data[i * 4];
        const g = smallData.data[i * 4 + 1];
        const b = smallData.data[i * 4 + 2];
        brightness[i] = (r + g + b) / 3;
    }
    const avgBrightness = brightness.reduce((s, v) => s + v, 0) / brightness.length;

    // 边缘强度归一化
    let maxEdge = 0;
    for (let i = 0; i < edgeMag.length; i++) {
        if (edgeMag[i] > maxEdge) maxEdge = edgeMag[i];
    }
    const edgeThresh = maxEdge * 0.18; // 阈值：18% 的最大边缘强度

    // "主体区域"判断：边缘强度高 OR 亮度与均值差异大（有内容的区域）
    const isContent = new Uint8Array(gridW * gridH);
    for (let i = 0; i < gridW * gridH; i++) {
        const isEdge = edgeMag[i] > edgeThresh;
        const isBrightArea = brightness[i] > avgBrightness * 0.4;
        isContent[i] = (isEdge || isBrightArea) ? 1 : 0;
    }

    // 4. 扩张：让轮廓内部也被覆盖（简单填充：洪泛不处理，改用滑动窗口扩张）
    const expanded = new Uint8Array(isContent);
    const kernelR = 2;
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            if (isContent[y * gridW + x]) continue;
            // 检查邻近是否有 content
            outer: for (let dy = -kernelR; dy <= kernelR; dy++) {
                for (let dx = -kernelR; dx <= kernelR; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                        if (isContent[ny * gridW + nx]) {
                            expanded[y * gridW + x] = 1;
                            break outer;
                        }
                    }
                }
            }
        }
    }

    // 5. 随机数生成器（基于关卡 ID 的伪随机，保证同关卡布局一致）
    let seed = levelId * 2654435769;
    const rand = () => {
        seed = (seed ^ (seed << 13)) >>> 0;
        seed = (seed ^ (seed >> 7)) >>> 0;
        seed = (seed ^ (seed << 17)) >>> 0;
        return (seed >>> 0) / 0xFFFFFFFF;
    };

    // 6. 收集内容格子，分配砖块类型
    const contentCells: number[] = [];
    const shieldCells: number[] = [];
    for (let i = 0; i < gridW * gridH; i++) {
        if (expanded[i]) {
            contentCells.push(i);
        } else if (config.shieldEnabled && rand() < 0.3) {
            // 非内容区 30% 概率放 Shield（仅6关以上）
            shieldCells.push(i);
        }
    }

    const totalContent = contentCells.length;
    const bricks: BrickDef[] = [];
    let idCounter = 0;

    // 打乱 contentCells
    for (let i = contentCells.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [contentCells[i], contentCells[j]] = [contentCells[j], contentCells[i]];
    }

    // 计算各类型数量
    const spiritGuardCount = config.spiritGuardRatio > 0
        ? Math.floor(totalContent * config.spiritGuardRatio)
        : 0;
    const explosiveCount = Math.floor(totalContent * config.explosiveRatio);
    const bonusCount = Math.floor(totalContent * config.bonusRatio);
    const toughCount = config.toughEnabled ? Math.floor(totalContent * 0.15) : 0;

    // 分配索引
    let idx = 0;
    const spiritSet = new Set(contentCells.slice(idx, idx + spiritGuardCount));
    idx += spiritGuardCount;
    const explosiveSet = new Set(contentCells.slice(idx, idx + explosiveCount));
    idx += explosiveCount;
    const bonusSet = new Set(contentCells.slice(idx, idx + bonusCount));
    idx += bonusCount;
    const toughSet = new Set(contentCells.slice(idx, idx + toughCount));

    // 生成内容砖块
    for (const cellIdx of contentCells) {
        const gridX = cellIdx % gridW;
        const gridY = Math.floor(cellIdx / gridW);
        let type: BrickType;
        let hp = 1;

        if (spiritSet.has(cellIdx)) {
            type = 'spirit_guard';
        } else if (explosiveSet.has(cellIdx)) {
            type = 'explosive';
        } else if (bonusSet.has(cellIdx)) {
            type = 'bonus';
        } else if (toughSet.has(cellIdx)) {
            type = 'tough';
            hp = levelId >= 16 ? 3 : 2;
        } else {
            type = 'standard';
        }

        bricks.push({
            id: `brick_${idCounter++}`,
            gridX,
            gridY,
            type,
            hp,
            revealed: false,
            spiritReleased: false,
        });
    }

    // 生成 Shield 砖块（仅 levelId >= 6）
    if (config.shieldEnabled) {
        for (const cellIdx of shieldCells) {
            const gridX = cellIdx % gridW;
            const gridY = Math.floor(cellIdx / gridW);
            bricks.push({
                id: `brick_${idCounter++}`,
                gridX,
                gridY,
                type: 'shield',
                hp: Infinity,
                revealed: false,
                spiritReleased: false,
            });
        }
    }

    return bricks;
}

/** 计算砖块已解锁百分比（消除的非 shield 砖块 / 全部非 shield 砖块） */
export function calcRevealedPercent(bricks: BrickDef[]): number {
    const valid = bricks.filter(b => b.type !== 'shield' && b.type !== 'empty');
    if (valid.length === 0) return 0;
    const revealed = valid.filter(b => b.revealed).length;
    return revealed / valid.length;
}
