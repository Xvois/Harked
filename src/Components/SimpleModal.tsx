import React, {ReactElement, SetStateAction, useEffect, useRef} from "react";
import ReactDOM from "react-dom";

export const SimpleModal = (props: {
    id: string,
    showModal: boolean,
    setShowModal: React.Dispatch<SetStateAction<boolean>>,
    children: ReactElement
}) => {
    const {id, showModal, setShowModal, children} = props;
    const elRef = useRef(null);

    if (!elRef.current) {
        const div = document.createElement('div');
        div.id = id;
        elRef.current = div;
    }

    useEffect(() => {
        const modalRoot = document.getElementById('modal-root');
        const currentEl = elRef.current;

        if (showModal) {
            modalRoot.appendChild(currentEl);
        } else {
            modalRoot.removeChild(currentEl);
        }

        return () => {
            modalRoot.removeChild(currentEl);
        };
    }, [showModal]);

    return ReactDOM.createPortal(
        <>
            <button className={'modal-exit-button'} onClick={() => setShowModal(false)}>x</button>
            {children}
        </>,
        elRef.current
    );
}