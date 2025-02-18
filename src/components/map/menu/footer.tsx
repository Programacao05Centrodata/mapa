import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Trash2Icon } from "lucide-react";

interface FooterButton {
	disabled: boolean;
	callback: () => void
}

interface IMenuFooterProps {
	redefine: FooterButton;
	save: FooterButton;
	drawWithNewOrder: FooterButton;
}

export function MenuFooter({
	drawWithNewOrder,
	redefine,
	save,
}: IMenuFooterProps) {
	return (
		<CardFooter className="flex flex-col gap-4 justify-self-end ">
			<Button
				type="button"
				onClick={() => drawWithNewOrder.callback()}
				disabled={drawWithNewOrder.disabled}
				variant={"outline"}
				className="not-disabled:hover:cursor-pointer w-full"
			>
				Traçar Rota Reoordenada
			</Button>
			<div className="w-full flex gap-2">
				<Button
					onClick={() => redefine.callback()}
					disabled={redefine.disabled}
					variant={"destructive"}
					className="not-disabled:hover:cursor-pointer"
				>
					Redefinir <Trash2Icon />
				</Button>
				<Button
					onClick={() => save.callback()}
					disabled={save.disabled}
					className="w-full not-disabled:hover:cursor-pointer"
					type="submit"
				>
					Salvar
				</Button>
			</div>
		</CardFooter>
	);
}
