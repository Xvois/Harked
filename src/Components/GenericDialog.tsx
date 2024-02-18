import React, {PropsWithChildren} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/Components/ui/dialog";
import {Button} from "@/Components/ui/button";

export type DialogProps = {
    trigger: React.ReactNode;
    title: string;
    description: string;
    actionDescription?: string;
    action?: () => void | null;
    alternateActionDescription?: string;
    alternateAction?: () => void | null;
    submissionCondition?: boolean;
}

export const GenericDialog = ({children, submissionCondition = true, ...props}: PropsWithChildren<DialogProps>) => {

    const handleSubmission = (e: React.FormEvent) => {
        console.log('handling submission');
        if (props.action) {
            e.preventDefault()
            props.action();
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {props.trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogDescription>
                        {props.description}
                    </DialogDescription>
                </DialogHeader>
                {children}
                <DialogFooter className={"gap-4 sm:gap-0"}>
                    {props.alternateAction &&
                        <Button variant="outline"
                                onClick={props.alternateAction}>{props.alternateActionDescription}</Button>
                    }
                    <Button
                        disabled={!submissionCondition}
                        onClick={handleSubmission}>{props.actionDescription ? props.actionDescription : 'Done'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}