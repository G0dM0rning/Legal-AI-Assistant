import { useState, useEffect } from 'react';
import { Container, Box, Typography, Link as MuiLink, IconButton, Divider } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { LinkedIn, GitHub, Twitter, Email } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: '#020617', // Match main background
  color: 'rgba(255, 255, 255, 0.7)',
  padding: theme.spacing(8, 0),
  borderTop: `1px solid ${alpha('#ffffff', 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
}));

const FooterLink = styled(Link)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(1.5),
  color: 'rgba(255, 255, 255, 0.6)',
  textDecoration: 'none',
  fontSize: '0.95rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: '#3b82f6',
    transform: 'translateX(5px)',
  },
}));

const SocialIcon = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  backgroundColor: alpha('#ffffff', 0.05),
  marginRight: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#3b82f6',
    backgroundColor: alpha('#3b82f6', 0.1),
    transform: 'translateY(-3px)',
  },
}));

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Update year if component stays mounted across new year
    const interval = setInterval(() => {
      setCurrentYear(new Date().getFullYear());
    }, 1000 * 60 * 60 * 24); // Check daily
    return () => clearInterval(interval);
  }, []);

  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <StyledFooter component="footer">
      <Container maxWidth="lg">
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={footerVariants}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Company Info */}
          <Box component={motion.div} variants={itemVariants}>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                fontWeight: 800,
                textDecoration: 'none',
                color: 'white',
                display: 'inline-block',
                mb: 2,
                '&:hover': {
                  color: 'primary.main',
                }
              }}
            >
              LegalAI
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)', maxWidth: '280px' }}>
              Your intelligent legal document assistant powered by advanced AI and Retrieval-Augmented Generation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <SocialIcon
                component={motion.a}
                whileHover={{ scale: 1.1 }}
                href="https://linkedin.com/in/waqarahmad1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedIn />
              </SocialIcon>
              <SocialIcon
                component={motion.a}
                whileHover={{ scale: 1.1 }}
                href="https://github.com/Waqar-Ahmad1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHub />
              </SocialIcon>
              <SocialIcon
                component={motion.a}
                whileHover={{ scale: 1.1 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter />
              </SocialIcon>
              <SocialIcon
                component={motion.a}
                whileHover={{ scale: 1.1 }}
                href="mailto:waqarahmadisbest@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Email />
              </SocialIcon>
            </Box>
          </Box>

          {/* Quick Links */}
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
              Quick Links
            </Typography>
            <FooterLink
              component={Link}
              to="/login"
              underline="none"
            >
              Login
            </FooterLink>
            <FooterLink
              component={Link}
              to="/register"
              underline="none"
            >
              Register
            </FooterLink>
            <FooterLink
              component={Link}
              to="/"
              underline="none"
            >
              Home
            </FooterLink>
            <FooterLink
              component={Link}
              to="/about"
              underline="none"
            >
              About
            </FooterLink>
            <FooterLink
              component={Link}
              to="/admin/signin"
              underline="none"
              sx={{ color: '#3b82f6', fontWeight: 600 }}
            >
              Admin Panel
            </FooterLink>
            <FooterLink
              component={Link}
              to="/try-it"
              underline="none"
            >
              TryItNow
            </FooterLink>
          </Box>

          {/* Resources */}
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
              Resources
            </Typography>
            <FooterLink
              component={Link}
              to="/documentation"
              underline="none"
            >
              Documentation
            </FooterLink>
            <FooterLink
              component={Link}
              to="/faq"
              underline="none"
            >
              FAQs
            </FooterLink>
            <FooterLink
              component={Link}
              to="/support"
              underline="none"
            >
              Support
            </FooterLink>
          </Box>

          {/* Legal */}
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
              Legal
            </Typography>
            <FooterLink
              component={Link}
              to="/privacy"
              underline="none"
            >
              Privacy Policy
            </FooterLink>
            <FooterLink
              component={Link}
              to="/terms"
              underline="none"
            >
              Terms of Service
            </FooterLink>
            <FooterLink
              component={Link}
              to="/cookies"
              underline="none"
            >
              Cookie Policy
            </FooterLink>
            <FooterLink
              component={Link}
              to="/gdpr"
              underline="none"
            >
              GDPR Compliance
            </FooterLink>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2">
            © {currentYear} LegalAI. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ mt: { xs: 1, sm: 0 } }}>
            Made with ❤️ for legal professionals worldwide
          </Typography>
        </Box>
      </Container>
    </StyledFooter>
  );
};

export default Footer;