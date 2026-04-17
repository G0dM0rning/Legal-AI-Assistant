import React from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    MenuItem,
    Button,
    LinearProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    History as HistoryIcon,
    InsertDriveFile as DocumentIcon,
    CheckCircle,
    Error,
    Refresh,
    OpenInNew,
    Search,
    FilterList,
    Replay as ResumeIcon,
    DeleteForever as DeleteIcon,
    ExpandMore as LoadMoreIcon
} from '@mui/icons-material';

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

const AuditLog = ({
    history,
    onRefresh,
    formatDate,
    formatFileSize,
    getStatusColor,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onResume,
    onDelete,
    isLoading,
    onLoadMore,
    hasMore,
    totalDocs
}) => {
    return (
        <Box sx={glassBox}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'center' }}>
                <TextField
                    placeholder="Search by document name or admin..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{
                        flex: 1,
                        minWidth: '250px',
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

                <TextField
                    select
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value)}
                    sx={{
                        width: '150px',
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: alpha('#94a3b8', 0.05),
                            borderRadius: '12px',
                            '& fieldset': { borderColor: alpha('#94a3b8', 0.1) },
                        },
                        '& .MuiInputLabel-root': { color: '#94a3b8' },
                        '& .MuiSelect-icon': { color: '#94a3b8' }
                    }}
                >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                </TextField>

                <Tooltip title="Refresh Log">
                    <IconButton onClick={onRefresh} disabled={isLoading} sx={{ color: '#94a3b8', bgcolor: alpha('#94a3b8', 0.05), borderRadius: '12px' }}>
                        <Refresh className={isLoading ? 'rotate-animation' : ''} />
                    </IconButton>
                </Tooltip>
            </Box>

            {history.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                    <HistoryIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2">No audit entries found</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>DOCUMENT</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>TIMESTAMP</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>STATUS</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }}>SIZE</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, py: 2 }} align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map((item, index) => (
                                <StyledTableRow key={index}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DocumentIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.documentName}</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>Internal Source</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(item.uploadDate)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={item.status === 'completed' ? <CheckCircle sx={{ fontSize: '16px !important' }} /> : <Error sx={{ fontSize: '16px !important' }} />}
                                            label={item.status.toUpperCase()}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.65rem',
                                                bgcolor: alpha(getStatusColor(item.status) === 'success' ? '#10b981' : getStatusColor(item.status) === 'warning' ? '#f59e0b' : '#ef4444', 0.1),
                                                color: getStatusColor(item.status) === 'success' ? '#10b981' : getStatusColor(item.status) === 'warning' ? '#f59e0b' : '#ef4444',
                                                border: 'none'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatFileSize(item.fileSize || 0)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            {item.status !== 'completed' && item.status !== 'processing' && (
                                                <Tooltip title="Resume Training">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); onResume(item._id); }}
                                                        sx={{ color: '#3b82f6', border: `1px solid ${alpha('#3b82f6', 0.2)}` }}
                                                    >
                                                        <ResumeIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete Document">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                    sx={{ color: '#ef4444', border: `1px solid ${alpha('#ef4444', 0.2)}` }}
                                                >
                                                    <DeleteIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={
                                                <Box sx={{ p: 1, fontSize: '0.8rem' }}>
                                                    <div><strong>Admin:</strong> {item.adminName || 'N/A'}</div>
                                                    <div><strong>Chunks:</strong> {item.chunkCount || 0}</div>
                                                    <div><strong>Processing:</strong> {item.processingTime || 'N/A'}</div>
                                                    {item.error && <div style={{ color: '#ef4444' }}><strong>Error:</strong> {item.error}</div>}
                                                </Box>
                                            } arrow>
                                                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                                                    <OpenInNew fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {history.length > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha('#94a3b8', 0.1)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        Showing {history.length} of {totalDocs} entries
                    </Typography>

                    {hasMore && (
                        <Button
                            variant="outlined"
                            onClick={onLoadMore}
                            disabled={isLoading}
                            startIcon={isLoading ? null : <LoadMoreIcon />}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                borderColor: alpha('#3b82f6', 0.5),
                                color: '#3b82f6',
                                px: 4,
                                py: 1,
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                    bgcolor: alpha('#3b82f6', 0.05)
                                }
                            }}
                        >
                            {isLoading ? 'Loading...' : 'Load More Entries'}
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AuditLog;
