import React, {useState} from "react";
import {UserContainer} from "./UserContainer";

export function TopContainer() {

    return (
        <div className={"flex flex-col"}>
            <UserContainer/>
        </div>
    );
}