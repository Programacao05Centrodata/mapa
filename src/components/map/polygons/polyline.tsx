import {
	forwardRef,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";

import { GoogleMapsContext, useMapsLibrary } from "@vis.gl/react-google-maps";

import type { Ref } from "react";
import type { IHandleMovedVertexPositionProps } from "@/components/map";

type PolylineEventProps = {
	onClick?: (e: google.maps.MapMouseEvent) => void;
	onDrag?: (e: google.maps.MapMouseEvent) => void;
	onDragStart?: (e: google.maps.MapMouseEvent) => void;
	onDragEnd?: (e: google.maps.MapMouseEvent) => void;
	onMouseOver?: (e: google.maps.MapMouseEvent) => void;
	onMouseOut?: (e: google.maps.MapMouseEvent) => void;
	onMovedVertexPosition?: (props: IHandleMovedVertexPositionProps) => void;
};

type PolylineCustomProps = {
	/**
	 * polyline is an encoded string for the path, will be decoded and used as a path
	 */
	encodedPath?: string;
};

export type PolylineProps = google.maps.PolylineOptions &
	PolylineEventProps &
	PolylineCustomProps;

export type PolylineRef = Ref<google.maps.Polyline | null>;

function usePolyline(props: PolylineProps) {
	const {
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
		onMouseOver,
		onMouseOut,
		onMovedVertexPosition,
		encodedPath,
		...restOptions
	} = props;
	const polylineOptions = restOptions;
	// polyline is here to avoid triggering the useEffect below when the callbacks change (which happen if the user didn't memoize them)
	const callbacks = useRef<Record<string, (e: unknown) => void>>({});
	Object.assign(callbacks.current, {
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
		onMouseOver,
		onMouseOut,
	});

	const geometryLibrary = useMapsLibrary("geometry");

	const polyline = useRef(new google.maps.Polyline()).current;
	// update PolylineOptions (note the dependencies aren't properly checked
	// here, we just assume that setOptions is smart enough to not waste a
	// lot of time updating values that didn't change)
	useMemo(() => {
		polyline.setOptions(polylineOptions);
	}, [polyline, polylineOptions]);

	const map = useContext(GoogleMapsContext)?.map;

	// update the path with the encodedPath
	useMemo(() => {
		if (!encodedPath || !geometryLibrary) return;
		const path = geometryLibrary.encoding.decodePath(encodedPath);
		polyline.setPath(path);
	}, [polyline, encodedPath, geometryLibrary]);

	// create polyline instance and add to the map once the map is available
	useEffect(() => {
		if (!map) {
			if (map === undefined)
				console.error("<Polyline> has to be inside a Map component.");

			return;
		}

		polyline.setMap(map);

		return () => {
			polyline.setMap(null);
		};
	}, [map, polyline]);

	// attach and re-attach event-handlers when any of the properties change
	useEffect(() => {
		if (!polyline) return;

		// Add event listeners
		const gme = google.maps.event;
		for (const [eventName, eventCallback] of [
			["click", "onClick"],
			["drag", "onDrag"],
			["dragstart", "onDragStart"],
			["dragend", "onDragEnd"],
			["mouseover", "onMouseOver"],
			["mouseout", "onMouseOut"],
		]) {
			gme.addListener(polyline, eventName, (e: google.maps.MapMouseEvent) => {
				const callback = callbacks.current[eventCallback];
				if (callback) callback(e);
			});
		}

		return () => {
			gme.clearInstanceListeners(polyline);
		};
	}, [polyline]);

	useEffect(() => {
		if (!polyline || !onMovedVertexPosition) return;

		const gme = google.maps.event;
		const path = polyline.getPath();

		// Add listener to the path's "set_at" event
		const listener = gme.addListener(path, "set_at", (index: number) => {
			const movedVertex = path.getAt(index);
			onMovedVertexPosition({ coordinates: movedVertex.toJSON() }); // No need to call setAt
		});

		const addHighlight = gme.addListener(polyline, "mouseover", () => {
			polyline.setOptions({
				strokeWeight: 4,
				strokeColor: polylineOptions.strokeColor,
				zIndex: 100,
			});
		});
		
		const removeHighlight = gme.addListener(polyline, "mouseout", () => {
			polyline.setOptions({
				strokeWeight: polylineOptions.strokeWeight,
				strokeColor: polylineOptions.strokeColor,
				zIndex: 1,
			});
		});

		// Cleanup: Remove the specific listener from the path
		return () => {
			gme.removeListener(listener);
			gme.removeListener(addHighlight);
			gme.removeListener(removeHighlight);
		};
	}, [polyline, onMovedVertexPosition, polylineOptions]); // Ensure dependencies are stable

	return polyline;
}

/**
 * Component to render a polyline on a map
 */
export const Polyline = forwardRef((props: PolylineProps, ref: PolylineRef) => {
	const polyline = usePolyline(props);

	useImperativeHandle(ref, () => polyline, [polyline]);

	return null;
});
