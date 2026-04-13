import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const BLOCKED_ROLES = ["admin", "staff", "technician"];
const USER_SITE_ONLY_ERROR =
    "Admin, staff, and technician accounts cannot login to the user site.";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            const userData = response.data;
            if (BLOCKED_ROLES.includes(userData?.role)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
                setError(USER_SITE_ONLY_ERROR);
                return;
            }
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;
            if (BLOCKED_ROLES.includes(user?.role)) {
                throw new Error(USER_SITE_ONLY_ERROR);
            }
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (error) {
            throw error.response?.data?.error || error.message || 'Registration failed';
        }
    };
    
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            if (BLOCKED_ROLES.includes(user?.role)) {
                throw new Error(USER_SITE_ONLY_ERROR);
            }
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (error) {
            throw error.response?.data?.error || error.message || 'Login failed';
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            register,
            login,
            logout,
            isAdmin,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};