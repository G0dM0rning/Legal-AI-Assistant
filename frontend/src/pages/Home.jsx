import { useState } from 'react';
import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import { useTheme, styled, alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  BrainCircuit,
  Lightbulb,
  Rocket,
  ArrowRight,
  BookOpen,
  Gavel,
  Scale
} from 'lucide-react';
import heroImage from '../assets/hero-image.jpg';

const MotionButton = motion(Button);
const MotionBox = motion(Box);

// Styled Components
const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '100vh',
  minHeight: '700px',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(8),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#ffffff',
  overflow: 'hidden',
  background: `linear-gradient(rgba(2, 6, 23, 0.3) 0%, rgba(2, 6, 23, 0.7) 100%), url(${heroImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent 0%, rgba(2, 6, 23, 0.4) 100%)',
    zIndex: 1,
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  borderRadius: '16px',
  boxShadow: theme.shadows[6],
  background: theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: theme.shadows[16],
    '& .feature-icon': {
      transform: 'scale(1.1) rotate(5deg)',
    }
  },
}));

const LawBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 16px',
  borderRadius: '24px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  margin: '0 8px 16px 8px',
  backdropFilter: 'blur(4px)',
  '& svg': {
    marginRight: '8px',
  }
}));

const Home = () => {
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    {
      title: 'Upload Documents',
      description: 'Securely upload federal, state, and local legal documents in multiple formats.',
      icon: <UploadCloud size={40} />,
      color: theme.palette.primary.main
    },
    {
      title: 'AI Analysis',
      description: 'Advanced NLP algorithms analyze and cross-reference legal documents with precision.',
      icon: <BrainCircuit size={40} />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Get Insights',
      description: 'Receive comprehensive summaries, precedent analysis, and legal interpretations.',
      icon: <Lightbulb size={40} />,
      color: theme.palette.success.main
    }
  ];

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05 }
  };

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ mb: 3 }}>
              <MotionBox whileHover={{ scale: 1.05 }} sx={{ display: 'inline-block' }}>
                <LawBadge>
                  <BookOpen size={18} />
                  <Typography variant="body2" fontWeight="600">FEDERAL</Typography>
                </LawBadge>
              </MotionBox>
              <MotionBox whileHover={{ scale: 1.05 }} sx={{ display: 'inline-block' }}>
                <LawBadge>
                  <Gavel size={18} />
                  <Typography variant="body2" fontWeight="600">STATE</Typography>
                </LawBadge>
              </MotionBox>
              <MotionBox whileHover={{ scale: 1.05 }} sx={{ display: 'inline-block' }}>
                <LawBadge>
                  <Scale size={18} />
                  <Typography variant="body2" fontWeight="600">LOCAL</Typography>
                </LawBadge>
              </MotionBox>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                fontSize: { xs: '3rem', md: '4.5rem' },
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(to right, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Master Your Legal <br /> Documentation
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 6,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                maxWidth: '700px',
                margin: '0 auto',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.6
              }}
            >
              Upload, analyze, and gain deep insights from legal documents with our intelligent RAG-powered assistant.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/register"
                endIcon={<ArrowRight size={22} />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                Get Started
              </MotionButton>
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="outlined"
                color="primary"
                size="large"
                component={Link}
                to="/try-it"
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Try It Now
              </MotionButton>
            </Box>
          </motion.div>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 2,
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: '600px',
                margin: '0 auto',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 400
              }}
            >
              Three simple steps to transform your legal document review process with LegalAI.
            </Typography>
          </motion.div>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 6,
            mt: 4
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={variants}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <FeatureCard>
                <CardContent sx={{ p: 5, height: '100%' }}>
                  <Box
                    className="feature-icon"
                    sx={{
                      width: '90px',
                      height: '90px',
                      margin: '0 auto 28px',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '24px',
                      backgroundColor: `${feature.color}15`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${feature.color}25, ${feature.color}10)`,
                        borderRadius: '24px',
                      }
                    }}
                  >
                    <AnimatePresence>
                      {hoveredCard === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            background: `radial-gradient(circle, ${feature.color}20, transparent 70%)`,
                            borderRadius: '24px',
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <Box sx={{
                      display: 'flex',
                      color: feature.color,
                      zIndex: 1,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      textAlign: 'center',
                      color: 'white'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </motion.div>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{
        background: 'linear-gradient(rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.8)), url(' + heroImage + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'white',
        py: 15,
        textAlign: 'center',
        position: 'relative',
        borderTop: `1px solid ${alpha('#ffffff', 0.1)}`,
      }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              Ready to Transform Your Workflow?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 6,
                color: 'rgba(255,255,255,0.8)',
                maxWidth: '600px',
                margin: '0 auto',
                fontWeight: 400
              }}
            >
              Join thousands of legal professionals who save hours every week.
            </Typography>
            <MotionButton
              whileHover={{
                scale: 1.05,
                boxShadow: `0 8px 24px ${theme.palette.primary.dark}`
              }}
              whileTap={{ scale: 0.95 }}
              variant="contained"
              color="secondary"
              size="large"
              component={Link}
              to="/try-it"
              endIcon={<Rocket size={22} />}
              sx={{
                px: 6,
                py: 1.8,
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1.1rem',
                textTransform: 'none'
              }}
            >
              Get Started
            </MotionButton>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;