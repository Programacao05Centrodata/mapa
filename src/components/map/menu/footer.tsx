import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useMapRoutes } from "@/contexts/map-routes-context";
import { Trash2Icon } from "lucide-react";

export function MenuFooter() {
	const { saveRoute, isLoading, isSending, isInEditMode, resetToDefault } =
		useMapRoutes();

	return (
		<CardFooter className="flex flex-col	 justify-self-end ">
			<AlertDialog>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
						<AlertDialogDescription>
							Todas as alterações nesta rota serão descartadas. Esse processo
							não é reversível!
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="not-disabled:hover:cursor-pointer">
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => resetToDefault()}
							className="not-disabled:hover:cursor-pointer"
						>
							Continuar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
				<div className="w-full flex gap-2">
					<AlertDialogTrigger asChild>
						<Button
							disabled={isLoading || isInEditMode || isSending}
							variant={"destructive"}
							className="not-disabled:hover:cursor-pointer"
						>
							Redefinir <Trash2Icon />
						</Button>
					</AlertDialogTrigger>
					<Button
						onClick={() => saveRoute()}
						disabled={isLoading || isInEditMode || isSending}
						className="w-full not-disabled:hover:cursor-pointer"
						type="submit"
					>
						Salvar
					</Button>
				</div>
			</AlertDialog>
		</CardFooter>
	);
}
