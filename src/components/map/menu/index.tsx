import { MenuFooter } from "@/components/map/menu/footer";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
// import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMapRoutes } from "@/contexts/map-routes-context";
import { ContainerIcon } from "lucide-react";
import { MenuItem } from "./item";

export function MapMenu() {
	const { locations, isLoading, origin } = useMapRoutes();
	return (
		<Card className="absolute z-10 w-xl left-5 top-1/2 -translate-y-1/2 h-9/10 flex flex-col overflow-hidden">
			<CardHeader>
				<CardTitle>Planejamento de viagem</CardTitle>
				<CardDescription className="text-justify">
					A rota inicial foi calculada para usar as menores distâncias possíveis
					entre os pontos. Caso queira alterar a ordem das entregas, clique nos
					botões com as setas. Caso queira alterar o caminho entre dois pontos,
					clique no botão editar.
				</CardDescription>
			</CardHeader>
			{isLoading && (
				<p className="text-muted-foreground text-sm flex-1 px-6">
					Carregando...
				</p>
			)}
			{!isLoading && (
				<CardContent className="flex-1 overflow-hidden w-full">
					<ScrollArea
						className="h-full relative flex flex-col gap-2 pr-3"
						type="hover"
					>
						{origin && (
							<div className="flex gap-2 items-center text-nowrap whitespace-nowrap truncate text-ellipsis pb-4 h-20 py-2 pl-4 border border-muted-foreground rounded-lg">
								<ContainerIcon className="size-6" />
								<div className="flex items-start justify-start flex-1 gap-1">
									<p className="whitespace-normal font-semibold text-sm">1 -</p>
									<div className="flex flex-col gap-1 flex-1">
										<p className="whitespace-normal flex-1 font-semibold text-sm">
											{origin.name}
										</p>
										<p className="text-xs text-muted-foreground">
											<p className="text-xs">
												{origin.address.neighborhood
													? `${origin.address.neighborhood}, `
													: ""}
												{origin.address.city} - {origin.address.state}
											</p>
										</p>
									</div>
								</div>
							</div>
						)}
						{locations?.map((point, index) => (
							<MenuItem index={index} location={point} key={point.id} />
						))}
					</ScrollArea>
				</CardContent>
			)}
			<MenuFooter />
		</Card>
	);
}
