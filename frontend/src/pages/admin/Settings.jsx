import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    InputAdornment,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Psychology as AIIcon,
    Security as SecurityIcon,
    Email as EmailIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const Settings = () => {
    const { user: admin } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [securityOp, setSecurityOp] = useState(null); // 'rotate' or 'revoke'
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [executing, setExecuting] = useState(false);

    const [settings, setSettings] = useState({
        site_name: 'Legal AI',
        contact_email: '',
        maintenance_mode: false,
        model_name: 'gpt-3.5-turbo',
        chunk_size: 1000,
        chunk_overlap: 200,
        top_k: 4,
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getSettings();
            if (response.success) {
                setSettings(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await adminAPI.updateSettings(settings);
            if (response.success) {
                setSuccess('Settings updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to save settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSecurityAction = async () => {
        setExecuting(true);
        setError(null);
        try {
            let response;
            if (securityOp === 'rotate') {
                response = await adminAPI.rotateSecretKey();
            } else {
                response = await adminAPI.revokeAllSessions();
            }

            if (response.success) {
                setSuccess(response.message);
                setConfirmOpen(false);
                // If we revoked all sessions, we might get logged out on next request
                if (securityOp === 'revoke') {
                    setTimeout(() => window.location.href = '/admin/signin', 2000);
                }
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(`Security operation failed: ${err.message}`);
        } finally {
            setExecuting(false);
            setSecurityOp(null);
        }
    };

    const openConfirm = (op) => {
        setSecurityOp(op);
        setConfirmOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const glassBox = {
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        p: 4,
        color: 'white'
    };

    const TabPanel = ({ children, value, index }) => (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                        System Settings
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                        Configure global application behavior and AI parameters.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchSettings}
                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    >
                        Reload
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ borderRadius: '12px', px: 4 }}
                    >
                        Save All Changes
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box sx={glassBox}>
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => setActiveTab(v)}
                    sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        '& .MuiTab-root': {
                            color: '#94a3b8',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            minHeight: 64
                        },
                        '& .Mui-selected': { color: '#3b82f6' }
                    }}
                >
                    <Tab icon={<SettingsIcon sx={{ fontSize: 20 }} />} label="General Config" iconPosition="start" />
                    <Tab icon={<AIIcon sx={{ fontSize: 20 }} />} label="AI Engine & RAG" iconPosition="start" />
                    <Tab icon={<SecurityIcon sx={{ fontSize: 20 }} />} label="System Security" iconPosition="start" />
                    <Tab icon={<EmailIcon sx={{ fontSize: 20 }} />} label="SMTP Settings" iconPosition="start" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Core Application Identity
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>SITE DISPLAY NAME</Typography>
                                <TextField
                                    fullWidth
                                    name="site_name"
                                    value={settings.site_name}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            '&:hover': { border: '1px solid rgba(59, 130, 246, 0.4)' }
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>SYSTEM SUPPORT EMAIL</Typography>
                                <TextField
                                    fullWidth
                                    name="contact_email"
                                    value={settings.contact_email}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            '&:hover': { border: '1px solid rgba(59, 130, 246, 0.4)' }
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#f59e0b', 0.05), border: `1px solid ${alpha('#f59e0b', 0.1)}` }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                color="warning"
                                                name="maintenance_mode"
                                                checked={settings.maintenance_mode}
                                                onChange={handleChange}
                                            />
                                        }
                                        label={
                                            <Box sx={{ ml: 1 }}>
                                                <Typography sx={{ color: '#f59e0b', fontWeight: 800 }}>Maintenance Mode Activation</Typography>
                                                <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 600 }}>
                                                    Redirect all non-admin traffic to a maintenance page. Use this for critical database migrations or system upgrades.
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Natural Language Processing Configuration
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>ACTIVE LLM ENGINE</Typography>
                                <TextField
                                    fullWidth
                                    name="model_name"
                                    value={settings.model_name}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>VECTOR SEARCH DENSITY (TOP-K)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="top_k"
                                    value={settings.top_k}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>DOCUMENT CHUNK SIZE</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="chunk_size"
                                    value={settings.chunk_size}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>CONTEXTUAL OVERLAP</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="chunk_overlap"
                                    value={settings.chunk_overlap}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Encryption & Access Control
                        </Typography>
                        <Box sx={{ p: 4, borderRadius: 4, bgcolor: alpha('#3b82f6', 0.03), border: `1px solid ${alpha('#3b82f6', 0.08)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', mr: 2 }}>
                                    <SecurityIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>Session Encryption</Typography>
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Manage JWT secrets and session persistence.</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 4, borderColor: alpha('#94a3b8', 0.1) }} />
                            <Grid container spacing={4}>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => openConfirm('rotate')}
                                        sx={{ py: 2, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Rotate Master Secret Key
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={() => openConfirm('revoke')}
                                        sx={{ py: 2, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Revoke All Admin Sessions
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Outgoing Communication Server
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>SMTP RELAY HOST</Typography>
                                <TextField
                                    fullWidth
                                    name="smtp_host"
                                    value={settings.smtp_host}
                                    onChange={handleChange}
                                    placeholder="smtp.gmail.com"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>PORT</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="smtp_port"
                                    value={settings.smtp_port}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>SYSTEM AUTH USER</Typography>
                                <TextField
                                    fullWidth
                                    name="smtp_user"
                                    value={settings.smtp_user}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block', fontWeight: 600 }}>AUTHENTICATION PASSWORD</Typography>
                                <TextField
                                    fullWidth
                                    name="smtp_pass"
                                    type={showSmtpPass ? 'text' : 'password'}
                                    value={settings.smtp_pass}
                                    onChange={handleChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }
                                    }}
                                    inputProps={{ style: { color: 'white', fontWeight: 500 } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                                                    sx={{ color: '#94a3b8' }}
                                                >
                                                    {showSmtpPass ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>
            </Box>

            {/* Security Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => { setConfirmOpen(false); setSecurityOp(null); }}
                PaperProps={{
                    sx: {
                        bgcolor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: 'white',
                        minWidth: 400
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {securityOp === 'rotate' ? '🔑 Rotate Master Secret Key?' : '🚫 Revoke All Sessions?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        {securityOp === 'rotate'
                            ? 'This will generate a new JWT signing key. All previously issued tokens will remain valid until they expire, but new tokens will use the new key.'
                            : 'This will immediately invalidate ALL current admin and user sessions. Everyone (including you) will be logged out and must sign in again.'
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => { setConfirmOpen(false); setSecurityOp(null); }}
                        sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={securityOp === 'revoke' ? 'error' : 'primary'}
                        onClick={handleSecurityAction}
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

export default Settings;
