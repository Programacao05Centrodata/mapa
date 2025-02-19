import { PoiMarkers } from "@/components/map/markers";
import { useMapRoutes } from "@/contexts/map-routes-context";
import { Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { MapMenu } from "./menu";

export interface IHandleMovedVertexPositionProps {
	coordinates: google.maps.LatLngLiteral;
}

export function MapComponent() {
	const map = useMap();
	const { locations, origin } = useMapRoutes();

	const [isFirstRender, setIsFirstRender] = useState(true);

	useEffect(() => {
		if (map && locations && locations.length > 0 && origin && isFirstRender) {
			const bounds = new google.maps.LatLngBounds();

			bounds.extend(
				new window.google.maps.LatLng(origin.location.lat, origin.location.lng),
			);

			for (const marker of locations) {
				bounds.extend(
					new window.google.maps.LatLng(
						marker.location.lat,
						marker.location.lng,
					),
				);
			}

			map.fitBounds(bounds, { left: 380, bottom: 20, right: 20, top: 20 });
			setIsFirstRender(false);
		}
	}, [map, locations, origin, isFirstRender]);

	return (
		<div className="relative h-screen w-screen">
			<MapMenu />
			<GoogleMap
				mapId={"map"}
				defaultZoom={13}
				defaultCenter={
					origin?.location || {
						lat: -27.24009213432068,
						lng: -48.63320378854962,
					}
				}
				gestureHandling={"greedy"}
				disableDefaultUI={true}
				className="h-full w-full"
			>
				{locations && origin && <PoiMarkers points={[origin, ...locations]} />}
			</GoogleMap>
		</div>
	);
}

export function RouteMap() {
	return <MapComponent />;
}
