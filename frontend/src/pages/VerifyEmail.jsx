import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Container,
    CssBaseline,
    alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    CheckCircleOutline as SuccessIcon,
    ErrorOutline as ErrorIcon,
    MarkEmailRead as EmailIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';

const PageWrapper = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#020617',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        width: '1000px',
        height: '1000px',
        top: '-500px',
        left: '-500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        width: '800px',
        height: '800px',
        bottom: '-400px',
        right: '-400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
    }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(6),
    borderRadius: '24px',
    background: alpha('#0f172a', 0.8),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha('#ffffff', 0.1)}`,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
}));

const GradientButton = styled(Button)(({ theme }) => ({
    padding: '12px 32px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    marginTop: theme.spacing(4),
    color: '#ffffff',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 25px -5px rgba(59, 130, 246, 0.5)',
        background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    }
}));

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    const token = searchParams.get('token');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. Missing token.');
                return;
            }

            try {
                const response = await authAPI.verifyEmail(token);
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message);
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Verification failed.');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.data?.message || 'Something went wrong during verification.');
            }
        };

        verify();
    }, [token]);

    return (
        <PageWrapper>
            <CssBaseline />
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <StyledPaper elevation={0}>
                        <Box sx={{ mb: 4 }}>
                            {status === 'verifying' && (
                                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                                    <CircularProgress size={80} sx={{ color: '#3b82f6' }} />
                                    <Box
                                        sx={{
                                            top: 0, left: 0, bottom: 0, right: 0,
                                            position: 'absolute', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <EmailIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                                    </Box>
                                </Box>
                            )}

                            {status === 'success' && (
                                <Box sx={{
                                    display: 'inline-flex', p: 2, borderRadius: '50%',
                                    background: alpha('#10b981', 0.1), border: '1px solid rgba(16, 185, 129, 0.2)',
                                    mb: 3
                                }}>
                                    <SuccessIcon sx={{ fontSize: 60, color: '#10b981' }} />
                                </Box>
                            )}

                            {status === 'error' && (
                                <Box sx={{
                                    display: 'inline-flex', p: 2, borderRadius: '50%',
                                    background: alpha('#ef4444', 0.1), border: '1px solid rgba(239, 68, 68, 0.2)',
                                    mb: 3
                                }}>
                                    <ErrorIcon sx={{ fontSize: 60, color: '#ef4444' }} />
                                </Box>
                            )}

                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 2, letterSpacing: '-0.5px' }}>
                                {status === 'verifying' && 'Verifying Email...'}
                                {status === 'success' && 'Email Verified!'}
                                {status === 'error' && 'Verification Failed'}
                            </Typography>

                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '80%', mx: 'auto' }}>
                                {status === 'verifying' && 'Please wait while we confirm your email address.'}
                                {status === 'success' && message}
                                {status === 'error' && message}
                            </Typography>

                            {status === 'success' && (
                                <GradientButton
                                    variant="contained"
                                    onClick={() => navigate('/login')}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    Continue to Login
                                </GradientButton>
                            )}

                            {status === 'error' && (
                                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/register')}
                                        sx={{
                                            color: 'white', borderColor: alpha('#ffffff', 0.2), borderRadius: '12px', p: 1.5,
                                            '&:hover': { borderColor: '#3b82f6', background: alpha('#3b82f6', 0.1) }
                                        }}
                                    >
                                        Try Registering Again
                                    </Button>
                                    <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                                        Back to Login
                                    </Link>
                                </Box>
                            )}
                        </Box>
                    </StyledPaper>
                </motion.div>
            </Container>
        </PageWrapper>
    );
};

export default VerifyEmail;
