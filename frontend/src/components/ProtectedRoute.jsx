import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
    CircularProgress,
    Box,
    Typography
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while AuthContext initializes
    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: '#020617'
            }}>
                <CircularProgress size={40} thickness={4} sx={{ mb: 2, color: '#3b82f6' }} />
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 1 }}>
                    SECURE CHANNEL INITIALIZING...
                </Typography>
            </Box>
        );
    }

    // Check if user is logged in
    if (!user) {
        console.warn('🚫 Unauthenticated access attempt to:', location.pathname);
        // Redirect to login, keeping track of where they tried to go
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Render protected content if authenticated
    return children;
};

export default ProtectedRoute;
