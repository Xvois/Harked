import React from "react";
import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import {ValueIndicator} from "../JS/SharedComponents";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/ValueIndicator">
                <ValueIndicator/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;