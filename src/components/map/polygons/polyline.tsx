import {
	forwardRef,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";

import { GoogleMapsContext, useMapsLibrary } from "@vis.gl/react-google-maps";

import type { IHandleMovedVertexPositionProps } from "@/components/map";
import type { Ref } from "react";

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
	useMemo(() => {
		polyline.setOptions(polylineOptions);
	}, [polyline, polylineOptions]);

	const map = useContext(GoogleMapsContext)?.map;

	useMemo(() => {
		if (!encodedPath || !geometryLibrary) return;
		const path = geometryLibrary.encoding.decodePath(encodedPath);
		polyline.setPath(path);
	}, [polyline, encodedPath, geometryLibrary]);

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

	useEffect(() => {
		if (!polyline) return;

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

		const listener = gme.addListener(path, "set_at", (index: number) => {
			const movedVertex = path.getAt(index);
			onMovedVertexPosition({ coordinates: movedVertex.toJSON() });
		});

		const addHighlight = gme.addListener(polyline, "mouseover", () => {
			polyline.setOptions({
				strokeWeight: 5,
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

		return () => {
			gme.removeListener(listener);
			gme.removeListener(addHighlight);
			gme.removeListener(removeHighlight);
		};
	}, [polyline, onMovedVertexPosition, polylineOptions]);

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
