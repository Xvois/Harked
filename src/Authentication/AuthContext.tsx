import React, {createContext, useContext, useEffect, useState} from 'react';
import {reAuthorise} from '@/Authentication/reAuth';
import {User} from "@/Tools/Interfaces/userInterfaces";
import {fetchSpotifyData} from "@/API/spotify";

interface AuthContextProps {
    user: User;
    isAuthenticated: boolean;
}

const AuthContext = createContext<Partial<AuthContextProps>>({});

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState<User>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const fetchAuthData = async () => {
            const accessToken = localStorage.getItem('access-token');
            if (!accessToken) {
                await reAuthorise();
            }
            const userData = await fetchSpotifyData<User>('me');
            if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        };
        fetchAuthData();
    }, []);

    return (
        <AuthContext.Provider value={{user, isAuthenticated}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);