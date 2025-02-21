import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
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
import { Trash2Icon } from "lucide-react";

interface FooterButton {
	disabled: boolean;
	callback: () => void;
}

interface IMenuFooterProps {
	redefine: FooterButton;
	save: FooterButton;
}

export function MenuFooter({ redefine, save }: IMenuFooterProps) {
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
							onClick={() => redefine.callback()}
							className="not-disabled:hover:cursor-pointer"
						>
							Continuar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
				<div className="w-full flex gap-2">
					<AlertDialogTrigger asChild>
						<Button
							disabled={redefine.disabled}
							variant={"destructive"}
							className="not-disabled:hover:cursor-pointer"
						>
							Redefinir <Trash2Icon />
						</Button>
					</AlertDialogTrigger>
					<Button
						onClick={() => save.callback()}
						disabled={save.disabled}
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
