import { getBestPointsOrder, getPath, getPaths } from "@/components/map/helper";
import {
	type ErrorResponse,
	type Point,
	type PointWithRoute,
	isFinalDestinationPoint,
	isPointWithRoute,
} from "@/components/map/types";
import { useRouteRenderers } from "@/contexts/route-renderers-context";
import { api } from "@/services/api";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { isAxiosError } from "axios";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";

interface IMapRoutesContextProviderProps {
	children: React.ReactNode;
}

interface IMapRoutesContextData {
	orderId: number | null;
	origin: Point | null;
	destination: Point | null;
	locations: PointWithRoute[] | null;

	isLoading: boolean;
	isSending: boolean;
	isInEditMode: boolean;
	editingId: number | null;

	movePoint: (direction: "up" | "down", id: number) => void;
	handleEdit: (editingId: number) => void;
	finishEditing: (newPath: google.maps.DirectionsResult) => void;
	saveRoute: () => Promise<{
		fullPath: google.maps.LatLngLiteral[];
		fulPolyline: string;
	}>;
	resetToDefault: () => Promise<void>;
}

const MapRoutesContext = createContext<IMapRoutesContextData | null>(null);

export function MapRoutesProvider({
	children,
}: IMapRoutesContextProviderProps) {
	const map = useMap();

	const searchParams = new URLSearchParams(document.location.search);
	const idOrdem = searchParams.get("idOrdem");
	const hashEmpresa = searchParams.get("hashEmpresa");

	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [isInEditMode, setIsInEditMode] = useState(false);
	const [editingId, setEditingId] = useState<null | number>(null);

	const [orderId, setOrderId] = useState<number | null>(null);
	const [origin, setOrigin] = useState<Point | null>(null);
	const [destination, setDestination] = useState<Point | null>(null);
	const [locations, setLocations] = useState<PointWithRoute[]>([]);

	const routesLibrary = useMapsLibrary("routes");
	const geometryLibrary = useMapsLibrary("geometry");
	const [directionsService, setDirectionsService] =
		useState<google.maps.DirectionsService | null>(null);

	const { clearRenderer, clearAllRenderers } = useRouteRenderers();

	const handleEdit = useCallback((editingId: number) => {
		setIsInEditMode(true);
		setEditingId(editingId);
	}, []);

	const finishEditing = useCallback(
		(newPath: google.maps.DirectionsResult) => {
			if (newPath) {
				const pointsWithNewRoute = [...locations];

				const editedElement = pointsWithNewRoute.find(
					(item) => item.id === editingId,
				);

				if (!editedElement) {
					toast.error("Erro ao tentar editar este trajeto");
					return;
				}

				editedElement.route = {
					waypoints:
						newPath.routes[0]?.legs[0]?.via_waypoints?.map((item) => ({
							lat: item.lat(),
							lng: item.lng(),
						})) || [],
					directionsResponse: newPath,
				};
				setLocations(pointsWithNewRoute);
			}

			setEditingId(null);
			setIsInEditMode(false);
		},
		[editingId, locations],
	);

	const movePoint = useCallback(
		async (direction: "up" | "down", id: number) => {
			setIsLoading(true);
			const index = locations.findIndex((item) => item.id === id);
			if (!directionsService) return;
			const newLocations = [...locations];
			if (direction === "up") {
				if (
					index <= 0 ||
					origin === null ||
					isFinalDestinationPoint(newLocations[index])
				)
					return;

				const FIRST_MOVABLE_ITEM_INDEX = 1;

				const isUsingOrigin = index === FIRST_MOVABLE_ITEM_INDEX;

				const [firstOriginPoint] = isUsingOrigin
					? [origin]
					: newLocations.splice(index - 2, 1);

				const toSubtractFromIndex = isUsingOrigin ? 1 : 2;

				const [moved, clicked, nextPoint] = newLocations.splice(
					index - toSubtractFromIndex,
					3,
				);

				for (const point of [moved, clicked, nextPoint]) {
					clearRenderer(point.id);
				}

				const { origin: newOrderOrigin, destinationsWithRoutes } =
					await getPaths({
						points: [firstOriginPoint, clicked, moved, nextPoint],
						alreadyExistingPathsForPoints: newLocations,
						directionsService,
					});

				if (!isUsingOrigin && isPointWithRoute(newOrderOrigin)) {
					newLocations.splice(
						index - 2,
						0,
						...[newOrderOrigin, ...destinationsWithRoutes],
					);
				} else {
					setOrigin(newOrderOrigin);
					newLocations.splice(0, 0, ...destinationsWithRoutes);
				}
			} else {
				if (
					index < 0 ||
					origin === null ||
					isFinalDestinationPoint(newLocations[index])
				)
					return;

				const LAST_MOVABLE_ITEM_INDEX = isFinalDestinationPoint(
					newLocations[newLocations.length - 1],
				)
					? newLocations.length - 2
					: newLocations.length - 1;

				if (index > LAST_MOVABLE_ITEM_INDEX) return;

				const [clicked, moved, nextPoint] = newLocations.splice(index, 3);

				const isUsingOrigin = index === 0;

				const [firstOriginPoint] = isUsingOrigin
					? [origin]
					: newLocations.splice(index - 1, 1);

				for (const point of [moved, clicked, nextPoint]) {
					clearRenderer(point.id);
				}

				const { origin: newOrderOrigin, destinationsWithRoutes } =
					await getPaths({
						points: [firstOriginPoint, moved, clicked, nextPoint],
						alreadyExistingPathsForPoints: newLocations,
						directionsService,
					});

				if (!isUsingOrigin && isPointWithRoute(newOrderOrigin)) {
					newLocations.splice(
						index - 1,
						0,
						...[newOrderOrigin, ...destinationsWithRoutes],
					);
				} else {
					setOrigin(newOrderOrigin);
					newLocations.splice(0, 0, ...destinationsWithRoutes);
				}
			}

			setLocations(newLocations);
			setIsLoading(false);
		},
		[clearRenderer, directionsService, locations, origin],
	);

	const getInitialPaths = useCallback(async () => {
		try {
			setIsLoading(true);

			if (!directionsService || !geometryLibrary) {
				throw new Error(
					"Carregando os serviços do Google Maps, aguarde um momento",
				);
			}

			if (!idOrdem || Number.isNaN(idOrdem) || !hashEmpresa?.trim()) {
				throw new Error(
					"Um dos parâmetros está incorreto, verifique-os e tente novamente",
				);
			}

			const { origin, destination, orderId, orderedPoints } =
				await getBestPointsOrder({
					orderId: Number(idOrdem),
					hashEmpresa,
				});

			setOrigin(origin);
			setDestination(destination);
			setOrderId(orderId);

			const { destinationsWithRoutes } = await getPaths({
				points: orderedPoints,
				alreadyExistingPathsForPoints: [],
				directionsService,
			});

			setLocations(destinationsWithRoutes);
		} catch (err) {
			if (isAxiosError<ErrorResponse>(err)) {
				toast.error(
					err.response?.data.message || "Erro ao buscar as localizações",
				);
				return;
			}
			if (err instanceof Error)
				toast.error(err.message || "Erro ao buscar as localizações");
		} finally {
			setIsLoading(false);
		}
	}, [directionsService, geometryLibrary, hashEmpresa, idOrdem]);

	const saveRoute = useCallback(async () => {
		try {
			setIsSending(true);

			if (!directionsService || !geometryLibrary) {
				throw new Error(
					"Não foi possível solicitar os serviços do Google Maps",
				);
			}

			if (!origin || !destination || !locations) {
				throw new Error(
					"Não foi possível salvar a rota, verifique as localizações",
				);
			}

			toast.info("Enviando dados ao servidor...");

			const pathPromises = locations.map((point, index) =>
				getPath({
					origin: index === 0 ? origin : locations[index - 1],
					destination: point,
					waypoints: point.route.waypoints,
					directionsService,
				}).then((data) => {
					const path = data.route.directionsResponse.routes[0].overview_path;

					const coordinatesArray = path.map((step) => step.toJSON());

					return coordinatesArray;
				}),
			);

			const allPaths = await Promise.all(pathPromises);

			const { encoding } = geometryLibrary;
			const fullPath = allPaths.flat();
			const fulPolyline = encoding.encodePath(fullPath);

			const response = await api.post(
				`/rota-de-entrega/${hashEmpresa}/salvar-rota`,
				{
					idOrdem,
					encodedPolyline: fulPolyline,
					orderedPoints: [
						origin.location,
						...locations.map((location) => location.location),
					],
				},
			);

			if (response.status === 201) {
				toast.success("Dados salvos com sucesso!");
			}

			return {
				fullPath,
				fulPolyline,
			};
		} catch (err) {
			if (err instanceof Error) {
				toast.error(
					err.message || "Ocorreu um erro desconhecido ao salvar a rota",
				);
			}

			return {
				fullPath: [],
				fulPolyline: "",
			};
		} finally {
			setIsSending(false);
		}
	}, [
		destination,
		directionsService,
		geometryLibrary,
		hashEmpresa,
		idOrdem,
		locations,
		origin,
	]);

	const resetToDefault = useCallback(async () => {
		clearAllRenderers();
		getInitialPaths();
	}, [clearAllRenderers, getInitialPaths]);

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

		getInitialPaths();

		return () => {
			window.removeEventListener("load", paramsListener);
		};
	}, [getInitialPaths, hashEmpresa, idOrdem]);

	// Inicializa os módulos do Google
	useEffect(() => {
		if (!routesLibrary || !map) return;
		setDirectionsService(new routesLibrary.DirectionsService());
	}, [routesLibrary, map]);

	const valuesMemo = useMemo<IMapRoutesContextData>(
		() => ({
			orderId,
			destination,
			origin,
			locations,

			isLoading,
			isSending,
			isInEditMode,
			editingId,

			movePoint,
			handleEdit,
			finishEditing,
			saveRoute,
			resetToDefault,
		}),
		[
			orderId,
			destination,
			origin,
			locations,
			isLoading,
			isSending,
			isInEditMode,
			editingId,
			movePoint,
			handleEdit,
			finishEditing,
			saveRoute,
			resetToDefault,
		],
	);

	return <MapRoutesContext value={valuesMemo}>{children}</MapRoutesContext>;
}

export function useMapRoutes() {
	const context = use(MapRoutesContext);

	if (!context) {
		throw new Error("useMapRoutes deve estar envolto em MapRoutesProvider");
	}

	return context;
}
