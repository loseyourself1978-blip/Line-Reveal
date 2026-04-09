import { dist } from './math';
import type { Point } from './math';

export type Polygon = Point[];

// Ray-casting algorithm to check if point is inside polygon
export function isPointInPolygon(p: Point, poly: Polygon): boolean {
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
    let minDist = Infinity;
    let closestPt = poly[0];
    let segIdx = 0;

    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];

        // Project p onto segment p1-p2
        const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        let t = 0;
        if (l2 !== 0) {
            t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
        }

        const proj = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };

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
// Start: Point on boundary
// End: Point on boundary
// Path: Array of points (including start/end or close to them)
export function splitPolygon(
    poly: Polygon,
    start: { point: Point, segmentIndex: number },
    end: { point: Point, segmentIndex: number },
    path: Point[]
): [Polygon, Polygon] {
    // We need to inject the path into the polygon vertices.
    // There are two ways to traverse the polygon to close the loop.
    // Poly1: Start -> Path -> End -> (Traverse forward along Poly) -> Start
    // Poly2: Start -> Path -> End -> (Traverse backward along Poly) -> Start

    // 1. Construct path points (exclude start reference, include end reference?)
    // The 'path' argument comes from player movement.
    // It roughly goes Start -> ... -> End.
    // We should clean it up: Add strict Start and End points.

    const cleanPath = [start.point, ...path, end.point];

    // 2. Build Poly 1
    // Travservse poly indices from End.Index to Start.Index
    const p1: Polygon = [...cleanPath];

    // Sub-Perimeter 1: from End.idx+1 ... Start.idx
    let curr = (end.segmentIndex + 1) % poly.length;
    const stop = (start.segmentIndex + 1) % poly.length;

    while (curr !== stop) {
        p1.push(poly[curr]);
        curr = (curr + 1) % poly.length;
    }
    // Finally, we close back to start.point (which is the first point in p1)

    // 3. Build Poly 2
    // Traverse from Start -> End along the OTHER side of the polygon
    // Start -> ...path... -> End -> poly[end.idx] -> ... -> poly[start.idx+1]

    // Wait, let's look at it differently.
    // Two loops:
    // Loop A: Path + Perimeter(End -> Start)
    // Loop B: Path(Reversed) + Perimeter(Start -> End)



    // From Start (on segment start.idx), go to start.idx+1? No, we want the other way.
    // If Poly1 went End_Idx+1 ... Start_Idx+1
    // Poly2 should go Start_Idx+1 ... End_Idx+1 ? No.

    // Let's trace strict vertices.
    // Poly is v0, v1, v2...
    // Start is on segment i (v_i -> v_i+1)
    // End is on segment j (v_j -> v_j+1)

    // Path P goes Start -> End.

    // Region 1: Start -> P -> End -> v_{j+1} -> v_{j+2} ... -> v_i -> Start
    // Region 2: Start -> P -> End -> v_j -> v_{j-1} ... -> v_{i+1} -> Start
    // (Note: Region 2 usually traverses vertices in reverse, or we can just go forward:
    //  Start -> v_{i+1} -> ... -> v_j -> End -> P_reversed -> Start)

    // Let's implement Region 2 (Forward traversal along rim):
    // Start -> v_{i+1} ... v_j -> End -> P_reversed -> Start

    const p2_forward: Polygon = [start.point];

    curr = (start.segmentIndex + 1) % poly.length;
    const stop2 = (end.segmentIndex + 1) % poly.length;

    while (curr !== stop2) {
        p2_forward.push(poly[curr]);
        curr = (curr + 1) % poly.length;
    }
    p2_forward.push(end.point);

    // Add path reversed (excluding end and start as they are already added/will be closed)
    // cleanPath is S -> p1..pn -> E
    // reverse is E -> pn..p1 -> S
    // We already added E. We want pn..p1. Then S is close.

    const pathRev = cleanPath.slice().reverse(); // E, ..., S
    // Remove first (E) and last (S)
    const middleRev = pathRev.slice(1, pathRev.length - 1);

    p2_forward.push(...middleRev);

    // Return both
    return [p1, p2_forward];
}
