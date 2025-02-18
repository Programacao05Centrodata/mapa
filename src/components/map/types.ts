export interface ComputeRoutesResponse {
	routes: Route[];
	fallbackInfo?: FallbackInfo;
}

export interface BasePoint {
	id: number;
	name: string;
	address: string;
	location: {
		lat: number
		lng: number
	};
}

export interface PickUpPoint extends BasePoint {
	type: "coleta";
	dropsOffIn: number[];
}

export interface DropOffPoint extends BasePoint {
	type: "entrega";
	pickedUpIn: number[];
}

export function isPickUpPoint(point: Point): point is PickUpPoint {
  return point.type === "coleta" && Array.isArray(point.dropsOffIn);
}

export function isDropOffPoint(point: Point): point is DropOffPoint {
  return point.type === "entrega" && Array.isArray(point.pickedUpIn);
}

export type Point = PickUpPoint | DropOffPoint;

export interface PointsData {
	orderId: number;
	origin: PickUpPoint;
	destination: DropOffPoint | null;
	orderedPoints: Point[]
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
  text: string
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
}

export type Poi = {
	id: string;
} & RawPoi

export interface IRoutePoints {
	origin: RawPoi;
	destinations: RawPoi[];
}

export interface IPath {
	name: string;
	link: {
		from: number
		to: number
	}
	distanceMeters: number;
	duration: string;
	staticDuration: string;
	polyline: google.maps.LatLng[];
	viewport: Viewport;
	localizedValues?: LocalizedValues;
}
