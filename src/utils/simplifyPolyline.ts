export interface LatLng {
	lat: number;
	lng: number;
}

function getPerpendicularDistance(point: LatLng, lineStart: LatLng, lineEnd: LatLng): number {
	const dx = lineEnd.lng - lineStart.lng;
	const dy = lineEnd.lat - lineStart.lat;
	if (dx === 0 && dy === 0) {
		return Math.hypot(point.lng - lineStart.lng, point.lat - lineStart.lat);
	}

	const t = ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (dx * dx + dy * dy);
	const nearestX = lineStart.lng + t * dx;
	const nearestY = lineStart.lat + t * dy;
	return Math.hypot(point.lng - nearestX, point.lat - nearestY);
}

export function simplifyPolyline(points: LatLng[], tolerance: number): LatLng[] {
	if (points.length < 3) return points;

	const firstPoint = points[0];
	const lastPoint = points[points.length - 1];

	// Find the point with the maximum distance
	let index = -1;
	let maxDist = 0;

	for (let i = 1; i < points.length - 1; i++) {
		const dist = getPerpendicularDistance(points[i], firstPoint, lastPoint);
		if (dist > maxDist) {
			index = i;
			maxDist = dist;
		}
	}

	// If max distance is greater than tolerance, recursively simplify
	if (maxDist > tolerance) {
		const left = simplifyPolyline(points.slice(0, index + 1), tolerance);
		const right = simplifyPolyline(points.slice(index), tolerance);
		return left.slice(0, left.length - 1).concat(right);
	}
		return [firstPoint, lastPoint];
}
