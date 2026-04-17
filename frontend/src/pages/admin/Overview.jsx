import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Grid, Fade } from '@mui/material';
import {
    People as PeopleIcon,
    Description as DocumentIcon,
    Security as SecurityIcon,
    Dns as SystemIcon
} from '@mui/icons-material';
import StatWidget from '../../components/admin/StatWidget';
import AuditLog from '../../components/admin/AuditLog';
import SystemMonitor from '../../components/admin/SystemMonitor';

const Overview = () => {
    const { adminData, fetchDashboardData } = useOutletContext();
    const { stats, trainingHistory, systemStatus } = adminData;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            default: return 'error';
        }
    };

    return (
        <Fade in timeout={500}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatWidget
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<PeopleIcon />}
                        color="#3b82f6"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatWidget
                        title="Knowledge Base"
                        value={stats.totalDocuments}
                        icon={<DocumentIcon />}
                        color="#10b981"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatWidget
                        title="Training Sessions"
                        value={stats.trainingSessions}
                        icon={<SecurityIcon />}
                        color="#f59e0b"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatWidget
                        title="System Reliability"
                        value={`${stats.systemHealth || 100}%`}
                        icon={<SystemIcon />}
                        color="#ef4444"
                    />
                </Grid>

                <Grid item xs={12} lg={8}>
                    <AuditLog
                        history={trainingHistory.slice(0, 5)}
                        onRefresh={fetchDashboardData}
                        formatDate={formatDate}
                        formatFileSize={formatFileSize}
                        getStatusColor={getStatusColor}
                    />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SystemMonitor status={systemStatus} onRefresh={fetchDashboardData} />
                </Grid>
            </Grid>
        </Fade>
    );
};

export default Overview;
