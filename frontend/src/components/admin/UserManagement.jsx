import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    IconButton,
    Button,
    Tooltip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    People as PeopleIcon,
    Shield,
    Person,
    Search,
    Block as BlockIcon,
    CheckCircle as ActivateIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const glassBox = {
    background: alpha('#1e293b', 0.5),
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha('#94a3b8', 0.1)}`,
    borderRadius: '24px',
    p: 3,
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: alpha('#94a3b8', 0.05),
    },
    '& td': {
        borderBottom: `1px solid ${alpha('#94a3b8', 0.05)}`,
        padding: '16px',
        color: '#e2e8f0',
    },
}));

const UserManagement = ({ users = [], totalUsers = 0, onRefresh, page = 1, onPageChange, totalPages = 1 }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: '' });
    const [executing, setExecuting] = useState(false);

    const formatTimestamp = (isoString) => {
        if (!isoString) return 'Recent';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Recent';
        }
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (user.name || '').toLowerCase().includes(q) ||
            (user.email || '').toLowerCase().includes(q);
    });

    const handleToggleStatus = async () => {
        const { user, action } = confirmDialog;
        if (!user) return;
        setExecuting(true);
        try {
            const res = await adminAPI.toggleUserStatus(user._id, action === 'activate');
            if (res.success && onRefresh) {
                await onRefresh();
            }
        } catch (err) {
            console.error('Failed to update user status:', err);
        } finally {
            setExecuting(false);
            setConfirmDialog({ open: false, user: null, action: '' });
        }
    };

    return (
        <Box sx={glassBox}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                        <PeopleIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>User Management</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            TOTAL USERS: {totalUsers}
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    placeholder="Search users..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                        minWidth: 220,
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: alpha('#94a3b8', 0.05),
                            borderRadius: '12px',
                            '& fieldset': { borderColor: alpha('#94a3b8', 0.1) },
                            '&:hover fieldset': { borderColor: alpha('#3b82f6', 0.5) },
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {filteredUsers.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                    <Person sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2">No registered users found</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>USER</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>ROLE</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>STATUS</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>JOINED</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }} align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user, index) => {
                                const isActive = user.is_active !== false; // Default to active if field missing
                                return (
                                    <StyledTableRow key={user._id || index}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#3b82f6', 0.2), color: '#3b82f6', fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>{user.email || 'no-email@legalai.com'}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {user.role === 'admin' && <Shield sx={{ fontSize: 14, color: '#3b82f6' }} />}
                                                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.role || 'user'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={isActive ? "ACTIVE" : "INACTIVE"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem',
                                                    bgcolor: alpha(isActive ? '#10b981' : '#ef4444', 0.1),
                                                    color: isActive ? '#10b981' : '#ef4444',
                                                    border: 'none'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {formatTimestamp(user.created_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={isActive ? "Deactivate User" : "Activate User"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setConfirmDialog({
                                                        open: true,
                                                        user,
                                                        action: isActive ? 'deactivate' : 'activate'
                                                    })}
                                                    sx={{
                                                        color: isActive ? '#ef4444' : '#10b981',
                                                        border: `1px solid ${alpha(isActive ? '#ef4444' : '#10b981', 0.2)}`
                                                    }}
                                                >
                                                    {isActive ? <BlockIcon fontSize="inherit" /> : <ActivateIcon fontSize="inherit" />}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </StyledTableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha('#94a3b8', 0.1)}`, display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
                    <Button
                        size="small"
                        disabled={page <= 1}
                        onClick={() => onPageChange && onPageChange(page - 1)}
                        sx={{ color: '#94a3b8', textTransform: 'none' }}
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        Page {page} of {totalPages}
                    </Typography>
                    <Button
                        size="small"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange && onPageChange(page + 1)}
                        sx={{ color: '#94a3b8', textTransform: 'none' }}
                    >
                        Next
                    </Button>
                </Box>
            )}

            {/* Confirm Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, user: null, action: '' })}
                PaperProps={{
                    sx: {
                        bgcolor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: 'white',
                        minWidth: 380
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {confirmDialog.action === 'deactivate' ? '⚠️ Deactivate User?' : '✅ Activate User?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        {confirmDialog.action === 'deactivate'
                            ? `This will prevent "${confirmDialog.user?.name}" from logging in or using the chat system.`
                            : `This will restore access for "${confirmDialog.user?.name}".`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setConfirmDialog({ open: false, user: null, action: '' })}
                        sx={{ color: '#94a3b8', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={confirmDialog.action === 'deactivate' ? 'error' : 'success'}
                        onClick={handleToggleStatus}
                        disabled={executing}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
                    >
                        {executing ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
