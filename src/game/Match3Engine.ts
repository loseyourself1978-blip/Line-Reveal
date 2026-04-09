export type ItemType = number; // 1 to 16

export interface Match3Item {
    id: string;
    type: ItemType;
}

export interface LayerConfig {
    gridSize: { rows: number; cols: number };
}

export interface Match3Config {
    layers: LayerConfig[];
    itemTypesCount: number;
    steps: number;
    timeLimit?: number;
}

export const STAGES_CONFIG: Record<number, Match3Config> = {
    1: { layers: [{ gridSize: { rows: 4, cols: 3 } }], itemTypesCount: 3, steps: 30 },
    2: { layers: [{ gridSize: { rows: 8, cols: 6 } }], itemTypesCount: 5, steps: 50 },
    3: { layers: [{ gridSize: { rows: 12, cols: 6 } }], itemTypesCount: 8, steps: 80 },
    4: {
        layers: [
            { gridSize: { rows: 12, cols: 6 } }, // Layer 1
            { gridSize: { rows: 12, cols: 6 } }  // Layer 2
        ],
        itemTypesCount: 10,
        steps: 100
    },
    5: {
        layers: [
            { gridSize: { rows: 12, cols: 6 } }, // Layer 1
            { gridSize: { rows: 12, cols: 6 } }  // Layer 2
        ],
        itemTypesCount: 12,
        steps: 150
    },
    6: {
        layers: [
            { gridSize: { rows: 12, cols: 6 } }, // Layer 1
            { gridSize: { rows: 12, cols: 6 } }, // Layer 2
            { gridSize: { rows: 12, cols: 6 } }  // Layer 3
        ],
        itemTypesCount: 16,
        steps: 200
    }
};

export class Match3Engine {
    boards: (Match3Item | null)[][][] = [];
    currentLayerIndex: number = 0;
    rows: number = 0;
    cols: number = 0;
    config: Match3Config;

    constructor(config: Match3Config) {
        this.config = config;
        this.initLayers();
    }

    private initLayers() {
        this.boards = this.config.layers.map(layer => {
            const { rows, cols } = layer.gridSize;
            // Pad by 1 to create an empty border for pathfinding
            return Array.from({ length: rows + 2 }, () => Array(cols + 2).fill(null));
        });
        this.currentLayerIndex = 0;
        this.updateCurrentDimensions();
    }

    private updateCurrentDimensions() {
        const currentLayer = this.config.layers[this.currentLayerIndex];
        this.rows = currentLayer.gridSize.rows;
        this.cols = currentLayer.gridSize.cols;
    }

    get board() {
        return this.boards[this.currentLayerIndex];
    }

    get totalLayers() {
        return this.boards.length;
    }

    generateBoard(itemTypesCount: number) {
        this.boards.forEach((board, layerIdx) => {
            const layerConfig = this.config.layers[layerIdx];
            const rows = layerConfig.gridSize.rows;
            const cols = layerConfig.gridSize.cols;
            const totalCells = rows * cols;

            // Ensure we have an even number of cells for pairs
            const pairCount = Math.floor(totalCells / 2);
            const types: number[] = [];
            
            for (let i = 0; i < pairCount; i++) {
                const type = (i % itemTypesCount) + 1; // Cycle through types to ensure even distribution
                types.push(type, type);
            }

            // Shuffle types
            this.shuffleArray(types);

            let typeIdx = 0;
            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    if (typeIdx < types.length) {
                        board[r][c] = {
                            id: `L${layerIdx}-r${r}-c${c}-${Math.random().toString(36).substring(2, 7)}`,
                            type: types[typeIdx++]
                        };
                    } else {
                        board[r][c] = null;
                    }
                }
            }
        });

        // Guaranteed solvability check for each layer
        const originalIndex = this.currentLayerIndex;
        for (let i = 0; i < this.boards.length; i++) {
            this.currentLayerIndex = i;
            this.updateCurrentDimensions();
            let attempts = 0;
            while (!this.hasAvailableMoves() && attempts < 50) {
                this.shuffleBoard();
                attempts++;
            }
        }
        this.currentLayerIndex = originalIndex;
        this.updateCurrentDimensions();
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    canConnect(r1: number, c1: number, r2: number, c2: number): { r: number, c: number }[] | null {
        if (r1 === r2 && c1 === c2) return null;
        const item1 = this.board[r1][c1];
        const item2 = this.board[r2][c2];
        if (!item1 || !item2 || item1.type !== item2.type) return null;

        return this.findPath(r1, c1, r2, c2);
    }

    private findPath(r1: number, c1: number, r2: number, c2: number): { r: number, c: number }[] | null {
        // BFS for pathfinding with turn limit (<= 2 turns)
        const queue: { r: number, c: number, turns: number, dir: number, path: { r: number, c: number }[] }[] = [
            { r: r1, c: c1, turns: -1, dir: -1, path: [{ r: r1, c: c1 }] }
        ];

        const visited = new Map<string, number>();

        const dr = [-1, 1, 0, 0]; // N, S, W, E
        const dc = [0, 0, -1, 1];

        while (queue.length > 0) {
            const { r, c, turns, dir, path } = queue.shift()!;

            if (r === r2 && c === c2) return path;

            for (let i = 0; i < 4; i++) {
                const nr = r + dr[i];
                const nc = c + dc[i];

                // Bounds check
                if (nr < 0 || nr >= this.rows + 2 || nc < 0 || nc >= this.cols + 2) continue;

                // Turn count
                const newTurns = (dir !== -1 && dir !== i) ? turns + 1 : turns;
                if (newTurns > 2) continue;

                // Collision check (only target or empty)
                if (this.board[nr][nc] !== null && !(nr === r2 && nc === c2)) continue;

                const key = `${nr},${nc},${i}`;
                if (!visited.has(key) || visited.get(key)! > newTurns) {
                    visited.set(key, newTurns);
                    queue.push({
                        r: nr,
                        c: nc,
                        turns: newTurns === -1 ? 0 : newTurns,
                        dir: i,
                        path: [...path, { r: nr, c: nc }]
                    });
                }
            }
        }

        return null;
    }

    eliminatePair(r1: number, c1: number, r2: number, c2: number) {
        this.board[r1][c1] = null;
        this.board[r2][c2] = null;
    }

    isBoardClear(): boolean {
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== null) return false;
            }
        }
        return true;
    }

    hasNextLayer(): boolean {
        return this.currentLayerIndex < this.boards.length - 1;
    }

    nextLayer() {
        if (this.hasNextLayer()) {
            this.currentLayerIndex++;
            this.updateCurrentDimensions();
        }
    }

    hasAvailableMoves(): boolean {
        const items: { r: number, c: number, type: number }[] = [];
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                const item = this.board[r][c];
                if (item) items.push({ r, c, type: item.type });
            }
        }

        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                if (items[i].type === items[j].type) {
                    if (this.canConnect(items[i].r, items[i].c, items[j].r, items[j].c)) return true;
                }
            }
        }
        return false;
    }

    shuffleBoard() {
        const items: Match3Item[] = [];
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c]) items.push(this.board[r][c]!);
            }
        }

        this.shuffleArray(items);

        let idx = 0;
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c]) {
                    this.board[r][c] = items[idx++];
                }
            }
        }
    }
}
