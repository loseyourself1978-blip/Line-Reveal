import { describe, it, expect } from 'vitest';
import { Match3Engine, STAGES_CONFIG } from '../Match3Engine';

describe('Match3Engine', () => {
    it('should generate a valid board for all stages', () => {
        Object.keys(STAGES_CONFIG).forEach(stageId => {
            const config = STAGES_CONFIG[Number(stageId)];
            const engine = new Match3Engine(config);
            engine.generateBoard(config.itemTypesCount);

            // Check board dimensions for current layer
            expect(engine.board.length).toBe(engine.rows + 2);
            expect(engine.board[0].length).toBe(engine.cols + 2);

            // Check cell count and pairs
            const itemCounts = new Map();
            let totalItems = 0;
            for (let r = 1; r <= engine.rows; r++) {
                for (let c = 1; c <= engine.cols; c++) {
                    const item = engine.board[r][c];
                    if (item) {
                        totalItems++;
                        itemCounts.set(item.type, (itemCounts.get(item.type) || 0) + 1);
                    }
                }
            }

            // In our current engine, even for even grids, we ensure perfect pairs.
            // If the grid were odd, one cell would be null.
            expect(totalItems % 2).toBe(0); 
            
            // Every item type should have an even count (pairs)
            itemCounts.forEach(count => {
                expect(count % 2).toBe(0);
            });
        });
    });

    it('should handle multiple layers', () => {
        const config = {
            layers: [
                { gridSize: { rows: 2, cols: 2 } },
                { gridSize: { rows: 2, cols: 2 } }
            ],
            itemTypesCount: 1,
            steps: 10
        };
        const engine = new Match3Engine(config);
        engine.generateBoard(1);

        expect(engine.totalLayers).toBe(2);
        expect(engine.currentLayerIndex).toBe(0);

        // Clear first layer
        engine.board[1][1] = null;
        engine.board[1][2] = null;
        engine.board[2][1] = null;
        engine.board[2][2] = null;

        expect(engine.isBoardClear()).toBe(true);
        expect(engine.hasNextLayer()).toBe(true);

        engine.nextLayer();
        expect(engine.currentLayerIndex).toBe(1);
        expect(engine.isBoardClear()).toBe(false);
    });

    it('should handle odd grid sizes by leaving one cell empty', () => {
        const config = {
            layers: [{ gridSize: { rows: 3, cols: 3 } }], // 9 cells
            itemTypesCount: 2,
            steps: 20
        };
        const engine = new Match3Engine(config);
        engine.generateBoard(2);

        let totalItems = 0;
        const counts = new Map();
        for (let r = 1; r <= engine.rows; r++) {
            for (let c = 1; c <= engine.cols; c++) {
                const item = engine.board[r][c];
                if (item) {
                    totalItems++;
                    counts.set(item.type, (counts.get(item.type) || 0) + 1);
                }
            }
        }
        // 9 cells -> 4 pairs = 8 items total, 1 null
        expect(totalItems).toBe(8);
        
        counts.forEach(count => {
            expect(count % 2).toBe(0); // All items must be in pairs
        });
    });

    it('should guarantee solvability upon generation', () => {
        // Create a configuration that might be hard to solve
        const config = {
            layers: [{ gridSize: { rows: 8, cols: 6 } }],
            itemTypesCount: 15, // Many types makes matching harder
            steps: 50
        };
        const engine = new Match3Engine(config);
        engine.generateBoard(15);
        
        expect(engine.hasAvailableMoves()).toBe(true);
    });
});
