import { dist } from './math';
import type { Point } from './math';

export type Polygon = Point[];

// Ray-casting algorithm to check if point is inside polygon
export function isPointInPolygon(p: Point, poly: Polygon): boolean {
    if (poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = ((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Shoelace formula for area
export function getPolygonArea(poly: Polygon): number {
    if (poly.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        area += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return Math.abs(area) / 2;
}

// Find closest point on polygon perimeter to a given point
export function getClosestPointOnPolygon(p: Point, poly: Polygon): { point: Point, segmentIndex: number, distance: number } {
    if (poly.length === 0) return { point: p, segmentIndex: 0, distance: 0 };
    let minDist = Infinity;
    let closestPt = poly[0];
    let segIdx = 0;

    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        let t = 0;
        if (l2 !== 0) {
            t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
        }
        const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        const d = dist(p, proj);
        if (d < minDist) {
            minDist = d;
            closestPt = proj;
            segIdx = i;
        }
    }
    return { point: closestPt, segmentIndex: segIdx, distance: minDist };
}

// Split polygon by a drawn path
// Key fixes (v1.3.0):
// - Bug#3: 即使 start/end 在同一 segment，也能正确分割（加周长判断）
// - Bug#4: 更精确的 spirit 位置检测（多点采样）
export function splitPolygon(
    poly: Polygon,
    start: { point: Point, segmentIndex: number },
    end: { point: Point, segmentIndex: number },
    path: Point[]
): [Polygon, Polygon] {
    if (poly.length < 3) return [[...path], []];

    // 构建干净路径（含 start 和 end）
    const cleanPath = [start.point, ...path, end.point];

    // 判断是同边（同一 segment）还是对边
    const sameSegment = start.segmentIndex === end.segmentIndex;
    const area1 = getPolygonArea(poly);

    if (sameSegment) {
        // ===== 同边情况：计算玩家走过的路径长度 vs 沿边走的距离 =====
        // 如果路径长度 > 沿边距离 * 1.5，说明玩家"绕进去了"，应该分割
        let pathLen = 0;
        for (let i = 0; i < cleanPath.length - 1; i++) {
            pathLen += dist(cleanPath[i], cleanPath[i + 1]);
        }

        // 计算 start→end 沿 polygon 边的距离
        let rimDist = 0;
        let curr = start.segmentIndex;
        const stop = (end.segmentIndex + 1) % poly.length;
        while (true) {
            const next = (curr + 1) % poly.length;
            rimDist += dist(poly[curr], poly[next]);
            if (next === stop) break;
            curr = next;
        }

        // 路径长度超过沿边距离的 1.3 倍 → 有效分割
        if (pathLen > rimDist * 1.3 && area1 > 100) {
            // 同边分割：路径区域为 P1（玩家走过的区域），保留区域为 P2
            // P1: start -> path -> end -> 沿边(反向) -> start
            const p1: Polygon = [start.point, ...path, end.point];
            curr = (end.segmentIndex + 1) % poly.length;
            const stop2 = (start.segmentIndex + 1) % poly.length;
            while (curr !== stop2) {
                p1.push(poly[curr]);
                curr = (curr + 1) % poly.length;
            }

            // P2: start -> 沿边(正向) -> end -> path(reversed) -> start
            const p2: Polygon = [start.point];
            curr = (start.segmentIndex + 1) % poly.length;
            const stop3 = (end.segmentIndex + 1) % poly.length;
            while (curr !== stop3) {
                p2.push(poly[curr]);
                curr = (curr + 1) % poly.length;
            }
            p2.push(end.point);
            const pathRev = [...cleanPath].reverse().slice(1, -1);
            p2.push(...pathRev);

            const a1 = getPolygonArea(p1);
            const a2 = getPolygonArea(p2);
            if (a1 > 0 && a2 > 0) return [p1, p2];
        }

        // 路径太短 → 不分割，返回原多边形（玩家没真正划出区域）
        return [poly, []];
    }

    // ===== 对边情况（正常分割）=====
    // Poly1: start -> path -> end -> 沿边(End→Start) -> start
    const p1: Polygon = [start.point, ...path, end.point];
    let curr = (end.segmentIndex + 1) % poly.length;
    const stop = (start.segmentIndex + 1) % poly.length;
    while (curr !== stop) {
        p1.push(poly[curr]);
        curr = (curr + 1) % poly.length;
    }

    // Poly2: start -> 沿边(Start→End) -> end -> path(reversed) -> start
    const p2: Polygon = [start.point];
    curr = (start.segmentIndex + 1) % poly.length;
    const stop2 = (end.segmentIndex + 1) % poly.length;
    while (curr !== stop2) {
        p2.push(poly[curr]);
        curr = (curr + 1) % poly.length;
    }
    p2.push(end.point);
    const pathRev = [...cleanPath].reverse().slice(1, -1);
    p2.push(...pathRev);

    const a1 = getPolygonArea(p1);
    const a2 = getPolygonArea(p2);
    if (a1 > 0 && a2 > 0) return [p1, p2];

    return [poly, []];
}
