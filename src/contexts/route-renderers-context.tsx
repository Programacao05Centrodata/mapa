import type React from "react";
import { createContext, useContext, useRef } from "react";

type RendererMap = Map<number, google.maps.DirectionsRenderer>;

interface IRouteRenderersContextData {
	getRenderer: (id: number) => google.maps.DirectionsRenderer | undefined;
	setRenderer: (id: number, renderer: google.maps.DirectionsRenderer) => void;
	clearRenderer: (id: number) => void;
	clearAllRenderers: () => void;
}

const RouteRenderersContext = createContext<IRouteRenderersContextData | null>(
	null,
);

export const RouteRenderersProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const rendererMapRef = useRef<RendererMap>(new Map());

	const getRenderer = (id: number) => rendererMapRef.current.get(id);

	const setRenderer = (
		id: number,
		renderer: google.maps.DirectionsRenderer,
	) => {
		rendererMapRef.current.set(id, renderer);
	};

	const clearRenderer = (id: number) => {
		rendererMapRef.current.get(id)?.setMap(null);
		rendererMapRef.current.delete(id);
	};

	const clearAllRenderers = () => {
		for (const renderer of rendererMapRef.current.values()) {
			renderer.setMap(null);
		}
		rendererMapRef.current.clear();
	};

	return (
		<RouteRenderersContext.Provider
			value={{ getRenderer, setRenderer, clearRenderer, clearAllRenderers }}
		>
			{children}
		</RouteRenderersContext.Provider>
	);
};

export function useRouteRenderers() {
	const context = useContext(RouteRenderersContext);
	if (!context) {
		throw new Error(
			"useRouteRenderers must be used within a RouteRenderersProvider",
		);
	}
	return context;
}
