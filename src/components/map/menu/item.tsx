import {
	isDropOffPoint,
	isPickUpPoint,
	type Point,
} from "@/components/map/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Check,
	ContainerIcon,
	EqualIcon,
	MapPinCheckIcon,
	PackageOpenIcon,
	PencilIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence, Reorder, useDragControls } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { IPathForService } from "@/components/map/helper";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

interface IMenuItem {
	index: number;
	location: Point;
	path: IPathForService;
	isDragActive: null | boolean;
	draggable?: boolean;
	onDragStart: () => void;
	onDragEnd: () => void;
}

const ROUTE_COLORS = [
	"#eab308",
	"#84cc16",
	"#14b8a6",
	"#06b6d4",
	"#ec4899",
	"#f97316",
	"#f43f5e",
	"#f59e0b",
	"#d946ef",
	"#3b82f6",
	"#0ea5e9",
	"#a855f7",
	"#6366f1",
	"#22c55e",
	"#10b981",
	"#ef4444",
	"#8b5cf6",
];

export function MenuItem({
	index,
	location,
	path,
	isDragActive,
	draggable = true,
	onDragEnd,
	onDragStart,
}: IMenuItem) {
	const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
	const polylineConfigs = useMemo(
		() => ({
			strokeColor: color,
			strokeWeight: 5,
			strokeOpacity: 0.75,
			zIndex: 1,
		}),
		[color],
	);
	const map = useMap();
	const routesLibrary = useMapsLibrary("routes");
	const [directionsService, setDirectionsService] =
		useState<google.maps.DirectionsService>();
	const [directionsRenderer, setDirectionsRenderer] =
		useState<google.maps.DirectionsRenderer>();
	const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
	const [directionsResponse, setDirectionsResponse] =
		useState<null | google.maps.DirectionsResult>(null);
	const selected = routes[0];
	const leg = selected?.legs[0];

	const [drewPath, setDrewPath] = useState<IPathForService>();

	const controls = useDragControls();
	const [isEditing, setIsEditing] = useState(false);

	const handleEdit = useCallback(() => {
		setIsEditing(true);

		if (directionsRenderer && directionsResponse) {
			directionsRenderer.setMap(null);
			setDirectionsRenderer(
				new google.maps.DirectionsRenderer({
					draggable: true,
					suppressMarkers: true,
					polylineOptions: {
						strokeColor: polylineConfigs.strokeColor,
						zIndex: 10,
						strokeWeight: 8,
						strokeOpacity: 1,
					},
					directions: directionsResponse,
					map,
				}),
			);
		}
	}, [directionsRenderer, map, directionsResponse, polylineConfigs]);

	const handleFinishEditing = useCallback(() => {
		setIsEditing(false);
		if (directionsRenderer && directionsService) {
			directionsRenderer.setMap(null);
			directionsService
				.route({
					origin: path.from.location,
					destination: path.to.location,
					waypoints: routes[0].legs[0].via_waypoints.map((waypoint) => {
						return {
							stopover: false,
							location: waypoint,
						};
					}),
					travelMode: google.maps.TravelMode.DRIVING,
				})
				.then((response) => {
					setDirectionsRenderer(
						new google.maps.DirectionsRenderer({
							draggable: false,
							suppressMarkers: true,
							directions: directionsResponse,
							polylineOptions: polylineConfigs,
							map,
						}),
					);
					setDirectionsResponse(response);
					setRoutes(response.routes);
				})
				.catch((error) => console.error("Route error:", error));
		}
	}, [
		directionsRenderer,
		directionsResponse,
		directionsService,
		map,
		path,
		routes,
		polylineConfigs,
	]);

	const handleCancelEditing = useCallback(() => {
		setIsEditing(false);
		if (directionsRenderer && directionsService) {
			directionsRenderer.setMap(null);
			directionsService
				.route({
					origin: path.from.location,
					destination: path.to.location,
					travelMode: google.maps.TravelMode.DRIVING,
				})
				.then((response) => {
					setDirectionsRenderer(
						new google.maps.DirectionsRenderer({
							draggable: false,
							suppressMarkers: true,
							directions: response,
							polylineOptions: polylineConfigs,
							map,
						}),
					);
					setDirectionsResponse(response);
					setRoutes(response.routes);
				})
				.catch((error) => console.error("Route error:", error));
		}
	}, [directionsRenderer, directionsService, map, path, polylineConfigs]);

	useEffect(() => {
		if (!directionsRenderer) return;

		const listener = directionsRenderer.addListener(
			"directions_changed",
			() => {
				const result = directionsRenderer.getDirections();
				if (result) {
					setRoutes(result.routes);
					setDirectionsResponse(result);
				}
			},
		);

		return () => {
			google.maps.event.removeListener(listener);
		};
	}, [directionsRenderer]);

	useEffect(() => {
		if (!routesLibrary || !map) return;
		setDirectionsService(new routesLibrary.DirectionsService());
		setDirectionsRenderer(
			new routesLibrary.DirectionsRenderer({
				preserveViewport: true,
				draggable: false,
				suppressMarkers: true,
				polylineOptions: polylineConfigs,
				map,
			}),
		);
	}, [routesLibrary, map, polylineConfigs]);

	const getInitialPaths = useCallback(() => {
		if (
			!directionsService ||
			!directionsRenderer ||
			(routes && routes.length > 0)
		)
			return;

		directionsService
			.route({
				origin: path.from.location,
				destination: path.to.location,
				travelMode: google.maps.TravelMode.DRIVING,
			})
			.then((response) => {
				directionsRenderer.setDirections(response);
				setDirectionsResponse(response);
				setRoutes(response.routes);
			})
			.catch((error) => console.error("Route error:", error));

		setDrewPath(path);
	}, [directionsService, directionsRenderer, path, routes]);

	useEffect(() => {
		if (!drewPath) return;

		const isPathEqualDrewPath =
			drewPath.from.id === path.from.id && drewPath.to.id === path.to.id;

		if (
			directionsRenderer &&
			directionsService &&
			!isPathEqualDrewPath &&
			isDragActive === null
		) {
			directionsRenderer.setMap(null);
			directionsService
				.route({
					origin: path.from.location,
					destination: path.to.location,
					waypoints: routes[0].legs[0].via_waypoints.map((waypoint) => {
						return {
							stopover: false,
							location: waypoint,
						};
					}),
					travelMode: google.maps.TravelMode.DRIVING,
				})
				.then((response) => {
					setDirectionsRenderer(
						new google.maps.DirectionsRenderer({
							preserveViewport: true,
							draggable: false,
							suppressMarkers: true,
							directions: directionsResponse,
							polylineOptions: { ...polylineConfigs, zIndex: 1 },
							map,
						}),
					);
					setDirectionsResponse(response);
					setRoutes(response.routes);
				})
				.catch((error) => console.error("Route error:", error));
		}
		setDrewPath(path);
	}, [
		directionsRenderer,
		directionsResponse,
		directionsService,
		drewPath,
		isDragActive,
		map,
		path,
		polylineConfigs,
		routes,
	]);

	useEffect(() => {
		getInitialPaths();
	}, [getInitialPaths]);

	useEffect(() => {
		console.log(selected.overview_polyline);
	}, [selected]);

	const SKIP_ORIGIN_AND_ZERO = 2;

	return (
		<div className="select-none">
			<div className="h-12 w-full flex gap-4 items-center">
				<div className="w-0 h-full border-1 ml-1.5 border-dashed border-zinc-400" />
				<div className="w-full flex gap-4 items-center justify-start">
					<div className="flex gap-2 items-center">
						<AnimatePresence>
							<Button
								className={cn(
									"not-disabled:hover:cursor-pointer",
									isEditing &&
										"text-red-500 hover:text-red-500 transition-colors hover:ring-red-500 hover:ring-1 hover:bg-red-100",
								)}
								variant={"outline"}
								size={"sm"}
								onClick={() => {
									if (!isEditing) handleEdit();
									if (isEditing) handleCancelEditing();
								}}
							>
								<motion.span
									key={`editing:${isEditing}-${location.id}`}
									initial={{ y: -10, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -10, opacity: 0 }}
								>
									{isEditing ? (
										<XIcon className="size-4 " />
									) : (
										<PencilIcon className="size-4 " />
									)}
								</motion.span>
							</Button>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							{isEditing && (
								<motion.div
									key="edit-buttons"
									initial={{ x: -30, opacity: 0, pointerEvents: "none" }}
									animate={{ x: 0, opacity: 1, pointerEvents: "all" }}
									exit={{ x: -30, opacity: 0, pointerEvents: "none" }}
									className="flex gap-2 items-center relative"
								>
									<Button
										asChild
										variant={"outline"}
										size={"sm"}
										className="text-green-500 hover:text-green-500 transition-colors hover:outline-green-500 hover:outline-1 hover:bg-green-100 not-disabled:hover:cursor-pointer"
									>
										<motion.button onClick={handleFinishEditing}>
											<Check />
										</motion.button>
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<AnimatePresence mode="wait">
						{isDragActive !== null && !isEditing && (
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
						{isEditing && (
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
						{!isEditing && isDragActive === null && (
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
								<div className="text-xs flex flex-wrap">
									<p className="text-muted-foreground">Tempo est.:</p>
									<p>{leg?.duration?.text}</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
			<Reorder.Item
				drag={draggable}
				value={location}
				dragListener={false}
				dragControls={controls}
				onDragStart={() => onDragStart()}
				onDragEnd={() => onDragEnd()}
				className={cn(
					"w-full relative flex items-center gap-2 font-bold  py-4",
					isDragActive === false ? "opacity-50" : null,
				)}
			>
				{draggable ? (
					<EqualIcon
						onPointerDown={(e) => controls.start(e)}
						className={cn(
							"size-4",
							isDragActive ? "cursor-grabbing" : "cursor-grab",
						)}
					/>
				) : (
					<MapPinCheckIcon className="size-4 cursor-default" />
				)}
				{isPickUpPoint(location) && <ContainerIcon />}
				{isDropOffPoint(location) && <PackageOpenIcon />}
				<p className=" text-nowrap whitespace-nowrap truncate text-ellipsis">
					{index + SKIP_ORIGIN_AND_ZERO} - {location.name}
				</p>
			</Reorder.Item>
		</div>
	);
}
