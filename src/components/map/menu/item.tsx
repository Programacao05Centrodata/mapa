import type { IPath, Point } from "@/components/map/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, EqualIcon, PencilIcon, Undo, XIcon } from "lucide-react";
import { AnimatePresence, Reorder, useDragControls } from "motion/react";
import { useCallback, useState } from "react";
import { motion } from "motion/react";

interface IMenuItem {
	location: Point;
	path: IPath | null;
	isDragActive: null | boolean;
	draggable?: boolean;
	onDragStart: () => void;
	onDragEnd: () => void;
}

export function MenuItem({
	location,
	path,
	isDragActive,
	draggable = true,
	onDragEnd,
	onDragStart,
}: IMenuItem) {
	const controls = useDragControls();
	const [isEditing, setIsEditing] = useState(false);

	const handleFinishEditing = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleCancelEditing = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleUndo = useCallback(() => {
		setIsEditing(false);
	}, []);

	return (
		<div className="select-none">
			<div className="h-12 w-full flex gap-4 items-center">
				<div className="w-0 h-full border-1 ml-1.5 border-dashed border-zinc-400" />
				<div className="w-full flex gap-4 items-center justify-start">
					<div className="flex gap-2 items-center">
						<AnimatePresence>
							<Button
								className="not-disabled:hover:cursor-pointer"
								variant={"outline"}
								size={"sm"}
								onClick={() => {
									if (!isEditing) setIsEditing((prev) => !prev);
									if (isEditing) handleUndo();
								}}
							>
								<motion.span
									key={`editing:${isEditing}-${location.id}`}
									initial={{ y: -10, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -10, opacity: 0 }}
								>
									{isEditing ? (
										<Undo className="size-4" />
									) : (
										<PencilIcon className="size-4 " />
									)}
								</motion.span>
							</Button>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							{isEditing && (
								<motion.div
									key="edit-buttons"
									initial={{ x: -30, opacity: 0, pointerEvents: "none" }}
									animate={{ x: 0, opacity: 1, pointerEvents: "all" }}
									exit={{ x: -30, opacity: 0, pointerEvents: "none" }}
									className="flex gap-2 items-center relative"
								>
									<Button
										asChild
										variant={"outline"}
										size={"sm"}
										className="text-red-500 hover:text-red-500 transition-colors hover:ring-red-500 hover:ring-1 hover:bg-red-100 not-disabled:hover:cursor-pointer"
									>
										<motion.button onClick={handleCancelEditing}>
											<XIcon />
										</motion.button>
									</Button>
									<Button
										asChild
										variant={"outline"}
										size={"sm"}
										className="text-green-500 hover:text-green-500 transition-colors hover:outline-green-500 hover:outline-1 hover:bg-green-100 not-disabled:hover:cursor-pointer"
									>
										<motion.button onClick={handleFinishEditing}>
											<Check />
										</motion.button>
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<AnimatePresence mode="wait">
						{isEditing ? (
							<motion.p
								key="editing-text"
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{
									opacity: 0,
									y: 5,
									transition: { delay: 0.3, duration: 0.2 },
								}}
							>
								Editando...
							</motion.p>
						) : (
							<motion.div
								key="infos"
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{
									opacity: 0,
									y: 5,
									transition: { delay: 0.3, duration: 0.2 },
								}}
								transition={{ duration: 0.2 }}
								className="flex gap-4"
							>
								<div className="text-xs flex flex-wrap">
									<p className="text-muted-foreground">Dist.:</p>
									<p>{path?.localizedValues?.distance.text}</p>
								</div>
								<div className="text-xs flex flex-wrap">
									<p className="text-muted-foreground">Tempo est.:</p>
									<p>{path?.localizedValues?.duration.text}</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
			<Reorder.Item
				drag={draggable}
				value={location}
				dragListener={false}
				dragControls={controls}
				onDragStart={() => onDragStart()}
				onDragEnd={() => onDragEnd()}
				className={cn(
					"w-full relative flex items-center gap-2 font-bold  py-4",
					isDragActive === false ? "opacity-50" : null,
				)}
			>
				<EqualIcon
					onPointerDown={(e) => controls.start(e)}
					className={cn(
						"size-4",
						draggable
							? isDragActive
								? "cursor-grabbing"
								: "cursor-grab"
							: "cursor-default",
					)}
				/>
				<p className=" text-nowrap whitespace-nowrap truncate text-ellipsis">
					{location.name}
				</p>
			</Reorder.Item>
		</div>
	);
}
