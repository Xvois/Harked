import React from "react";
import {Separator} from "@/Components/ui/separator";


export const SectionWrapper = ({children, ...props}: {
    children: React.ReactNode,
    title: string,
    description: string
}) => {
    return (
        <section className={"w-screen max-w-screen-lg"}>
            <div className={"my-4"}>
                <h2 className={"text-2xl font-bold"}>{props.title}</h2>
                <p className={"text-sm text-muted-foreground"}>{props.description}</p>
                <Separator className={"my-4"}/>
            </div>
            {children}
        </section>
    )
}