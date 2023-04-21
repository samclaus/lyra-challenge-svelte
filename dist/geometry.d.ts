/**
 * Point is a simple [x, y] tuple.
 */
export type Point = [number, number];
/**
 * Polygon is a collection of points, in clockwise or counter-clockwise order.
 */
export type Polygon = Point[];
/**
 * Creates a deep copy of the given point.
 */
export declare function clonePoint([x, y]: Point): Point;
/**
 * Creates a deep copy of the given polygon.
 */
export declare function clonePolygon(p: Polygon): Polygon;
/**
 * Check if a point is inside of a SIMPLE (non-self-intersecting) polygon. This does
 * not always handle the case where the point lies on an edge of the polygon, which is
 * apparently an intended "edge" case (pun intended) for the algorithm used.
 *
 * Uses the Jordan Curve Theorem, with code ported from
 * https://wrfranklin.org/Research/Short_Notes/pnpoly.html.
 */
export declare function isPointInsideSimplePolygon(point: Point, poly: Polygon): boolean;
/**
 * Check if a point is on the edge of a SIMPLE (non-self-intersecting) polygon.
 *
 * Code ported from
 * https://gist.github.com/danijak/4904451c68e476e2fb0a11207c9061dd#file-ispointonpolygon-cpp.
 */
export declare function isPointOnEdgeOfSimplePolygon(point: Point, poly: Polygon): boolean;
/**
 * Find the point on a SIMPLE (non-self-intersecting) polygon which is closest to the
 * target point. If the target point is inside the polygon or on an edge of the polygon,
 * it IS the closest point.
 *
 * Code ported from https://javedali-iitkgp.medium.com/get-closest-point-on-a-polygon-23b68e26a33.
 */
export declare function closestPointOnSimplePolygonToTarget(poly: Polygon, target: Point): Point;
