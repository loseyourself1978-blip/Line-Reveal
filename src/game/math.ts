export interface Point {
    x: number;
    y: number;
}

export function dist(p1: Point, p2: Point): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Distance from point P to line segment AB
export function pointToSegmentDist(p: Point, a: Point, b: Point): number {
    const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (l2 === 0) return dist(p, a);

    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projection = {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y)
    };

    return dist(p, projection);
}

// Check if a circle at 'c' with radius 'r' intersects segment 'ab'
export function circleSegmentIntersect(c: Point, r: number, a: Point, b: Point): boolean {
    return pointToSegmentDist(c, a, b) <= r;
}
