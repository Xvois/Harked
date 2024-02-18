import React from "react";
import {Progress} from "@/Components/ui/progress";

export const StatBlock = (props: {
    name: string,
    description: string,
    value: number,
}) => {
    const {name, description, value} = props;

    return (
        <div >
            <h3 className={"capitalize"}>{name}</h3>
            <Progress className={"relative h-2 z-10"}  value={value} />
            <p className={"text-sm text-muted-foreground"}>{description}</p>
        </div>
    )
}