import { Reorder } from "motion/react";
import { useCallback, useState, useEffect } from "react";
import { MenuItem } from "./item";
import {
	isDropOffPoint,
	isPickUpPoint,
	type DropOffPoint,
	type IPath,
	type PickUpPoint,
	type Point,
} from "../types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MenuFooter } from "@/components/map/menu/footer";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageOpenIcon } from "lucide-react";
interface IMapMenuProps {
	origin: PickUpPoint | null;
	destination: DropOffPoint | null;
	locations: Point[];
	paths: IPath[];
	isLoadingPaths: boolean;
	isLoadingMarkers: boolean;
	getBestRoute: () => void | Promise<void>;
	reorderCallback: (newOrder: Point[]) => Promise<void>;
}

export function MapMenu({
	origin,
	destination,
	locations,
	paths,
	isLoadingPaths,
	getBestRoute,
	reorderCallback,
}: IMapMenuProps) {
	const [locationsOrder, setLocationsOrder] = useState(locations);
	const [draggingIndex, setDraggingIndex] = useState<null | number>(null);
	const [orderIsDirty, setOrderIsDirty] = useState(false);

	const handleReorder = useCallback(
		(newOrder: Point[]) => {
			if (draggingIndex === null || isLoadingPaths) return;

			setOrderIsDirty(true);

			const draggingElement = locationsOrder[draggingIndex];
			
			const newIndex = newOrder.findIndex(
				(location) => location.id === draggingElement.id,
			);

			const isBeforePickUp = isDropOffPoint(draggingElement) ? draggingElement.pickedUpIn.every((pickUpId) => {
				const hasPickUpOutOfOrder = newOrder
					.slice(newIndex + 1)
					.some((afterElement) => {
						return (
							isPickUpPoint(afterElement) &&
							afterElement.id === pickUpId
						);
					});
				return hasPickUpOutOfOrder;
			}): false;

			const isAfterDropOff = isPickUpPoint(draggingElement) ? draggingElement.dropsOffIn.every((dropOffId) => {
				const hasPickUpOutOfOrder = newOrder
					.slice(0, newIndex)
					.some((beforeElement) => {
						return (
							isDropOffPoint(beforeElement) &&
							beforeElement.id === dropOffId
						);
					});
				return hasPickUpOutOfOrder;
			}): false;

			if (isBeforePickUp) {
				toast.error("Esta entrega não pode ser ordenada para antes de sua coleta")
				return
			}

			if (isAfterDropOff) {
				toast.error("Esta coleta não pode ser ordenado para depois de sua entrega")
				return
			}
			
			locationsOrder.splice(draggingIndex, 1);
			locationsOrder.splice(newIndex, 0, draggingElement);

			setLocationsOrder([...locationsOrder]);

			setDraggingIndex(newIndex);
		},
		[draggingIndex, locationsOrder, isLoadingPaths],
	);

	function handleDragStart(index: number) {
		setDraggingIndex(index);
	}

	const handleDragEnd = useCallback(async () => {
		setDraggingIndex(null);
	}, []);

	useEffect(() => {
		setLocationsOrder(locations);
		setOrderIsDirty(false);
	}, [locations]);

	return (
		<Card className="absolute z-10 max-w-md left-5 top-1/2 -translate-y-1/2 h-9/10 flex flex-col overflow-hidden">
			<CardHeader>
				<CardTitle>Planejamento de viagem</CardTitle>
				<CardDescription className="text-justify">
					A rota inicial foi calculada para usar as menores distâncias possíveis
					entre os pontos. Caso queira alterar a ordem das entregas, arraste e
					solte os itens abaixo. Caso queira alterar o caminho entre dois
					pontos, clique no caminho ou no botão editar ao lado da distância e do
					tempo estimado.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<Reorder.Group
						axis="y"
						as="div"
						values={locationsOrder}
						onReorder={handleReorder}
						className="flex flex-col gap-2 max-w-sm"
					>
						<div className="flex gap-2 items-center font-bold">
							<PackageOpenIcon className="size-4" />
							{origin?.name}
						</div>
						{locationsOrder.map((location, index) => (
							<MenuItem
								isDragActive={
									draggingIndex === null ? null : draggingIndex === index
								}
								onDragStart={() => {
									handleDragStart(index);
								}}
								onDragEnd={() => handleDragEnd()}
								path={paths[index] || null}
								location={location}
								key={location.id}
							/>
						))}
						{destination && (
							<MenuItem
								isDragActive={null}
								onDragStart={() => {}}
								draggable={false}
								onDragEnd={() => handleDragEnd()}
								path={paths[paths.length - 1]}
								location={destination}
							/>
						)}
					</Reorder.Group>
				</ScrollArea>
			</CardContent>
			<MenuFooter
				drawWithNewOrder={{
					callback: async () => {
						await reorderCallback(locationsOrder)
						setOrderIsDirty(false)
					},
					disabled: !orderIsDirty,
				}}
				redefine={{
					callback: async () => getBestRoute(),
					disabled: false,
				}}
				save={{
					callback: () => {
						toast.success("Salvo");
					},
					disabled: orderIsDirty,
				}}
			/>
		</Card>
	);
}
