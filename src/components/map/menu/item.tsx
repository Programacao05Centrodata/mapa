import {
	type PointWithRoute,
	isDropOffPoint,
	isFinalDestinationPoint,
	isOriginPoint,
	isPickUpPoint,
} from "@/components/map/types";
import { Button } from "@/components/ui/button";
import { useMapRoutes } from "@/contexts/map-routes-context";
import { useRouteRenderers } from "@/contexts/route-renderers-context";
import { cn } from "@/lib/utils";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	Check,
	ContainerIcon,
	MapPinCheckIcon,
	PackageOpenIcon,
	PencilIcon,
	TrashIcon,
	UndoIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface IMenuItem {
	index: number;
	location: PointWithRoute;
}

export function MenuItem({ index, location }: IMenuItem) {
	const {
		handleEdit,
		finishEditing,
		movePoint,

		isLoading,
		isSending,
		isInEditMode,
		editingId,
		locations,
		origin,
	} = useMapRoutes();

	const map = useMap();
	const polylineConfigs = useMemo(
		() => ({
			strokeColor: "#3b82f6",
			strokeWeight: 5,
			strokeOpacity: 0.75,
			zIndex: 1,
		}),
		[],
	);
	const routesLibrary = useMapsLibrary("routes");
	const [directionsService, setDirectionsService] =
		useState<google.maps.DirectionsService>();
	const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
	const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
	const [waypoints, setWaypoints] = useState<google.maps.LatLngLiteral[]>(
		location.route.waypoints || [],
	);
	const selected = useMemo(() => routes[0], [routes]);
	const leg = useMemo(() => selected?.legs[0], [selected]);

	const { setRenderer, getRenderer, clearRenderer } = useRouteRenderers();
	const renderer = getRenderer(location.id);

	useEffect(() => {
		setRoutes(location.route.directionsResponse.routes);
		renderer?.setDirections(location.route.directionsResponse);
	}, [location, renderer]);

	const drawLine = useCallback(
		async (waypoints?: google.maps.LatLngLiteral[]) => {
			if (isOriginPoint(location) || !locations || !origin || !origin) return;

			const previousElement =
				locations?.find((item) => item.id === location.comesFrom) || origin;

			if (directionsService && routesLibrary && map) {
				directionsService
					.route({
						origin: previousElement.location,
						destination: location.location,
						waypoints:
							waypoints?.map((waypoint) => ({
								location: waypoint,
								stopover: false,
							})) || [],
						travelMode: google.maps.TravelMode.DRIVING,
					})
					.then((response) => {
						setRenderer(
							location.id,
							new routesLibrary.DirectionsRenderer({
								preserveViewport: true,
								draggable: false,
								suppressMarkers: true,
								polylineOptions: polylineConfigs,
								directions: response,
								map,
							}),
						);
						setRoutes(response.routes);
					})
					.catch((error) => console.error("Route error:", error));
			}
		},
		[
			directionsService,
			location,
			locations,
			map,
			origin,
			polylineConfigs,
			routesLibrary,
			setRenderer,
		],
	);

	const handleStartEditing = useCallback(async () => {
		handleEdit(location.id);

		if (renderer && directionsService) {
			renderer.setMap(null);

			listenerRef.current = google.maps.event.addListener(
				renderer,
				"directions_changed",
				() => {
					const result = renderer.getDirections();
					if (result) {
						setWaypoints(() => [
							...result.routes[0].legs[0].via_waypoints.map((waypoint) => ({
								lat: waypoint.lat(),
								lng: waypoint.lng(),
							})),
						]);
					}
				},
			);

			renderer.setOptions({
				draggable: true,
				suppressMarkers: false,
				markerOptions: {
					draggable: false,
					icon: {
						path: window.google.maps.SymbolPath.CIRCLE,
						scale: 7,
						fillOpacity: 1,
						strokeWeight: 2,
						fillColor: "#3b82f6",
						strokeColor: "#ffffff",
					},
				},
				polylineOptions: {
					strokeColor: polylineConfigs.strokeColor,
					zIndex: 10,
					strokeWeight: 8,
					strokeOpacity: 1,
				},
				directions: renderer.getDirections() || null,
				map,
			});
		}
	}, [
		handleEdit,
		location.id,
		renderer,
		directionsService,
		polylineConfigs.strokeColor,
		map,
	]);

	const handleFinishEditing = useCallback(() => {
		if (directionsService && renderer) {
			renderer.setMap(null);

			renderer.setOptions({
				draggable: false,
				suppressMarkers: true,
				polylineOptions: polylineConfigs,
				directions: undefined,
			});
			if (isOriginPoint(location) || !locations || !origin || !origin) return;

			const previousElement =
				locations?.find((item) => item.id === location.comesFrom) || origin;

			directionsService
				.route({
					origin: previousElement.location,
					destination: location.location,
					waypoints: waypoints.map((waypoint) => {
						return {
							stopover: false,
							location: waypoint,
						};
					}),
					travelMode: google.maps.TravelMode.DRIVING,
				})
				.then((response) => {
					setRoutes([]);
					clearRenderer(location.id);
					finishEditing(response);
				})
				.catch((error) => console.error("Route error:", error));
		}
	}, [
		directionsService,
		renderer,
		polylineConfigs,
		location,
		locations,
		origin,
		waypoints,
		clearRenderer,
		finishEditing,
	]);

	const handleCancelEditing = useCallback(
		(cleanAll: boolean) => {
			if (listenerRef.current) {
				google.maps.event.removeListener(listenerRef.current);
			}
			if (isOriginPoint(location) || !locations || !origin || !origin) return;

			const previousElement =
				locations?.find((item) => item.id === location.comesFrom) || origin;

			clearRenderer(location.id);
			if (cleanAll) {
				if (directionsService) {
					directionsService
						.route({
							origin: previousElement.location,
							destination: location.location,
							waypoints: [],
							travelMode: google.maps.TravelMode.DRIVING,
						})
						.then((response) => {
							finishEditing(response);
						})
						.catch((error) => console.error("Route error:", error));
				}
			} else {
				finishEditing(location.route.directionsResponse);
			}
		},
		[
			clearRenderer,
			directionsService,
			finishEditing,
			location,
			locations,
			origin,
		],
	);

	useEffect(() => {
		if (!routesLibrary || !map) return;
		setDirectionsService(new routesLibrary.DirectionsService());
	}, [routesLibrary, map]);

	useEffect(() => {
		if (!isLoading && !isInEditMode) {
			clearRenderer(location.id);
			drawLine(waypoints);
		}
	}, [
		drawLine,
		waypoints,
		isInEditMode,
		location.id,
		clearRenderer,
		isLoading,
	]);

	const SKIP_ORIGIN_AND_ZERO = 2;

	return (
		<div className="select-none">
			<div className="h-16 w-full flex gap-4 items-center">
				<div className="w-0 h-full border-1 ml-7 border-dashed border-zinc-400" />
				<div className="w-full flex gap-4 items-center justify-start">
					<div className="flex gap-2 items-center">
						<AnimatePresence>
							<Button
								className={cn(
									"not-disabled:hover:cursor-pointer disabled:cursor-not-allowed",
									isInEditMode &&
										editingId === location.id &&
										"text-red-500 hover:text-red-500 transition-colors hover:ring-red-500 hover:ring-1 hover:bg-red-100",
								)}
								variant={"outline"}
								disabled={
									(isInEditMode && editingId !== location.id) || isSending
								}
								size={"sm"}
								onClick={() => {
									if (!isInEditMode) handleStartEditing();
									if (isInEditMode) handleCancelEditing(true);
								}}
							>
								<motion.span
									key={`editing:${location.id}-${location.id === editingId}`}
									initial={{ y: -10, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -10, opacity: 0 }}
								>
									{isInEditMode && editingId === location.id ? (
										<TrashIcon className="size-4 " />
									) : (
										<PencilIcon className="size-4 " />
									)}
								</motion.span>
							</Button>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							{isInEditMode && editingId === location.id && (
								<motion.div
									key="edit-buttons"
									initial={{ x: -30, opacity: 0, pointerEvents: "none" }}
									animate={{ x: 0, opacity: 1, pointerEvents: "all" }}
									exit={{ x: -30, opacity: 0, pointerEvents: "none" }}
									className="flex gap-2 items-center relative"
								>
									<Button
										asChild
										onClick={() => {
											handleCancelEditing(false);
										}}
										variant={"outline"}
										size={"sm"}
										className="text-slate-500 hover:text-slate-500 transition-colors hover:outline-slate-500 hover:outline-1 hover:bg-slate-100 not-disabled:hover:cursor-pointer"
									>
										<motion.button onClick={() => {}}>
											<UndoIcon />
										</motion.button>
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
						<AnimatePresence mode="wait">
							{isInEditMode && editingId === location.id && (
								<motion.div
									key="edit-buttons"
									initial={{ x: -60, opacity: 0, pointerEvents: "none" }}
									animate={{ x: 0, opacity: 1, pointerEvents: "all" }}
									exit={{ x: -60, opacity: 0, pointerEvents: "none" }}
									className="flex gap-2 items-center relative"
								>
									<Button
										asChild
										onClick={() => {
											handleFinishEditing();
										}}
										variant={"outline"}
										size={"sm"}
										className="text-green-500 hover:text-green-500 transition-colors hover:outline-green-500 hover:outline-1 hover:bg-green-100 not-disabled:hover:cursor-pointer"
									>
										<motion.button onClick={() => {}}>
											<Check />
										</motion.button>
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<AnimatePresence mode="wait">
						{isInEditMode && editingId === location.id && (
							<motion.p
								key="editing-text"
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{
									opacity: 0,
									y: 5,
									transition: { delay: 0.3, duration: 0.2 },
								}}
								className="text-xs text-muted-foreground"
							>
								Reordenando...
							</motion.p>
						)}
						{isInEditMode && editingId === location.id && (
							<motion.p
								key="editing-text"
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{
									opacity: 0,
									y: 5,
									transition: { delay: 0.3, duration: 0.2 },
								}}
								className="text-xs text-muted-foreground"
							>
								Editando...
							</motion.p>
						)}
						{editingId !== location.id && (
							<motion.div
								key="infos"
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{
									opacity: 0,
									y: 5,
									transition: { delay: 0.3, duration: 0.2 },
								}}
								transition={{ duration: 0.2 }}
								className="flex gap-4"
							>
								<div className="text-xs flex flex-wrap">
									<p className="text-muted-foreground">Dist.:</p>
									<p>{leg?.distance?.text}</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
			<div
				className={cn(
					"w-full flex items-center gap-2 py-2 pl-4 border border-muted-foreground rounded-lg min-h-20",
				)}
			>
				{isFinalDestinationPoint(location) && (
					<MapPinCheckIcon className="size-4 cursor-default" />
				)}
				{isPickUpPoint(location) && <ContainerIcon />}
				{isDropOffPoint(location) && !isFinalDestinationPoint(location) && (
					<PackageOpenIcon />
				)}
				<div className="flex items-start justify-start flex-1 gap-1">
					<p className="whitespace-normal font-semibold text-sm">
						{index + SKIP_ORIGIN_AND_ZERO} -
					</p>
					<div className="flex flex-col gap-1 flex-1">
						<p className="whitespace-normal flex-1 font-semibold text-sm">
							{location.name}
						</p>
						<p className="text-xs text-muted-foreground">
							{location.address.neighborhood
								? `${location.address.neighborhood}, `
								: ""}
							{location.address.city} - {location.address.state}
						</p>
					</div>
				</div>

				{!isFinalDestinationPoint(location) && (
					<div className="flex gap-2 items-center flex-col pr-2">
						<Button
							variant={"outline"}
							size={"sm"}
							className="not-disabled:hover:cursor-pointer"
							onClick={() => movePoint("up", location.id)}
							disabled={isInEditMode || index === 0 || isSending}
						>
							<ArrowUpIcon
								className={cn("size-4", isInEditMode && "cursor-not-allowed")}
							/>
						</Button>
						<Button
							variant={"outline"}
							size={"sm"}
							className="not-disabled:hover:cursor-pointer"
							onClick={() => movePoint("down", location.id)}
							disabled={
								isInEditMode ||
								(locations
									? index === locations.length - 2 &&
										(isFinalDestinationPoint(locations[locations.length - 1]) ??
											false)
									: false) ||
								isSending
							}
						>
							<ArrowDownIcon
								onPointerDown={async () => {}}
								className={cn("size-4", isInEditMode && "cursor-not-allowed")}
							/>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
