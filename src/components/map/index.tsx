import {
	APIProvider,
	Map as GoogleMap,
	useMap,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { MapMenu } from "./menu";
import {
	getBestPointsOrder,
	getPaths,
	type IPathForService,
} from "@/components/map/helper";
import { toast } from "sonner";
import type { Point, PointsData } from "@/components/map/types";
import { isAxiosError } from "axios";
import { PoiMarkers } from "@/components/map/markers";

export interface IHandleMovedVertexPositionProps {
	coordinates: google.maps.LatLngLiteral;
}

interface ErrorResponse {
	statusCode: number;
	message: string;
}

export function MapComponent() {
	const searchParams = new URLSearchParams(document.location.search);
	const idOrdem = searchParams.get("idOrdem");
	const hashEmpresa = searchParams.get("hashEmpresa");
	const [locations, setLocations] = useState<PointsData | null>(null);
	const [isLoadingLocations, setIsLoadingLocations] = useState(true);
	const map = useMap();
	const [paths, setPaths] = useState<IPathForService[]>([]);
	const [markers, setMarkers] = useState<Point[]>([]);
	const [routePolylines, setRoutePolylines] =
		useState<google.maps.DirectionsPolyline[]>();

	const getMarkers = useCallback(async () => {
		const orderId = Number(idOrdem);
		try {
			setIsLoadingLocations(true);
			if (!idOrdem || Number.isNaN(orderId) || !hashEmpresa) {
				throw new Error(
					"Um dos parâmetros está incorreto, verifique-os e tente novamente",
				);
			}
			const response = await getBestPointsOrder({ orderId, hashEmpresa });

			setLocations(response);
			setMarkers([...response.orderedPoints]);
		} catch (err) {
			if (isAxiosError<ErrorResponse>(err)) {
				toast.error(err.response?.data.message);
				return;
			}
			if (err instanceof Error) toast.error(err.message);
		} finally {
			setIsLoadingLocations(false);
		}
	}, [idOrdem, hashEmpresa]);

	const getInitialPaths = useCallback(async () => {
		if (locations) {

			try {
				setPaths(
					getPaths({
						origin: locations.origin,
						waypoints: locations.orderedPoints,
						destination: locations.destination,
						alreadyExistingPaths: [],
					}),
				);
			} catch {
				toast.error("Ocorreu um erro ao gerar sua rota");
			}
		}
	}, [locations]);

	useEffect(() => {
		const paramsListener = () => {
			const orderId = Number(idOrdem);
			if (!idOrdem || Number.isNaN(orderId) || !hashEmpresa) {
				toast.error(
					"Um dos parâmetros está incorreto, verifique-os e tente novamente",
				);
			}
		};
		window.addEventListener("load", paramsListener);

		getMarkers();

		return () => {
			window.removeEventListener("load", paramsListener);
		};
	}, [getMarkers, hashEmpresa, idOrdem]);

	useEffect(() => {
		if (locations) {
			getInitialPaths();
		}
	}, [locations, getInitialPaths]);

	useEffect(() => {
		if (map && locations && locations.orderedPoints.length > 0) {
			const bounds = new google.maps.LatLngBounds();

			bounds.extend(
				new window.google.maps.LatLng(
					locations.origin.location.lat,
					locations.origin.location.lng,
				),
			);

			for (const marker of markers) {
				bounds.extend(
					new window.google.maps.LatLng(
						marker.location.lat,
						marker.location.lng,
					),
				);
			}

			if (locations.destination) {
				bounds.extend(
					new window.google.maps.LatLng(
						locations.destination.location.lat,
						locations.destination.location.lng,
					),
				);
			}

			map.fitBounds(bounds, { left: 380, bottom: 20, right: 20, top: 20 });
		}
	}, [map, locations, markers]);

	const getReorderedRoute = useCallback(
		async (newOrder: Point[]) => {
			try {
				if (locations?.orderedPoints.length === newOrder.length) {
					
					const newPaths = getPaths({
						origin: locations.origin,
						waypoints: newOrder,
						destination: locations.destination,
						alreadyExistingPaths: paths,
					});
					
					setPaths(newPaths);
					setMarkers(newOrder);
				}
			} catch (error) {
				if (error instanceof Error) toast.error(error.message);
			}
		},
		[locations, paths],
	);

	return (
		<div className="relative h-screen w-screen">
			<MapMenu
				isLoadingMarkers={isLoadingLocations}
				origin={locations?.origin || null}
				destination={locations?.destination || null}
				locations={markers}
				paths={paths}
				getBestRoute={async () => await getMarkers()}
				reorderCallback={getReorderedRoute}
			/>
			<GoogleMap
				mapId={"map"}
				defaultZoom={13}
				defaultCenter={
					locations?.origin.location || {
						lat: -27.24009213432068,
						lng: -48.63320378854962,
					}
				}
				gestureHandling={"greedy"}
				disableDefaultUI={true}
				className="h-full w-full"
			>
				<PoiMarkers
					showOrder={markers.length > 0}
					points={[
						locations?.origin,
						...markers,
						locations?.destination,
					].filter((point): point is Point => !!point)}
				/>
			</GoogleMap>
		</div>
	);
}

export function RouteMap() {
	return (
		<APIProvider apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY}>
			<MapComponent />
		</APIProvider>
	);
}
