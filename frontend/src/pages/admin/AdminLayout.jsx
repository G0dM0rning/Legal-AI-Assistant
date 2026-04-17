import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    alpha,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert,
    Drawer
} from '@mui/material';

// Service layer
import { adminAPI } from '../../services/api';

// Modular components
import Sidebar from '../../components/admin/Sidebar';

const AUTO_REFRESH_INTERVAL = 60_000; // 60 seconds

const AdminLayout = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // UI State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Data State (Shared context for sub-routes)
    const [adminData, setAdminData] = useState({
        stats: {
            totalUsers: 0,
            totalDocuments: 0,
            trainingSessions: 0,
            systemHealth: 100
        },
        users: [],
        trainingHistory: [],
        systemStatus: {}
    });

    const fetchingRef = useRef(false);

    const fetchDashboardData = useCallback(async (isSilent = false) => {
        if (fetchingRef.current) return;

        const hasNoData = !adminData.stats.totalUsers && !adminData.trainingHistory.length;

        if (!isSilent && hasNoData) setInitialLoading(true);
        else setRefreshing(true);

        fetchingRef.current = true;
        setError(null);
        try {
            const [statsRes, historyRes, usersRes, statusRes] = await Promise.all([
                adminAPI.getDashboardStats(),
                adminAPI.getTrainingHistory(),
                adminAPI.getUsersList(),
                adminAPI.getAdminSystemStatus()
            ]);

            setAdminData(prev => ({
                stats: statsRes.success ? statsRes.data : prev.stats,
                trainingHistory: historyRes.success ? (historyRes.data.history || []) : [],
                users: usersRes.success ? (usersRes.data.users || []) : [],
                systemStatus: statusRes.success ? statusRes.data : {}
            }));

        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
            fetchingRef.current = false;
        }
    }, [adminData.stats.totalUsers, adminData.trainingHistory.length]);

    const contextValue = useMemo(() => ({
        adminData,
        fetchDashboardData
    }), [adminData, fetchDashboardData]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh data every 60 seconds (Silent)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    // Close mobile drawer on navigation
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    // Handlers
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/signin');
    };

    const currentTab = location.pathname.split('/').pop() || 'overview';

    const handleTabChange = (tabId) => {
        navigate(`/admin/${tabId}`);
    };

    // Derive system status label
    const systemOnline = adminData.systemStatus?.backend === 'online' && adminData.systemStatus?.database === 'online';
    const systemStatusLabel = systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM DEGRADED';
    const systemStatusColor = systemOnline ? '#10b981' : '#f59e0b';

    if (initialLoading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.palette.background.default }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
        );
    }

    const sidebarContent = (
        <Sidebar
            currentTab={currentTab}
            onTabChange={handleTabChange}
            onLogout={handleLogout}
            collapsed={isMobile ? false : sidebarCollapsed}
            setCollapsed={isMobile ? () => setMobileDrawerOpen(false) : setSidebarCollapsed}
        />
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
            {/* Desktop sidebar */}
            {!isMobile && sidebarContent}

            {/* Mobile drawer */}
            {isMobile && (
                <Drawer
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            bgcolor: theme.palette.background.paper,
                            borderRight: 'none',
                            width: 280
                        }
                    }}
                >
                    {sidebarContent}
                </Drawer>
            )}

            <Box sx={{
                flex: 1,
                p: { xs: 2, md: 4, lg: 6 },
                overflowY: 'auto'
            }}>
                <Container maxWidth="xl" sx={{ p: 0 }}>
                    <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                            {isMobile && (
                                <Typography
                                    onClick={() => setMobileDrawerOpen(true)}
                                    sx={{
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        letterSpacing: 1,
                                        mb: 1,
                                        '&:hover': { color: 'white' }
                                    }}
                                >
                                    ☰ MENU
                                </Typography>
                            )}
                            <Typography variant="overline" sx={{ color: theme.palette.primary.main, fontWeight: 800, letterSpacing: 2 }}>
                                Administrative Portal
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', letterSpacing: -1, mt: 1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                                {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} <span style={{ color: alpha('#94a3b8', 0.3) }}>Command</span>
                            </Typography>
                        </Box>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                {refreshing && (
                                    <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600, animation: 'pulse 2s infinite' }}>
                                        SYNCING...
                                    </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: systemStatusColor, fontWeight: 700 }}>{systemStatusLabel}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

                    <Outlet context={contextValue} />
                </Container>
            </Box>
        </Box>
    );
};

export default AdminLayout;
