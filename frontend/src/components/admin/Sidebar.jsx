import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import {
    Dashboard as DashboardIcon,
    People as UsersIcon,
    History as AuditIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    MenuOpen as MenuOpenIcon,
    Menu as MenuIcon,
    Psychology,
    Shield,
    SupportAgent
} from '@mui/icons-material';


const SidebarContainer = styled(Box)(({ theme, collapsed }) => ({
    width: collapsed ? 80 : 280,
    height: '100vh',
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
}));

const NavItem = styled(ListItem)(({ theme, active }) => ({
    margin: '8px 12px',
    borderRadius: '12px',
    width: 'auto',
    color: active ? '#fff' : theme.palette.text.secondary,
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
        backgroundColor: active ? alpha(theme.palette.primary.main, 0.15) : alpha('#fff', 0.05),
        color: '#fff',
        '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
        }
    },
    '& .MuiListItemIcon-root': {
        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
        minWidth: 40,
        transition: 'color 0.2s ease',
    },
    cursor: 'pointer',
}));

const Sidebar = ({ currentTab, onTabChange, onLogout, collapsed, setCollapsed }) => {
    const theme = useTheme();
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
        { id: 'training', label: 'Training Center', icon: <Psychology /> },
        { id: 'users', label: 'User Management', icon: <UsersIcon /> },
        { id: 'support', label: 'Customer Support', icon: <SupportAgent /> },
        { id: 'audit', label: 'System Audit', icon: <AuditIcon /> },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    return (
        <SidebarContainer collapsed={collapsed}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
                {!collapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            bgcolor: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`
                        }}>
                            <Shield sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>
                            LegalAI <span style={{ color: theme.palette.primary.main }}>Admin</span>
                        </Typography>
                    </Box>
                )}
                <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: '#94a3b8' }}>
                    {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
                </IconButton>
            </Box>

            <Divider sx={{ borderColor: alpha('#94a3b8', 0.1), mx: 2 }} />

            <List sx={{ px: 0, py: 2, flex: 1 }}>
                {menuItems.map((item) => (
                    <Tooltip key={item.id} title={collapsed ? item.label : ""} placement="right">
                        <NavItem
                            active={currentTab === item.id ? 1 : 0}
                            onClick={() => onTabChange(item.id)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            {!collapsed && (
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            )}
                        </NavItem>
                    </Tooltip>
                ))}
            </List>

            <Box sx={{ p: 2 }}>
                <NavItem onClick={onLogout} sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}>
                    <ListItemIcon sx={{ color: '#ef4444 !important' }}><LogoutIcon /></ListItemIcon>
                    {!collapsed && (
                        <ListItemText
                            primary="Logout"
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                    )}
                </NavItem>
            </Box>
        </SidebarContainer>
    );
};

export default Sidebar;
