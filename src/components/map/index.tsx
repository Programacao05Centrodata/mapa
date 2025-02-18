import {
	APIProvider,
	Map as GoogleMap,
	useMap,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { Polyline } from "./polygons/polyline";
import { MapMenu } from "./menu";
import { getBestPointsOrder, getPolyline } from "@/components/map/helper";
import { toast } from "sonner";
import type { IPath, Point, PointsData } from "@/components/map/types";
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
	const map = useMap();
	const [loadingPaths, setLoadingPaths] = useState(false);
	const [paths, setPaths] = useState<IPath[]>([]);
	const [markers, setMarkers] = useState<Point[]>([]);
	const [waypoints, setWaypoints] = useState<google.maps.LatLngLiteral[]>([]);

	const getMarkers = useCallback(async () => {
		try {
			const orderId = Number(idOrdem);
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
		}
	}, [idOrdem, hashEmpresa]);

	const getInitialPaths = useCallback(async () => {
		if (locations) {
			setLoadingPaths(true);
			try {
				const { route } = await getPolyline({
					origin: locations.origin,
					waypoints: locations.orderedPoints,
					destination: locations.destination,
					alreadyExistingPaths: [],
				});
				setPaths(route);
			} catch {
				toast.error("Ocorreu um erro ao gerar sua rota");
			} finally {
				setLoadingPaths(false);
			}
		}
	}, [locations]);

	const handleMoveVertexPosition = useCallback(
		async ({ coordinates }: IHandleMovedVertexPositionProps) => {
			setWaypoints((prev) => [...prev, coordinates]);
		},
		[],
	);

	useEffect(() => {
		getMarkers();
	}, [getMarkers]);

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

			for (const path of paths) {
				bounds.extend(
					new google.maps.LatLng(
						path.viewport.high.latitude,
						path.viewport.high.longitude,
					),
				);
				bounds.extend(
					new google.maps.LatLng(
						path.viewport.low.latitude,
						path.viewport.low.longitude,
					),
				);
			}

			map.fitBounds(bounds, { left: 380, bottom: 20, right: 20, top: 20 });
		}
	}, [map, locations, paths, markers]);

	const getReorderedRoute = useCallback(
		async (newOrder: Point[]) => {
			try {
				if (locations?.orderedPoints.length === newOrder.length) {
					const { route } = await getPolyline({
						origin: locations.origin,
						waypoints: newOrder,
						destination: locations.destination,
						alreadyExistingPaths: paths,
					});

					console.log(route);

					setPaths(route);
					setMarkers(newOrder);
				}
			} catch (error) {
				if (error instanceof Error) toast.error(error.message);
			}
		},
		[locations, paths],
	);

	const lineColors = [
		"oklch(0.723 0.219 149.579)",
		"oklch(0.715 0.143 215.221)",
		"oklch(0.606 0.25 292.717)",
		"oklch(0.623 0.214 259.815)",
	];

	return (
		<div className="relative h-screen w-screen">
			<MapMenu
				isLoadingPaths={loadingPaths}
				isLoadingMarkers={loadingPaths}
				origin={locations?.origin || null}
				destination={locations?.destination || null}
				locations={markers}
				paths={paths}
				getBestRoute={async () => await getInitialPaths()}
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
				{paths.map(({ polyline, name, distanceMeters }, index) => (
					<Polyline
						key={`${name}-${distanceMeters}`}
						path={polyline}
						strokeColor={lineColors[index % lineColors.length]}
						onMovedVertexPosition={(coordinates) =>
							handleMoveVertexPosition(coordinates)
						}
					/>
				))}
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
