import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, AppBar, Toolbar, Typography, Box, Container, IconButton, Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../assets/logo.svg';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  backgroundColor: alpha('#020617', 0.8),
  backdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
  color: '#ffffff',
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
});

const LogoImg = styled('img')({
  height: '40px',
  width: 'auto',
  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))',
});

const NavButton = styled(Button)(({ theme }) => ({
  margin: '0 4px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.95rem',
  color: 'rgba(255, 255, 255, 0.8)',
  '&:hover': {
    color: '#ffffff',
    backgroundColor: alpha('#ffffff', 0.05),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginLeft: '12px',
  fontWeight: 700,
  textTransform: 'none',
  borderRadius: '10px',
  padding: '8px 20px',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
  },
}));

const UserProfileSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  background: alpha('#ffffff', 0.05),
  border: `1px solid ${alpha('#ffffff', 0.1)}`,
  '&:hover': {
    background: alpha('#ffffff', 0.1),
    borderColor: alpha('#3b82f6', 0.4),
  },
}));

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const profileMenuOpen = Boolean(profileAnchorEl);

  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo with enhanced hover effects */}
          <LogoBox
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                '& img': {
                  transform: 'scale(1.1)',
                },
                '& h6': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <LogoImg src={logo} alt="LegalAI Logo" />
            <Typography variant="h6" noWrap sx={{
              fontWeight: 700,
              transition: 'color 0.3s ease'
            }}>
              LegalAI
            </Typography>
          </LogoBox>

          {/* Desktop Navigation */}
          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {user ? (
                <>
                  <NavButton component={Link} to="/">Home</NavButton>
                  <NavButton component={Link} to="/about">About</NavButton>

                  <ActionButton
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/try-it"
                  >
                    Try It Now
                  </ActionButton>

                  <UserProfileSection
                    onClick={handleProfileMenuOpen}
                    sx={{ ml: 2 }}
                  >
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                    }}>
                      <PersonOutlineIcon sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', mr: 0.5 }}>
                      {user.name}
                    </Typography>
                    <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                  </UserProfileSection>

                  <Menu
                    anchorEl={profileAnchorEl}
                    open={profileMenuOpen}
                    onClose={handleProfileMenuClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        mt: 1.5,
                        minWidth: 200,
                        background: alpha('#0f172a', 0.95),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha('#ffffff', 0.1)}`,
                        borderRadius: '16px',
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.4))',
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1.2,
                          borderRadius: '8px',
                          margin: '4px 8px',
                          color: 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            background: alpha('#3b82f6', 0.1),
                            color: '#3b82f6',
                          },
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#ffffff', 0.05)}`, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {user.email}
                      </Typography>
                    </Box>

                    <MenuItem onClick={handleLogout} sx={{ color: '#ef4444 !important', '&:hover': { background: alpha('#ef4444', 0.1) + ' !important' } }}>
                      <LogoutIcon sx={{ fontSize: 18, mr: 1.5 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <NavButton component={Link} to="/">Home</NavButton>
                  <NavButton component={Link} to="/about">About</NavButton>
                  <ActionButton
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/try-it"
                  >
                    Try It Now
                  </ActionButton>
                  <NavButton component={Link} to="/register">Register</NavButton>
                  <ActionButton
                    variant="outlined"
                    color="primary"
                    component={Link}
                    to="/login"
                  >
                    Login
                  </ActionButton>
                </>
              )}
            </Box>
          ) : (
            /* Mobile Navigation */
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
                sx={{ ml: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    '& .MuiMenuItem-root': {
                      py: 1.5,
                      px: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 120, 255, 0.1)',
                        transform: 'translateX(4px)'
                      }
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem component={Link} to="/" onClick={handleMenuClose}>Home</MenuItem>
                <MenuItem component={Link} to="/about" onClick={handleMenuClose}>About</MenuItem>

                {user ? (
                  <>
                    <MenuItem component={Link} to="/try-it" onClick={handleMenuClose} sx={{ color: 'success.main' }}>
                      Try It Now
                    </MenuItem>
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        color: 'error.main',
                        backgroundColor: 'rgba(255, 50, 50, 0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 50, 50, 0.1)',
                        }
                      }}
                    >
                      Logout
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem
                      component={Link}
                      to="/try-it"
                      onClick={handleMenuClose}
                      sx={{ color: 'success.main' }}
                    >
                      Try It Now
                    </MenuItem>
                    <MenuItem component={Link} to="/register" onClick={handleMenuClose}>
                      Register
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/login"
                      onClick={handleMenuClose}
                      sx={{ color: 'primary.main' }}
                    >
                      Login
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Navbar;