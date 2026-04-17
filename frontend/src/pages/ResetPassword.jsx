import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    IconButton,
    InputAdornment,
    CssBaseline,
    CircularProgress,
    Container
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Key as KeyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PageWrapper = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#020617',
    position: 'relative',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(5),
    borderRadius: '24px',
    background: alpha('#0f172a', 0.8),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha('#ffffff', 0.1)}`,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '450px',
    zIndex: 1,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: theme.spacing(2.5),
    '& .MuiOutlinedInput-root': {
        backgroundColor: alpha('#ffffff', 0.03),
        borderRadius: '12px',
        '& fieldset': { borderColor: alpha('#ffffff', 0.1) },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputBase-input': { color: '#ffffff' },
}));

const GradientButton = styled(Button)(({ theme }) => ({
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: '#ffffff',
    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)' },
}));

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setMessage({ type: 'error', text: 'Missing or invalid token. Please request a new link.' });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const data = await authAPI.resetPassword(token, formData.password);
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to reset password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <CssBaseline />
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <StyledPaper elevation={0}>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Box sx={{
                                display: 'inline-flex',
                                p: 1.5,
                                borderRadius: '16px',
                                background: alpha('#3b82f6', 0.1),
                                mb: 2,
                                border: `1px solid ${alpha('#3b82f6', 0.2)}`
                            }}>
                                <KeyIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                New Password
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Please create a secure new password for your account.
                            </Typography>
                        </Box>

                        {message && (
                            <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px' }}>
                                {message.text}
                            </Alert>
                        )}

                        {!token ? (
                            <Button component={Link} to="/forgot-password" fullWidth sx={{ color: '#3b82f6' }}>
                                Request New Link
                            </Button>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <StyledTextField
                                    fullWidth
                                    label="New Password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                <StyledTextField
                                    fullWidth
                                    label="Confirm Password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                                <GradientButton type="submit" fullWidth disabled={loading}>
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                                </GradientButton>
                            </form>
                        )}
                    </StyledPaper>
                </motion.div>
            </Container>
        </PageWrapper>
    );
};

export default ResetPassword;
