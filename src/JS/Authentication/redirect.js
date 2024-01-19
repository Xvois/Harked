import {useNavigate} from "react-router-dom";

export const useRedirect = () => {
    const navigate = useNavigate();
    return (path, refresh = false) => {
        if (refresh) {
            window.location.href = path;
        } else {
            navigate(path);
        }
    };
};