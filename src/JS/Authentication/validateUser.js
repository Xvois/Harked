
export const validateUser = async () => {
    if (window.localStorage.getItem("pocketbase_auth")) {
        console.info('Validating user...');
        const authData = JSON.parse(window.localStorage.getItem("pocketbase_auth"));
        const user = authData.model;
        const exists = !!(await getLocalDataByID("users", user.id));
        if (!exists) {
            console.warn('User invalid. Logging out...');
            window.localStorage.clear();
            window.location.href = '/';
        } else {
            console.info('User is valid.')
        }
    }
}