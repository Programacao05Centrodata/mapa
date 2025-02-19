import type { Point, PointWithRoute, PointsData } from "@/components/map/types";
import type { ComputeRoutesResponse } from "@/components/map/types";
import { api } from "@/services/api";
import axios from "axios";

type GetPolylineInputs = {
	startPoint: google.maps.LatLngLiteral;
	finishPoint: google.maps.LatLngLiteral;
	waypoints?: google.maps.LatLngLiteral[];
};

type IPolylineInput =
	| ({
			type: "coordinates";
	  } & GetPolylineInputs)
	| {
			type: "encoded";
			encodedPolyline: string;
	  };

export async function getRoute({
	startPoint,
	waypoints,
	finishPoint,
}: GetPolylineInputs) {
	const response = await axios.post<ComputeRoutesResponse>(
		"https://routes.googleapis.com/directions/v2:computeRoutes",
		{
			origin: {
				location: {
					latLng: {
						latitude: startPoint.lat,
						longitude: startPoint.lng,
					},
				},
			},
			...(waypoints &&
				waypoints.length > 0 && {
					intermediates: waypoints.map((waypoint) => ({
						location: {
							latLng: {
								latitude: waypoint.lat,
								longitude: waypoint.lng,
							},
						},
					})),
				}),
			destination: {
				location: {
					latLng: {
						latitude: finishPoint.lat,
						longitude: finishPoint.lng,
					},
				},
			},
			polylineQuality: "OVERVIEW",
			travelMode: "DRIVE",
			routingPreference: "TRAFFIC_AWARE",
			routeModifiers: {
				avoidTolls: false,
				avoidHighways: false,
				avoidFerries: false,
			},
			languageCode: "pt-BR",
			units: "METRIC",
		},
		{
			params: {
				key: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
				fields:
					"routes.legs,routes.distanceMeters,routes.duration,routes.staticDuration",
			},
		},
	);

	return response.data;
}

export async function getDecodedPolyline(input: IPolylineInput) {
	const { encoding } = (await google.maps.importLibrary(
		"geometry",
	)) as google.maps.GeometryLibrary;

	if (input.type === "encoded") {
		return encoding.decodePath(
			(input as { encodedPolyline: string }).encodedPolyline,
		);
	}

	const { routes } = await getRoute(input);

	const encodedPolyline = routes[0].polyline.encodedPolyline;

	return encoding.decodePath(encodedPolyline);
}

interface IGetPathProps {
	origin: Point;
	destination: Point;
	waypoints: google.maps.LatLngLiteral[];
	directionsService: google.maps.DirectionsService;
}

export async function getPath({
	origin,
	destination,
	directionsService,
	waypoints,
}: IGetPathProps): Promise<PointWithRoute> {
	const directionsResult = await directionsService.route({
		origin: origin.location,
		waypoints: waypoints.map((waypoint) => {
			return {
				stopover: false,
				location: waypoint,
			};
		}),
		destination: destination.location,
		travelMode: google.maps.TravelMode.DRIVING,
	});

	destination.goesTo = undefined;

	return {
		...destination,
		goesTo: undefined,
		comesFrom: origin.id,
		route: {
			directionsResponse: directionsResult,
			waypoints,
		},
	};
}

interface IGetPathsProps {
	points: Point[];
	alreadyExistingPathsForPoints: PointWithRoute[];
	directionsService: google.maps.DirectionsService;
}

export async function getPaths({
	points,
	alreadyExistingPathsForPoints,
	directionsService,
}: IGetPathsProps): Promise<{
	origin: Point;
	destinationsWithRoutes: PointWithRoute[];
}> {
	if (points.length === 0) {
		throw new Error("Points array cannot be empty");
	}

	const [origin, ...destinations] = points.filter(
		(point): point is Point => !!point,
	);

	const destinationsWithRoutes: PointWithRoute[] = [];
	let previousPoint = origin;

	for (const destination of destinations) {
		const existingRoute = alreadyExistingPathsForPoints.find(
			(point) => point.id === destination.id,
		);

		if (existingRoute) {
			destinationsWithRoutes.push(existingRoute);
		} else {
			const pointWithRoute = await getPath({
				origin: previousPoint,
				destination,
				directionsService,
				waypoints: [],
			});

			if (previousPoint.id === origin.id) {
				origin.goesTo = destination.id;
			} else {
				destinationsWithRoutes[destinationsWithRoutes.length - 1].goesTo =
					pointWithRoute.id;
			}

			destinationsWithRoutes.push(pointWithRoute);
		}

		previousPoint = destination;
	}

	return {
		origin,
		destinationsWithRoutes,
	};
}

interface IGetBestPointsOrder {
	hashEmpresa: string;
	orderId: number;
}

export async function getBestPointsOrder({
	hashEmpresa,
	orderId,
}: IGetBestPointsOrder): Promise<PointsData> {
	const response = await api.get<PointsData>(
		`/rota-de-entrega/${hashEmpresa}/melhor-rota`,
		{ params: { idOrdem: orderId } },
	);
	return response.data;
}
