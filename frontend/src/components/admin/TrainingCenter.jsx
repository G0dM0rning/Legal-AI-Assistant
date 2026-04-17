import React from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Paper,
    LinearProgress,
    Alert,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    CloudUpload as UploadIcon,
    InsertDriveFile as DocumentIcon,
    Security as SecurityIcon,
    AutoAwesome,
    Info,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    PlayArrow as PendingIcon
} from '@mui/icons-material';

const glassBox = {
    background: alpha('#1e293b', 0.5),
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha('#94a3b8', 0.1)}`,
    borderRadius: '24px',
    p: 4,
};

const DropZone = styled(Box)(({ theme, active }) => ({
    border: `2px dashed ${active ? '#3b82f6' : alpha('#94a3b8', 0.2)}`,
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: active ? alpha('#3b82f6', 0.05) : 'transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: '#3b82f6',
        backgroundColor: alpha('#3b82f6', 0.05),
    }
}));

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'success':
        case 'completed': return <SuccessIcon sx={{ color: '#10b981' }} size={20} />;
        case 'error':
        case 'failed': return <ErrorIcon sx={{ color: '#ef4444' }} size={20} />;
        case 'processing': return <CircularProgress size={20} sx={{ color: '#3b82f6' }} thickness={5} />;
        default: return <PendingIcon sx={{ color: '#94a3b8' }} size={20} />;
    }
};

const TrainingConsole = ({ activeTraining }) => {
    const scrollRef = React.useRef(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeTraining?.logs]);

    if (!activeTraining) return null;

    return (
        <Box sx={{
            mb: 4,
            p: 3,
            borderRadius: '24px',
            background: alpha('#0f172a', 0.8),
            border: `1px solid ${alpha('#3b82f6', 0.3)}`,
            boxShadow: `0 0 20px ${alpha('#3b82f6', 0.1)}`
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={20} sx={{ color: '#3b82f6' }} thickness={6} />
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800, letterSpacing: 1 }}>
                        ACTIVE TRAINING CONSOLE
                    </Typography>
                </Box>
                <Chip
                    label={activeTraining.status?.toUpperCase()}
                    size="small"
                    sx={{
                        bgcolor: alpha('#3b82f6', 0.1),
                        color: '#3b82f6',
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        borderRadius: '6px'
                    }}
                />
            </Box>

            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1, fontSize: '1rem' }}>
                {activeTraining.documentName}
            </Typography>

            {activeTraining.status === 'failed' && activeTraining.error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', bgcolor: alpha('#ef4444', 0.1), color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {activeTraining.error}
                </Alert>
            )}

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>OVERALL PROGRESS</Typography>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800 }}>{activeTraining.progress}%</Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={activeTraining.progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha('#3b82f6', 0.1),
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#3b82f6' }
                    }}
                />
            </Box>

            <Box
                ref={scrollRef}
                sx={{
                    height: '200px',
                    overflowY: 'auto',
                    bgcolor: alpha('#020617', 0.5),
                    borderRadius: '12px',
                    p: 2,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '0.75rem',
                    border: `1px solid ${alpha('#1e293b', 0.5)}`,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: alpha('#3b82f6', 0.2), borderRadius: '10px' }
                }}
            >
                {activeTraining.logs?.length > 0 ? (
                    activeTraining.logs.map((log, idx) => (
                        <Box key={idx} sx={{ color: '#94a3b8', mb: 0.5, display: 'flex', gap: 1 }}>
                            <Typography component="span" sx={{ color: '#3b82f6', fontSize: 'inherit', fontWeight: 700 }}>&gt;</Typography>
                            <Typography component="span" sx={{ fontSize: 'inherit' }}>{log}</Typography>
                        </Box>
                    ))
                ) : (
                    <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic' }}>
                        Waiting for pipeline logs...
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const TrainingCenter = ({
    selectedFiles,
    onFilesSelect,
    onUpload,
    uploading,
    batchProgress,
    filesStatus,
    onRemoveFile,
    formatFileSize,
    onClearAll,
    activeTraining,
    onBulkTrain
}) => {
    const hasFiles = selectedFiles.length > 0;

    return (
        <Box sx={glassBox}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                        <AutoAwesome />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>Training Center</Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Inject professional legal resources into the RAG vector store.</Typography>
                    </Box>
                </Box>
                {hasFiles && !uploading && (
                    <Button
                        size="small"
                        onClick={onClearAll}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                    >
                        Clear All
                    </Button>
                )}
            </Box>

            {!hasFiles ? (
                <DropZone component="label">
                    <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.docx,.doc,.txt,.md,.json,.parquet"
                        onChange={onFilesSelect}
                    />
                    <UploadIcon sx={{ fontSize: 48, color: alpha('#3b82f6', 0.5), mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Drop legal documents here</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Supported: PDF, DOCX, TXT, MD, JSON, PARQUET (Multiple Files Allowed)</Typography>
                    <Button
                        variant="contained"
                        component="span"
                        sx={{ mt: 3, borderRadius: '10px', px: 4, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                    >
                        Browse Files
                    </Button>
                </DropZone>
            ) : (
                <Box>
                    <TrainingConsole activeTraining={activeTraining} />

                    {uploading && !activeTraining && (
                        <Box sx={{ mb: 4, p: 3, borderRadius: '16px', bgcolor: alpha('#3b82f6', 0.05), border: `1px solid ${alpha('#3b82f6', 0.2)}` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800 }}>BATCH PROGRESS</Typography>
                                <Typography variant="subtitle2" sx={{ color: '#3b82f6', fontWeight: 800 }}>{batchProgress}%</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={batchProgress}
                                sx={{ height: 10, borderRadius: 5, bgcolor: alpha('#3b82f6', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: '#3b82f6' } }}
                            />
                        </Box>
                    )}

                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                        {selectedFiles.map((file, index) => {
                            const status = filesStatus[file.name]?.status || 'pending';
                            const progress = filesStatus[file.name]?.progress || 0;
                            const isCurrent = status === 'processing';

                            return (
                                <Paper key={index} sx={{
                                    p: 2,
                                    bgcolor: alpha('#94a3b8', 0.05),
                                    borderRadius: '16px',
                                    border: `1px solid ${isCurrent ? alpha('#3b82f6', 0.4) : alpha('#94a3b8', 0.1)}`,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <ListItemIcon sx={{ minWidth: 'auto' }}>
                                            <DocumentIcon sx={{ fontSize: 28, color: isCurrent ? '#3b82f6' : '#94a3b8' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</Typography>}
                                            secondary={<Typography variant="caption" sx={{ color: '#64748b' }}>{formatFileSize(file.size)} • {status.toUpperCase()}</Typography>}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {status === 'success' && <SuccessIcon sx={{ color: '#10b981', fontSize: 20 }} />}
                                            {status === 'error' && <ErrorIcon sx={{ color: '#ef4444', fontSize: 20 }} />}
                                            {status === 'pending' && !uploading && (
                                                <IconButton size="small" onClick={() => onRemoveFile(index)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>

                                    {isCurrent && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={progress}
                                                sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#3b82f6', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#3b82f6' } }}
                                            />
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </List>

                    {!uploading && (
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<SecurityIcon />}
                            onClick={onUpload}
                            sx={{
                                py: 2,
                                borderRadius: '16px',
                                bgcolor: '#3b82f6',
                                fontWeight: 800,
                                fontSize: '1rem',
                                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                                '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Start Multi-Document Training
                        </Button>
                    )}

                    {!uploading && (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AutoAwesome />}
                            onClick={onBulkTrain}
                            sx={{
                                mt: 2,
                                py: 1.5,
                                borderRadius: '16px',
                                color: '#3b82f6',
                                borderColor: alpha('#3b82f6', 0.5),
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                    bgcolor: alpha('#3b82f6', 0.05),
                                    transform: 'translateY(-1px)'
                                },
                            }}
                        >
                            Train Newly Uploaded Files (Sync Mode)
                        </Button>
                    )}
                </Box>
            )}

            <Box sx={{ mt: 4, p: 2.5, borderRadius: '16px', bgcolor: alpha('#f59e0b', 0.05), border: `1px solid ${alpha('#f59e0b', 0.2)}`, display: 'flex', gap: 2 }}>
                <Info sx={{ color: '#f59e0b', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: '#d97706', lineHeight: 1.6 }}>
                    <strong>Optimizer Note:</strong> Batch training processes documents sequentially to prevent vector store collisions. Each document is semantically chunked and indexed into the high-dimensional legal knowledge space.
                </Typography>
            </Box>
        </Box>
    );
};

export default TrainingCenter;
