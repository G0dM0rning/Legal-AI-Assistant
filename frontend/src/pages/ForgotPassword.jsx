import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    IconButton,
    CssBaseline,
    CircularProgress,
    Container
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    LockReset as LockResetIcon,
    ArrowBack as ArrowBackIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PageWrapper = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#020617',
    position: 'relative',
    overflow: 'hidden',
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
    position: 'relative',
    zIndex: 1,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: theme.spacing(2.5),
    '& .MuiOutlinedInput-root': {
        backgroundColor: alpha('#ffffff', 0.03),
        borderRadius: '12px',
        '& fieldset': { borderColor: alpha('#ffffff', 0.1) },
        '&:hover fieldset': { borderColor: alpha('#3b82f6', 0.5) },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputBase-input': { color: '#ffffff' },
}));

const GradientButton = styled(Button)(({ theme }) => ({
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    marginTop: theme.spacing(2),
    color: '#ffffff',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 25px -5px rgba(59, 130, 246, 0.5)',
        background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    },
}));

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setMessage(null);
        try {
            const data = await authAPI.forgotPassword(email.trim().toLowerCase());
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to send request.' });
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
                            <IconButton
                                component={Link}
                                to="/login"
                                sx={{
                                    position: 'absolute',
                                    top: 24,
                                    left: 24,
                                    color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Box sx={{
                                display: 'inline-flex',
                                p: 1.5,
                                borderRadius: '16px',
                                background: alpha('#3b82f6', 0.1),
                                mb: 2,
                                border: `1px solid ${alpha('#3b82f6', 0.2)}`
                            }}>
                                <LockResetIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                Reset Password
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </Typography>
                        </Box>

                        {message && (
                            <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px' }}>
                                {message.text}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <StyledTextField
                                fullWidth
                                label="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                type="email"
                                InputProps={{
                                    startAdornment: <EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
                                }}
                            />
                            <GradientButton type="submit" fullWidth disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                            </GradientButton>
                        </form>
                    </StyledPaper>
                </motion.div>
            </Container>
        </PageWrapper>
    );
};

export default ForgotPassword;
