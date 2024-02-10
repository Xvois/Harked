import React, {PropsWithChildren} from "react";
import {DialogProps, GenericDialog} from "@/Components/GenericDialog";


type MultistageModalProps = {
    children: React.ReactNode;
    dialogProps: DialogProps[]
}

export const MultistageDialog = ({children, ...props}: PropsWithChildren<MultistageModalProps>) => {
    const {dialogProps} = props;
    const childrenArray = React.Children.toArray(children);
    const [currentStage, setCurrentStage] = React.useState(0);


    return (
        <GenericDialog {...dialogProps[currentStage]}
                       actionDescription={dialogProps[currentStage].actionDescription ? dialogProps[currentStage].actionDescription : 'Next'}
                       action={
                           dialogProps[currentStage].action ?
                               dialogProps[currentStage].action
                               :
                               currentStage < childrenArray.length ?
                                   () => setCurrentStage((curr) => curr + 1)
                                   :
                                   null
                       }
                       alternateActionDescription={'Back'}
                       alternateAction={currentStage > 0 ? () => setCurrentStage((curr) => curr - 1) : null}>
            {childrenArray[currentStage]}
        </GenericDialog>
    )
}