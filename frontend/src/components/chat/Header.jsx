import React, { useState } from 'react';
import { Box, Typography, IconButton, Avatar, Menu, MenuItem, alpha, Tooltip, Chip } from '@mui/material';
import { Download, Logout, AccountCircle, AutoAwesome, Scale, InfoOutlined } from '@mui/icons-material';
import { ChatHeaderStyled } from './ChatStyles';

const Header = ({
    user,
    systemStatus,
    onLogout,
    onDownloadChat
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [exportAnchorEl, setExportAnchorEl] = useState(null);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleExportOpen = (event) => setExportAnchorEl(event.currentTarget);
    const handleExportClose = () => setExportAnchorEl(null);

    return (
        <ChatHeaderStyled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                    <Scale />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Legal Intelligence 2.0
                        <Chip
                            label="Pro"
                            size="small"
                            sx={{
                                height: 18, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha('#10b981', 0.1),
                                color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                        />
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: systemStatus.database === 'connected' ? '#10b981' : '#f59e0b' }} />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                {systemStatus.database === 'connected' ? 'Core DB Ready' : 'Syncing...'}
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ height: 10, alignSelf: 'center', bgcolor: alpha('#94a3b8', 0.2) }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: systemStatus.ai === 'ready' || systemStatus.ai === 'online' ? '#3b82f6' : '#f59e0b' }} />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                {systemStatus.ai === 'ready' || systemStatus.ai === 'online' ? 'Binary-1 Model Active' : 'AI Warming Up'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Export Legal Analysis">
                    <IconButton
                        onClick={handleExportOpen}
                        sx={{
                            bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6',
                            border: `1px solid ${alpha('#3b82f6', 0.2)}`,
                            '&:hover': { bgcolor: alpha('#3b82f6', 0.2) }
                        }}
                    >
                        <Download fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={exportAnchorEl}
                    open={Boolean(exportAnchorEl)}
                    onClose={handleExportClose}
                    PaperProps={{
                        sx: {
                            bgcolor: '#1e293b', color: 'white', borderRadius: 2, mt: 1, minWidth: 160,
                            border: '1px solid rgba(148, 163, 184, 0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }
                    }}
                >
                    <MenuItem onClick={() => { onDownloadChat('pdf'); handleExportClose(); }}>Export PDF (.pdf)</MenuItem>
                    <MenuItem onClick={() => { onDownloadChat('docx'); handleExportClose(); }}>Export Word (.docx)</MenuItem>
                    <MenuItem onClick={() => { onDownloadChat('txt'); handleExportClose(); }}>Plain Text (.txt)</MenuItem>
                </Menu>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2, pl: 2, borderLeft: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <Avatar
                        onClick={handleMenuOpen}
                        sx={{
                            width: 40, height: 40, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            border: '2px solid rgba(255,255,255,0.1)',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.05)' }
                        }}
                    >
                        {user?.name?.charAt(0) || <AccountCircle />}
                    </Avatar>
                </Box>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: {
                            bgcolor: '#1e293b', color: 'white', borderRadius: 2, mt: 1, minWidth: 180,
                            border: '1px solid rgba(148, 163, 184, 0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }
                    }}
                >
                    <Divider sx={{ bgcolor: 'rgba(148, 163, 184, 0.1)' }} />
                    <MenuItem onClick={onLogout} sx={{ gap: 1.5, py: 1.5, color: '#ef4444' }}>
                        <Logout fontSize="small" /> Logout Securely
                    </MenuItem>
                </Menu>
            </Box>
        </ChatHeaderStyled>
    );
};

const Divider = ({ sx, flexItem, orientation }) => (
    <Box sx={{ ...sx, width: orientation === 'vertical' ? '1px' : '100%', height: orientation === 'vertical' ? '100%' : '1px' }} />
);

export default Header;
