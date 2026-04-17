import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  CssBaseline,
  CircularProgress,
  Container
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  LockOutlined as LockOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#020617', // Main dark background
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
  padding: theme.spacing(5),
  borderRadius: '24px',
  background: alpha('#0f172a', 0.8), // Paper dark background
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
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: alpha('#ffffff', 0.1),
    },
    '&:hover fieldset': {
      borderColor: alpha('#3b82f6', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3b82f6',
      borderWidth: '1.5px',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.5)',
    '&.Mui-focused': {
      color: '#3b82f6',
    },
  },
  '& .MuiInputBase-input': {
    color: '#ffffff',
  },
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
  '&:disabled': {
    background: alpha('#ffffff', 0.1),
    color: alpha('#ffffff', 0.3),
  }
}));

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setServerMessage({
        type: 'success',
        text: location.state.message
      });
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    setResendLoading(true);
    try {
      const { authAPI } = await import('../services/api');
      const data = await authAPI.resendVerification(formData.email);
      if (data.success) {
        setServerMessage({ type: 'success', text: 'Verification email resent! Please check your inbox.' });
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to resend email.' });
      }
    } catch (error) {
      setServerMessage({ type: 'error', text: error.data?.message || 'Failed to resend email.' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverMessage) setServerMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      const data = await login(payload);
      if (data.success) {
        setServerMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        // Navigation is handled inside login() function in AuthContext
      } else {
        // Handle unverified account
        if (data.data?.unverified) {
          setServerMessage({
            type: 'error',
            text: data.message,
            unverified: true
          });
        } else {
          setServerMessage({ type: 'error', text: data.message || 'Login failed.' });
        }
      }
    } catch (error) {
      setServerMessage({ type: 'error', text: error.data?.detail || error.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StyledPaper elevation={0}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <IconButton
                component={Link}
                to="/"
                sx={{
                  position: 'absolute',
                  top: 24,
                  left: 24,
                  color: 'rgba(255,255,255,0.4)',
                  '&:hover': { color: 'white', background: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Box sx={{
                display: 'inline-flex',
                p: 1.5,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                mb: 2,
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <LockOutlinedIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1, letterSpacing: '-0.5px' }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}>
                Sign in to continue your legal analysis
              </Typography>
            </Box>

            {serverMessage && (
              <Box sx={{ mb: 3 }}>
                <Alert
                  severity={serverMessage.type}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: serverMessage.type === 'success' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                    color: serverMessage.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${serverMessage.type === 'success' ? alpha('#10b981', 0.2) : alpha('#ef4444', 0.2)}`,
                    '& .MuiAlert-icon': { color: 'inherit' },
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">{serverMessage.text}</Typography>
                    {serverMessage.unverified && (
                      <Button
                        size="small"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        sx={{
                          alignSelf: 'flex-start',
                          color: '#3b82f6',
                          fontWeight: 700,
                          textTransform: 'none',
                          p: 0,
                          minWidth: 0,
                          '&:hover': { background: 'transparent', textDecoration: 'underline', color: '#60a5fa' }
                        }}
                      >
                        {resendLoading ? 'Resending...' : 'Resend Verification Email'}
                      </Button>
                    )}
                  </Box>
                </Alert>
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <StyledTextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                autoComplete="email"
              />
              <StyledTextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Link to="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </Box>

              <GradientButton
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </GradientButton>
            </Box>

            <Divider sx={{ my: 4, borderColor: alpha('#ffffff', 0.1) }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', px: 1 }}>OR</Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700 }}>
                  Create Account
                </Link>
              </Typography>
            </Box>
          </StyledPaper>
        </motion.div>
      </Container>
    </PageWrapper>
  );
};

export default Login;
