export interface ComputeRoutesResponse {
	routes: Route[];
	fallbackInfo?: FallbackInfo;
}

export interface BasePoint {
	id: number;
	name: string;
	address: {
		route: string;
		number: string | null;
		neighborhood: string | null;
		city: string;
		state: string;
	};
	location: {
		lat: number;
		lng: number;
	};
	route?: {
		waypoints: google.maps.LatLngLiteral[];
		directionsResponse: google.maps.DirectionsResult;
	};
}

// Novos tipos para BasePoint com e sem o atributo "route"
export type BasePointWithRoute = BasePoint & {
	route: {
		waypoints: google.maps.LatLngLiteral[];
		directionsResponse: google.maps.DirectionsResult;
	};
};

export type BasePointWithoutRoute = BasePoint & {
	route?: undefined;
};

// Funções type guard
export function isBasePointWithRoute(
	point: BasePoint,
): point is BasePointWithRoute {
	return point.route !== undefined;
}

export function isBasePointWithoutRoute(
	point: BasePoint,
): point is BasePointWithoutRoute {
	return point.route === undefined;
}

export interface PickUpPoint extends BasePoint {
	type: "coleta";
	dropsOffIn: number[];
	isOrigin: boolean;
	goesTo?: number;
	comesFrom?: number;
}

export interface DropOffPoint extends BasePoint {
	type: "entrega";
	pickedUpIn: number[];
	isFinalDestination: boolean;
	goesTo?: number;
	comesFrom?: number;
}

export type Point = PickUpPoint | DropOffPoint;

// Novo tipo para Point com rota
export type PointWithRoute = Point & BasePointWithRoute;

// Type guard para verificar se um Point tem rota
export function isPointWithRoute(point: Point): point is PointWithRoute {
	return isBasePointWithRoute(point);
}

// Basic type guards
export function isPickUpPoint(point: Point): point is PickUpPoint {
	return point.type === "coleta" && Array.isArray(point.dropsOffIn);
}

export function isDropOffPoint(point: Point): point is DropOffPoint {
	return point.type === "entrega" && Array.isArray(point.pickedUpIn);
}

// Origin type guard
export function isOriginPoint(
	point: Point,
): point is PickUpPoint & { isOrigin: true } {
	return isPickUpPoint(point) && point.isOrigin === true;
}

// Final destination type guard
export function isFinalDestinationPoint(
	point: Point,
): point is DropOffPoint & { isFinalDestination: true } {
	return isDropOffPoint(point) && point.isFinalDestination === true;
}

// Additional utility type guards
export function hasNextPoint(
	point: Point,
): point is Point & { goesTo: number } {
	return point.goesTo !== undefined;
}

export function hasPreviousPoint(
	point: Point,
): point is Point & { comesFrom: number } {
	return point.comesFrom !== undefined;
}

// Complex interfaces for more specific use cases
export interface RouteOrigin extends PickUpPoint {
	isOrigin: true;
	comesFrom?: undefined; // Origin points shouldn't have a previous point
	goesTo: number; // Origin should always have a next point
}

export interface RouteFinalDestination extends DropOffPoint {
	isFinalDestination: true;
	goesTo?: undefined; // Final destination shouldn't have a next point
	comesFrom: number; // Final destination should always have a previous point
}

// Type guards for complex interfaces
export function isRouteOrigin(point: Point): point is RouteOrigin {
	return (
		isPickUpPoint(point) &&
		point.isOrigin === true &&
		point.comesFrom === undefined &&
		point.goesTo !== undefined
	);
}

export function isRouteFinalDestination(
	point: Point,
): point is RouteFinalDestination {
	return (
		isDropOffPoint(point) &&
		point.isFinalDestination === true &&
		point.goesTo === undefined &&
		point.comesFrom !== undefined
	);
}

// Intermediate point types if needed
export interface IntermediatePickUpPoint extends PickUpPoint {
	isOrigin: false;
	comesFrom: number;
	goesTo: number;
}

export interface IntermediateDropOffPoint extends DropOffPoint {
	isFinalDestination: false;
	comesFrom: number;
	goesTo: number;
}

// Type guards for intermediate points
export function isIntermediatePickUpPoint(
	point: Point,
): point is IntermediatePickUpPoint {
	return (
		isPickUpPoint(point) &&
		point.isOrigin === false &&
		point.comesFrom !== undefined &&
		point.goesTo !== undefined
	);
}

export function isIntermediateDropOffPoint(
	point: Point,
): point is IntermediateDropOffPoint {
	return (
		isDropOffPoint(point) &&
		point.isFinalDestination === false &&
		point.comesFrom !== undefined &&
		point.goesTo !== undefined
	);
}

// Funções type guard compostas
export function isPickUpPointWithRoute(
	point: Point,
): point is PickUpPoint & BasePointWithRoute {
	return isPickUpPoint(point) && isBasePointWithRoute(point);
}

export function isDropOffPointWithRoute(
	point: Point,
): point is DropOffPoint & BasePointWithRoute {
	return isDropOffPoint(point) && isBasePointWithRoute(point);
}

export function isFinalDestinationWithRoute(
	point: Point,
): point is RouteFinalDestination & BasePointWithRoute {
	return isRouteFinalDestination(point) && isBasePointWithRoute(point);
}

export interface PointsData {
	orderId: number;
	origin: PickUpPoint;
	destination: DropOffPoint | null;
	orderedPoints: Point[];
}

export interface IPath {
	from: Point;
	point: Point;
	route: {
		waypoints: google.maps.LatLngLiteral[];
		directionsResponse: google.maps.DirectionsResult;
	};
}

export interface ErrorResponse {
	statusCode: number;
	message: string;
}

export interface IPath {
	from: Point;
	point: Point;
	route: {
		waypoints: google.maps.LatLngLiteral[];
		directionsResponse: google.maps.DirectionsResult;
	};
}

export interface ErrorResponse {
	statusCode: number;
	message: string;
}

interface Route {
	routeLabels?: RouteLabel[];
	legs: RouteLeg[];
	distanceMeters: number;
	duration: string;
	staticDuration: string;
	polyline: Polyline;
	description?: string;
	warnings?: string[];
	viewport: Viewport;
	travelAdvisory?: RouteTravelAdvisory;
	localizedValues?: LocalizedValues;
}

interface LocalizedValue {
	text: string;
}

export interface LocalizedValues {
	distance: LocalizedValue;
	duration: LocalizedValue;
	staticDuration: LocalizedValue;
}

interface RouteLeg {
	distanceMeters: number;
	duration: string;
	staticDuration: string;
	polyline: Polyline;
	startLocation: Location;
	endLocation: Location;
	steps: RouteLegStep[];
	travelAdvisory?: RouteLegTravelAdvisory;
}

interface RouteLegStep {
	distanceMeters: number;
	duration: string;
	staticDuration: string;
	polyline: Polyline;
	startLocation: Location;
	endLocation: Location;
	navigationInstruction: NavigationInstruction;
	travelAdvisory?: RouteLegStepTravelAdvisory;
}

interface Polyline {
	encodedPolyline: string;
}

interface Location {
	latLng: LatLng;
}

export interface LatLng {
	latitude: number;
	longitude: number;
}

interface NavigationInstruction {
	maneuver: Maneuver;
	instructions: string;
}

type Maneuver =
	| "TURN_SLIGHT_LEFT"
	| "TURN_SHARP_LEFT"
	| "UTURN_LEFT"
	| "TURN_LEFT"
	| "TURN_SLIGHT_RIGHT"
	| "TURN_SHARP_RIGHT"
	| "UTURN_RIGHT"
	| "TURN_RIGHT"
	| "STRAIGHT"
	| "RAMP_LEFT"
	| "RAMP_RIGHT"
	| "MERGE"
	| "FORK_LEFT"
	| "FORK_RIGHT"
	| "FERRY"
	| "FERRY_TRAIN"
	| "ROUNDABOUT_LEFT"
	| "ROUNDABOUT_RIGHT";

interface RouteTravelAdvisory {
	tollInfo?: TollInfo;
	speedReadingIntervals?: SpeedReadingInterval[];
}

interface RouteLegTravelAdvisory {
	tollInfo?: TollInfo;
}

type RouteLegStepTravelAdvisory = Record<string, never>;

interface TollInfo {
	estimatedPrice: Money[];
}

interface Money {
	currencyCode: string;
	units: string;
	nanos: number;
}

interface SpeedReadingInterval {
	startPolylinePointIndex: number;
	endPolylinePointIndex: number;
	speed: Speed;
}

type Speed = "SPEED_UNSPECIFIED" | "NORMAL" | "SLOW" | "TRAFFIC_JAM";

interface FallbackInfo {
	routingMode: RoutingMode;
	reason: FallbackReason;
}

type RoutingMode =
	| "ROUTING_MODE_UNSPECIFIED"
	| "TRAFFIC_AWARE"
	| "TRAFFIC_AWARE_OPTIMAL";

type FallbackReason =
	| "FALLBACK_REASON_UNSPECIFIED"
	| "SERVER_ERROR"
	| "LATENCY_EXCEEDED";

type RouteLabel =
	| "ROUTE_LABEL_UNSPECIFIED"
	| "DEFAULT_ROUTE"
	| "DEFAULT_ROUTE_ALTERNATE";

export interface Viewport {
	low: LatLng;
	high: LatLng;
}

export type RawPoi = {
	name: string;
	location: google.maps.LatLngLiteral;
};

export type Poi = {
	id: string;
} & RawPoi;

export interface IRoutePoints {
	origin: RawPoi;
	destinations: RawPoi[];
}

export interface IPathForPolyline {
	name: string;
	link: {
		from: number;
		to: number;
	};
	distanceMeters: number;
	duration: string;
	staticDuration: string;
	polyline: google.maps.LatLng[];
	viewport: Viewport;
	localizedValues?: LocalizedValues;
}
