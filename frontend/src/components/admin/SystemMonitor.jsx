import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Tooltip,
    IconButton,
    LinearProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Dns as DnsIcon,
    Storage as StorageIcon,
    AutoAwesome,
    Memory,
    Refresh,
    CheckCircle,
    Warning,
    Error
} from '@mui/icons-material';

const glassBox = {
    background: alpha('#1e293b', 0.5),
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha('#94a3b8', 0.1)}`,
    borderRadius: '24px',
    p: 3,
    height: '100%'
};

const ServiceCard = styled(Box)(({ theme, status }) => ({
    backgroundColor: alpha('#1e293b', 0.3),
    border: `1px solid ${alpha('#94a3b8', 0.05)}`,
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: alpha('#3b82f6', 0.2),
        backgroundColor: alpha('#1e293b', 0.5),
    }
}));

const SystemMonitor = ({ status = {}, onRefresh }) => {
    const services = [
        { id: 'backend', name: 'API Server', icon: <DnsIcon />, status: status.backend || 'online' },
        { id: 'database', name: 'MongoDB Instance', icon: <StorageIcon />, status: status.database || 'online' },
        { id: 'vector', name: 'Vector Store', icon: <Memory />, status: status.vector || 'online' },
        { id: 'ai', name: 'Gemini 1.5 Pro', icon: <AutoAwesome />, status: status.ai || 'online' },
    ];

    const getStatusIcon = (s) => {
        if (s === 'online') return <CheckCircle sx={{ color: '#10b981', fontSize: 18 }} />;
        if (s === 'degraded') return <Warning sx={{ color: '#f59e0b', fontSize: 18 }} />;
        return <Error sx={{ color: '#ef4444', fontSize: 18 }} />;
    };

    return (
        <Box sx={glassBox}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                        <DnsIcon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>System Reliability</Typography>
                </Box>
                <Tooltip title="Pulse Check">
                    <IconButton onClick={onRefresh} sx={{ color: '#94a3b8' }}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={2}>
                {services.map((service) => (
                    <Grid item xs={12} key={service.id}>
                        <ServiceCard status={service.status}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ color: service.status === 'online' ? '#3b82f6' : '#94a3b8' }}>
                                    {service.icon}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>{service.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase' }}>{service.status}</Typography>
                                </Box>
                            </Box>
                            {getStatusIcon(service.status)}
                        </ServiceCard>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 700 }}>
                    <span>VECTOR DB UTILIZATION</span>
                    <span>78%</span>
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={78}
                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#3b82f6' } }}
                />
            </Box>

            <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 700 }}>
                    <span>DAILY TOKEN USAGE (GEMINI)</span>
                    <span>42%</span>
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={42}
                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#10b981', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#10b981' } }}
                />
            </Box>
        </Box>
    );
};

export default SystemMonitor;
