import type {
	IPath,
	Poi,
	Point,
	PointsData,
	RawPoi,
} from "@/components/map/types";
import type { ComputeRoutesResponse } from "@/components/map/types";
import { v4 as uuidV4 } from "uuid";
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
			optimizeWaypointOrder: true,
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
			headers: {
				"X-Goog-Api-Key": import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
				"X-Goog-FieldMask": "*",
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

interface IGetPolylineProps {
	origin: Point;
	waypoints: Point[];
	destination: Point | null;
	alreadyExistingPaths: IPath[];
}

export async function getPolyline({
	origin,
	waypoints,
	destination,
	alreadyExistingPaths,
}: IGetPolylineProps): Promise<{ route: IPath[] }> {
	const orderedPoints = [...waypoints].filter(
		(point): point is Point => !!point,
	);
	const route: IPath[] = [];
	let currentPoint = origin;

	for (const nextPoint of orderedPoints) {
		const alreadyExistingPath =
			alreadyExistingPaths.find(
				(path) =>
					path.link.from === currentPoint.id && path.link.to === nextPoint.id,
			) || null;

		// console.log(
		// 	`Caminho de ${currentPoint.id} - ${currentPoint.name} até ${nextPoint.id} - ${nextPoint.name} ${alreadyExistingPath ? "já existe" : "não existe. Buscando rota"}`,
		// );

		if (alreadyExistingPath) {
			route.push(alreadyExistingPath);
		} else {
			const { routes } = await getRoute({
				startPoint: currentPoint.location,
				finishPoint: nextPoint.location,
			});
			const pathRoute = routes[0];

			route.push({
				name: `De ${currentPoint.name} para ${nextPoint.name}`,
				polyline: await getDecodedPolyline({
					type: "encoded",
					encodedPolyline: pathRoute.polyline.encodedPolyline,
				}),
				link: {
					from: currentPoint.id,
					to: nextPoint.id,
				},
				distanceMeters: pathRoute.distanceMeters,
				duration: pathRoute.duration,
				staticDuration: pathRoute.staticDuration,
				localizedValues: pathRoute.localizedValues,
				viewport: pathRoute.viewport,
			});
		}
		currentPoint = nextPoint;
	}

	// Append route to destination if provided and last point is different
	if (destination && currentPoint.id !== destination.id) {
		const { routes } = await getRoute({
			startPoint: currentPoint.location,
			finishPoint: destination.location,
		});
		const pathRoute = routes[0];

		route.push({
			name: `De ${currentPoint.name} para ${destination.name}`,
			polyline: await getDecodedPolyline({
				type: "encoded",
				encodedPolyline: pathRoute.polyline.encodedPolyline,
			}),
			link: {
				from: currentPoint.id,
				to: destination.id,
			},
			distanceMeters: pathRoute.distanceMeters,
			duration: pathRoute.duration,
			staticDuration: pathRoute.staticDuration,
			localizedValues: pathRoute.localizedValues,
			viewport: pathRoute.viewport,
		});
	}

	return { route };
}

interface IGetBestPointsOrder {
	hashEmpresa: string;
	orderId: number;
}

export async function getBestPointsOrder({
	hashEmpresa,
	orderId,
}: IGetBestPointsOrder) {
	const response = await axios.get<PointsData>(
		`http://localhost:3333/v2/rota-de-entrega/${hashEmpresa}/melhor-rota`,
		{ params: { idOrdem: orderId } },
	);
	return response.data;
}

interface IGetNewRouteProps {
	origin: Poi;
	oldOrder: Poi[];
	newOrder: Poi[];
}

export function refinePois<T extends RawPoi | RawPoi[]>(
	rawPois: T,
): T extends RawPoi[] ? Poi[] : Poi {
	const parsePoi = (rawPoi: RawPoi): Poi => ({
		...rawPoi,
		id: uuidV4(),
	});

	if (Array.isArray(rawPois)) {
		return rawPois.map(parsePoi) as T extends RawPoi[] ? Poi[] : Poi;
	}

	return parsePoi(rawPois) as T extends RawPoi[] ? Poi[] : Poi;
}

export async function getNewRoute({
	origin,
	oldOrder,
	newOrder,
}: IGetNewRouteProps) {
	console.log(newOrder, oldOrder);

	return {
		markers: [origin],
	};
}
