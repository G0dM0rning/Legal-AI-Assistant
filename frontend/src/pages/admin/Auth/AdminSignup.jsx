import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
  CssBaseline,
  CircularProgress,
  Container,
  Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  HowToRegOutlined as HowToRegOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon
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
  padding: theme.spacing(4, 0),
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '1000px',
    height: '1000px',
    top: '-500px',
    right: '-500px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '800px',
    height: '800px',
    bottom: '-400px',
    left: '-400px',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: '24px',
  background: alpha('#0f172a', 0.8),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.1)}`,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  width: '100%',
  maxWidth: '500px',
  position: 'relative',
  zIndex: 1,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
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

const AdminSignup = () => {
  const { adminRegister } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secret_key: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.secret_key) newErrors.secret_key = 'Admin secret key is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        secret_key: formData.secret_key
      };
      const data = await adminRegister(payload);
      if (data.success) {
        setServerMessage({ type: 'success', text: 'Admin account created! Redirecting...' });
        setTimeout(() => navigate('/admin/signin', { state: { email: formData.email } }), 2000);
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (error) {
      setServerMessage({ type: 'error', text: error.data?.detail || error.message || 'Registration failed.' });
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
                <HowToRegOutlinedIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1, letterSpacing: '-0.5px' }}>
                Admin Registration
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}>
                Create a new administrator account
              </Typography>
            </Box>

            {serverMessage && (
              <Alert
                severity={serverMessage.type}
                sx={{ mb: 3, borderRadius: '12px', background: alpha(serverMessage.type === 'success' ? '#10b981' : '#ef4444', 0.1), color: serverMessage.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${alpha(serverMessage.type === 'success' ? '#10b981' : '#ef4444', 0.2)}` }}
              >
                {serverMessage.text}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <StyledTextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} />
              <StyledTextField fullWidth label="Admin Email" name="email" type="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth label="Password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.3)' }}>{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>) }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth label="Confirm" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.3)' }}>{showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>) }}
                  />
                </Grid>
              </Grid>

              <StyledTextField
                fullWidth
                label="Admin Secret Key"
                name="secret_key"
                type={showSecretKey ? "text" : "password"}
                value={formData.secret_key}
                onChange={handleChange}
                error={!!errors.secret_key}
                helperText={errors.secret_key}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SecurityIcon sx={{ color: 'rgba(255,255,255,0.3)' }} /></InputAdornment>),
                  endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowSecretKey(!showSecretKey)} edge="end" sx={{ color: 'rgba(255,255,255,0.3)' }}>{showSecretKey ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>)
                }}
              />

              <GradientButton type="submit" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Admin Account'}
              </GradientButton>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                Already have an admin account?{' '}
                <Link to="/admin/signin" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700 }}>
                  Sign In
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SecurityIcon sx={{ fontSize: 16, mr: 0.5 }} /> Authorized Personnel Only
              </Typography>
            </Box>
          </StyledPaper>
        </motion.div>
      </Container>
    </PageWrapper>
  );
};

export default AdminSignup;
