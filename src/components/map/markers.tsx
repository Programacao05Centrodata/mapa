import {
	type Point,
	isDropOffPoint,
	isPickUpPoint,
} from "@/components/map/types";
import { Button } from "@/components/ui/button";
import {
	AdvancedMarker,
	InfoWindow,
	Pin,
	useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { XIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface IPoiMarkersProps {
	points: Point[];
	showOrder?: boolean;
}
interface IMarkerProps {
	point: Point;
	index: number;
}

const Marker = ({ point, index }: IMarkerProps) => {
	const [markerRef, marker] = useAdvancedMarkerRef();

	const [infoWindowShown, setInfoWindowShown] = useState(false);

	const handleMarkerClick = useCallback(
		() => setInfoWindowShown((isShown) => !isShown),
		[],
	);

	const handleClose = useCallback(() => setInfoWindowShown(false), []);

	return (
		<AdvancedMarker
			key={point.id}
			position={point.location}
			ref={markerRef}
			onClick={handleMarkerClick}
		>
			<Pin
				background={"#FBBC04"}
				glyphColor={"#000"}
				borderColor={"#000"}
				glyph={`${index + 1}`}
			/>
			{infoWindowShown && (
				<InfoWindow
					anchor={marker}
					onClose={handleClose}
					shouldFocus
					className="flex flex-col w-3xs gap-4"
					headerDisabled
				>
					<div className="flex items-center justify-between gap-2">
						<h2 className="text-sm font-semibold">
							{point.id} - {point.name}
						</h2>
						<Button
							variant={"ghost"}
							size={"sm"}
							onClick={handleClose}
							className="hover:cursor-pointer"
						>
							<XIcon className="size-3" />
						</Button>
					</div>
					<div className="gap-1 flex flex-col">
						<p>
							{point.address.route}, {point.address.number}
						</p>
						{isPickUpPoint(point) && (
							<div>
								<p>Ponto de coleta, entrega em:</p>
								<p className="font-semibold">{point.dropsOffIn.join(", ")}</p>
							</div>
						)}
						{isDropOffPoint(point) && (
							<div>
								<p>Ponto de entrega, coletado em:</p>
								<p className="font-semibold">{point.pickedUpIn.join(", ")}</p>
							</div>
						)}
					</div>
				</InfoWindow>
			)}
		</AdvancedMarker>
	);
};

export const PoiMarkers = ({ points }: IPoiMarkersProps) => {
	return (
		<>
			{points.map((poi: Point, index) => (
				<Marker point={poi} index={index} key={poi.id} />
			))}
		</>
	);
};
