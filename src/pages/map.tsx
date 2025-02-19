import { RouteMap } from "@/components/map";
import { MapRoutesProvider } from "@/contexts/map-routes-context";
import { RouteRenderersProvider } from "@/contexts/route-renderers-context";
import { APIProvider } from "@vis.gl/react-google-maps";

export default function MapPage() {
	return (
		<APIProvider apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY}>
			<RouteRenderersProvider>
				<MapRoutesProvider>
					<div className="relative">
						<RouteMap />
					</div>
				</MapRoutesProvider>
			</RouteRenderersProvider>
		</APIProvider>
	);
}
