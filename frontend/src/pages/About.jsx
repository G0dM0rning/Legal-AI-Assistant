import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
  Box, Container, Typography, Grid, Card, Button,
  Chip, Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Brain, Scale, BookOpen, Shield, Globe, Zap, Target,
  Database, CheckCircle2, ArrowRight, XCircle,
  Award, TrendingUp, FileSearch,
  Lightbulb, Rocket, HeartHandshake, Users, Gavel,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage1 from '../assets/hero-image1.jpg';

/* ─── Styled Components ────────────────────────────────────────────────────── */

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '80vh',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(8),
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
  borderBottom: `1px solid ${alpha('#ffffff', 0.05)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: `url(${heroImage1}) center/cover no-repeat`,
    opacity: 0.08,
  },
}));

const GlowOrb = styled(Box)({
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(80px)',
  pointerEvents: 'none',
});

const GradientText = styled('span')(({ color = '#60a5fa' }) => ({
  background: `linear-gradient(135deg, ${color}, #a78bfa)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}));

const SectionLabel = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 16px',
  borderRadius: '100px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
  background: alpha(theme.palette.primary.main, 0.08),
  marginBottom: 16,
}));

const StatCard = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '20px',
  background: alpha('#0f172a', 0.6),
  border: `1px solid ${alpha('#3b82f6', 0.2)}`,
  backdropFilter: 'blur(10px)',
  textAlign: 'center',
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: alpha('#0f172a', 0.8),
    borderColor: alpha('#3b82f6', 0.4),
    transform: 'translateY(-5px)',
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '20px',
  background: alpha('#1e293b', 0.5),
  backdropFilter: 'blur(12px)',
  color: '#f8fafc',
  transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 24px 64px ${alpha(theme.palette.primary.main, 0.18)}`,
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

const CompareCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '20px',
  background: alpha('#1e293b', 0.4),
  backdropFilter: 'blur(12px)',
  color: '#f8fafc',
  overflow: 'hidden',
  transition: 'all 0.35s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: `0 24px 64px ${alpha(theme.palette.primary.main, 0.16)}`,
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  position: 'relative',
  paddingBottom: theme.spacing(4),
  '&:not(:last-child)::after': {
    content: '""',
    position: 'absolute',
    left: 20,
    top: 44,
    bottom: 0,
    width: 2,
    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`,
  },
}));

/* ─── AnimatedCounter ───────────────────────────────────────────────────────── */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericTarget));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(numericTarget);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  const prefix = target.replace(/[0-9.+%,]+.*/, '');
  const postfix = target.replace(/^[^0-9]*[0-9.,]+/, '');

  return (
    <span ref={ref}>
      {prefix}{Number.isInteger(parseFloat(target.replace(/[^0-9.]/g, ''))) ? count.toLocaleString() : count}{postfix}
    </span>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────────── */
const About = () => {
  const theme = useTheme();

  const stats = [
    { value: '10,000+', label: 'Documents Processed', icon: <FileSearch size={28} />, color: '#3b82f6' },
    { value: '95%', label: 'Answer Accuracy', icon: <Target size={28} />, color: '#10b981' },
    { value: '24/7', label: 'Always Available', icon: <Zap size={28} />, color: '#f59e0b' },
    { value: '100+', label: 'Legal Categories', icon: <BookOpen size={28} />, color: '#8b5cf6' },
  ];

  const coreValues = [
    { icon: <Scale size={28} />, color: '#3b82f6', title: 'Democratizing Legal Access', body: 'Legal knowledge should not be a privilege. We break down complex legal language into clear, actionable insights anyone can understand — regardless of background or budget.' },
    { icon: <Shield size={28} />, color: '#10b981', title: 'Privacy by Design', body: 'Your documents and queries are yours. We architect our systems from the ground up with data minimization, end-to-end encryption, and zero third-party ad tracking.' },
    { icon: <Brain size={28} />, color: '#8b5cf6', title: 'AI with Accountability', body: 'We pair cutting-edge Gemini AI with Retrieval-Augmented Generation (RAG) so answers are always grounded in real legal documents — never hallucinated.' },
    { icon: <HeartHandshake size={28} />, color: '#f59e0b', title: 'Human-Centered', body: 'AI augments — not replaces — human legal judgment. We are a tool to empower lawyers, students, and citizens, always directing users to consult real attorneys for critical decisions.' },
    { icon: <TrendingUp size={28} />, color: '#ef4444', title: 'Continuous Improvement', body: 'Our models and knowledge base are updated regularly. Admin-curated documents keep answers current with the latest laws, regulations, and precedents.' },
    { icon: <Globe size={28} />, color: '#06b6d4', title: 'Global Perspective', body: 'While rooted in Pakistani law, LegalAI is built to handle diverse jurisdictions. Our roadmap includes multilingual support and broader international legal coverage.' },
  ];

  const roadmap = [
    { year: 'Q1 2022', title: 'Project Founded', body: 'Waqar Ahmad, Rizwan Babar, and Muhammad Haseeb formed the team. Initial architecture designed around FastAPI and LangChain with FAISS vector storage.', done: true },
    { year: 'Q3 2022', title: 'Beta Launch', body: 'First working prototype with PDF upload, document chunking, and basic Q&A. Tested internally with 50+ legal documents across 10 categories.', done: true },
    { year: 'Q1 2023', title: 'Google Gemini Integration', body: 'Migrated from OpenAI to Google Gemini for superior performance and cost efficiency. Achieved 95% answer accuracy on our benchmark test set.', done: true },
    { year: 'Q3 2023', title: 'Admin Dashboard & Auth', body: 'Full JWT authentication system, role-based access control, and premium admin dashboard with document management, user analytics, and system health monitoring.', done: true },
    { year: 'Q1 2024', title: 'Security Hardening & Production', body: 'Env-based secrets management, bcrypt password hashing, request tracing middleware, GDPR-compliant data policies, and Docker deployment pipeline.', done: true },
    { year: '2025 →', title: 'Multilingual & Global Expansion', body: 'Expanding to international legal systems including UK, EU, and US law. Arabic and Urdu language support planned. Mobile app coming soon.', done: false },
  ];



  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <Box sx={{ overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════ */}
      <HeroSection>
        {/* Background Orbs */}
        <GlowOrb sx={{ width: 600, height: 600, top: -200, left: -150, background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)' }} />
        <GlowOrb sx={{ width: 500, height: 500, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
        <GlowOrb sx={{ width: 350, height: 350, top: '40%', left: '55%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={7}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUpVariant}>
                  <SectionLabel>
                    <Rocket size={14} color={theme.palette.primary.main} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>OUR STORY</Typography>
                  </SectionLabel>
                </motion.div>

                <motion.div variants={fadeUpVariant}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '3.5rem', md: '5rem' },
                      lineHeight: 1,
                      mb: 2,
                      background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Democratizing <br />
                    <span style={{ color: '#3b82f6', WebkitTextFillColor: '#3b82f6' }}>The Law</span>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUpVariant}>
                  <Typography variant="h6"
                    sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, mb: 4, maxWidth: 600, fontWeight: 400, fontSize: '1.15rem' }}>
                    LegalAI was built on one conviction — that access to legal knowledge shouldn't be gatekept by expensive lawyers or impenetrable jargon. We built an AI that reads the law so you don't have to.
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUpVariant}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button component={Link} to="/try-it" variant="contained" size="large"
                      endIcon={<ArrowRight size={18} />}
                      sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 24px rgba(59,130,246,0.4)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(59,130,246,0.5)' } }}>
                      Try LegalAI Free
                    </Button>
                    <Button component={Link} to="/documentation" variant="outlined" size="large"
                      sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 600, borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)' } }}>
                      Read the Docs
                    </Button>
                  </Box>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Hero Right — floating card stack */}
            <Grid item xs={12} lg={5} sx={{ display: { xs: 'none', lg: 'block' } }}>
              <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
                <Box sx={{ position: 'relative', height: 480 }}>
                  {/* Main card */}
                  <Box sx={{ position: 'absolute', top: 40, left: 0, right: 40, p: 3.5, borderRadius: '24px', background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(59,130,246,0.35)', backdropFilter: 'blur(20px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                      <Box sx={{ p: 1.2, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}><Scale size={20} color="white" /></Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>LegalAI Assistant</Typography>
                      <Box sx={{ ml: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>"What are my rights if my employer doesn't pay overtime?"</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
                        Under Pakistan's Payment of Wages Act, 1936 — your employer is required to pay overtime at twice the ordinary rate. You may file a claim with the Labour Court within 12 months...
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
                      {['Labour Law', 'Pakistan', 'Wages Act 1936'].map(tag => (
                        <Chip key={tag} label={tag} size="small" sx={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </Box>

                  {/* Floating stat chips */}
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <Box sx={{ position: 'absolute', bottom: 60, right: 0, p: 2, borderRadius: '16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(12px)' }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>95%</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Accuracy Rate</Typography>
                    </Box>
                  </motion.div>
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                    <Box sx={{ position: 'absolute', bottom: 140, right: 10, p: 1.5, borderRadius: '14px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', backdropFilter: 'blur(12px)' }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>10K+</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Docs Analyzed</Typography>
                    </Box>
                  </motion.div>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>



      {/* ═══════════════════════════════════════════════
          2. ANIMATED STATS BANNER
      ═══════════════════════════════════════════════ */}
      <Box sx={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', py: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <Grid container spacing={3}>
              {stats.map((stat, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <motion.div variants={fadeUpVariant}>
                    <StatCard whileHover={{ scale: 1.02 }}>
                      <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '14px', background: alpha(stat.color, 0.15), color: stat.color, mb: 2 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', mb: 0.5, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                        <AnimatedCounter target={stat.value} />
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{stat.label}</Typography>
                    </StatCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          3. OUR STORY — ORIGIN & MISSION
      ═══════════════════════════════════════════════ */}
      < Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <SectionLabel>
                <BookOpen size={14} color={theme.palette.primary.main} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>OUR ORIGIN</Typography>
              </SectionLabel>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, color: 'white' }}>
                Born from a Frustration with <span style={{ color: '#3b82f6' }}>Inaccessible Law</span>
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                We are the students of University Of Management & Technology who
                witnessed firsthand how ordinary people — laborers, small business
                owners, students — were being exploited simply because they couldn't
                afford legal counsel or understand legal documents in front of them.
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                They built LegalAI as their final year project with one clear goal: <strong style={{ color: 'white' }}>make
                  the law readable for everyone.</strong> Using Google Gemini, LangChain, and
                a FAISS-powered RAG pipeline, they created an AI that doesn't just
                answer questions — it grounds every answer in real legal documents.
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                Today, LegalAI has processed over 10,000 legal documents, serves hundreds of users weekly, and continues to grow its knowledge base across Pakistani, Common Law, and international legal frameworks.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {['Founded 2022', 'Lahore, Pakistan', 'Open to Collaboration', 'GDPR Compliant'].map(tag => (
                  <Chip key={tag} label={tag} variant="outlined" sx={{ fontWeight: 600, borderRadius: '8px' }} />
                ))}
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <Box sx={{ p: 4, borderRadius: '24px', border: `1px solid ${alpha('#3b82f6', 0.2)}`, background: alpha('#1e293b', 0.5), backdropFilter: 'blur(12px)', color: '#f8fafc' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: 'white' }}>
                  <Box sx={{ p: 0.75, borderRadius: '8px', background: alpha('#3b82f6', 0.15), color: '#3b82f6' }}><Target size={18} /></Box>
                  Our Reach
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {[
                    { label: 'Team Size', value: '3 Core Members' },
                    { label: 'Founded', value: '2022, Lahore' },
                    { label: 'Legal Categories', value: '100+ Covered' },
                    { label: 'Open Source', value: 'MIT Licensed' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ p: 2, borderRadius: '12px', background: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container >

      {/* ═══════════════════════════════════════════════
          4. CORE VALUES
      ═══════════════════════════════════════════════ */}
      < Box sx={{ background: '#020617', py: { xs: 8, md: 12 }, borderTop: `1px solid ${alpha('#3b82f6', 0.1)}`, borderBottom: `1px solid ${alpha('#3b82f6', 0.1)}` }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <SectionLabel sx={{ justifyContent: 'center' }}>
                <Lightbulb size={14} color="#3b82f6" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b82f6', letterSpacing: 1 }}>WHAT WE STAND FOR</Typography>
              </SectionLabel>
              <Typography variant="h2" align="center" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                Our <span style={{ color: '#3b82f6' }}>Core Values</span>
              </Typography>
              <Typography variant="body1" align="center" sx={{ maxWidth: 700, mx: 'auto', mb: 8, color: 'rgba(255,255,255,0.6)' }}>
                Every product decision, every security policy, and every design choice at LegalAI flows from our core principles.
              </Typography>
            </Box>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <Grid container spacing={3}>
              {coreValues.map((val, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <motion.div variants={fadeUpVariant} style={{ height: '100%' }}>
                    <FeatureCard>
                      <Box sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '14px', background: alpha(val.color, 0.12), color: val.color, mb: 2.5 }}>
                          {val.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                          {val.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                          {val.body}
                        </Typography>
                      </Box>
                      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${val.color}, transparent)` }} />
                    </FeatureCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box >

      {/* ═══════════════════════════════════════════════
          5. WHY LEGALAI — COMPARISON
      ═══════════════════════════════════════════════ */}
      < Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <SectionLabel sx={{ justifyContent: 'center' }}>
              <Scale size={14} color={theme.palette.primary.main} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>THE DIFFERENCE</Typography>
            </SectionLabel>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
              Why Choose <GradientText>LegalAI?</GradientText>
            </Typography>
            <Typography sx={{ maxWidth: 620, mx: 'auto', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)' }}>
              Most tools give generic answers. LegalAI grounds every response in real legal documents using RAG — the gold standard for factual AI.
            </Typography>
          </Box>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <Grid container spacing={4}>
            {/* LegalAI Column */}
            <Grid item xs={12} md={5}>
              <motion.div variants={fadeUpVariant} style={{ height: '100%' }}>
                <Box sx={{
                  height: '100%', p: 4, borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08))',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <Box sx={{ position: 'absolute', top: 0, right: 0, px: 2, py: 0.75, borderRadius: '0 24px 0 12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white' }}>RECOMMENDED</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 1 }}>
                    <Box sx={{ p: 1.5, borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>
                      <Scale size={24} color="white" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>LegalAI</Typography>
                  </Box>
                  {[
                    'Grounded in real legal documents via RAG',
                    'Sources every answer with document citations',
                    'Updated knowledge base by legal domain admins',
                    'Privacy-first: no ad tracking, GDPR compliant',
                    'Specialized in legal terminology & jurisdiction',
                    'Instant answers — no appointments needed',
                    'Accessible 24/7 at zero cost for basic use',
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ mt: 0.25, flexShrink: 0, color: '#10b981' }}><CheckCircle2 size={18} /></Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>

            {/* VS Divider */}
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme.palette.divider}`, background: theme.palette.background.paper, mx: 'auto', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary' }}>VS</Typography>
                </Box>
                <Box sx={{ width: 2, height: 200, background: `linear-gradient(180deg, transparent, ${theme.palette.divider}, transparent)`, mx: 'auto', display: { xs: 'none', md: 'block' } }} />
              </Box>
            </Grid>

            {/* Generic AI Column */}
            <Grid item xs={12} md={5}>
              <motion.div variants={fadeUpVariant} style={{ height: '100%' }}>
                <Box sx={{
                  height: '100%', p: 4, borderRadius: '24px',
                  background: alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  opacity: 0.85,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: '14px', background: alpha(theme.palette.text.secondary, 0.12) }}>
                      <Brain size={24} color={theme.palette.text.secondary} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>Generic AI Chatbots</Typography>
                  </Box>
                  {[
                    'Trained on general data — may hallucinate law',
                    'No citations — cannot verify the source',
                    'Static knowledge cutoff, outdated case law',
                    'Data used for ad targeting and model training',
                    'No legal specialization or jurisdiction awareness',
                    'Requires rephrasing and prompt engineering',
                    'Subscription costs or limited free tiers',
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ mt: 0.25, flexShrink: 0, color: '#ef4444' }}><XCircle size={18} /></Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>

      {/* ═══════════════════════════════════════════════
          7. TIMELINE / ROADMAP
      ═══════════════════════════════════════════════ */}
      < Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <SectionLabel sx={{ justifyContent: 'center' }}>
              <TrendingUp size={14} color={theme.palette.primary.main} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>JOURNEY SO FAR</Typography>
            </SectionLabel>
            <Typography variant="h2" align="center" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
              Our <span style={{ color: '#3b82f6' }}>Roadmap</span>
            </Typography>
            <Typography variant="body1" align="center" sx={{ maxWidth: 600, mx: 'auto', mb: 8, color: 'rgba(255,255,255,0.6)' }}>
              From a university final-year project to a production AI platform — here's how we got here.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={0} justifyContent="center">
          <Grid item xs={12} md={8}>
            {roadmap.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <TimelineItem>
                  <Box sx={{ flexShrink: 0 }}>
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: item.done ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : alpha(theme.palette.background.paper, 0.8),
                      border: `2px solid ${item.done ? '#3b82f6' : theme.palette.divider}`,
                      boxShadow: item.done ? '0 0 20px rgba(59,130,246,0.4)' : 'none',
                    }}>
                      {item.done ? <CheckCircle2 size={18} color="white" /> : <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: theme.palette.divider }} />}
                    </Box>
                  </Box>
                  <Box sx={{ pb: 1 }}>
                    <Chip label={item.year} size="small" sx={{ mb: 1, fontWeight: 700, borderRadius: '8px', background: item.done ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.secondary, 0.08), color: item.done ? theme.palette.primary.main : 'text.secondary', border: `1px solid ${item.done ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider}` }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{item.body}</Typography>
                  </Box>
                </TimelineItem>
              </motion.div>
            ))}
          </Grid>
        </Grid>
      </Container>

      {/* ═══════════════════════════════════════════════
          8. HOW IT WORKS (RAG Pipeline)
      ═══════════════════════════════════════════════ */}
      < Box sx={{ background: alpha(theme.palette.background.paper, 0.4), py: { xs: 8, md: 12 }, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <SectionLabel sx={{ justifyContent: 'center' }}>
                <Brain size={14} color={theme.palette.primary.main} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>HOW IT WORKS</Typography>
              </SectionLabel>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
                Answers Grounded in <GradientText>Real Law</GradientText>
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', lineHeight: 1.8 }}>
                Unlike generic chatbots, LegalAI uses Retrieval-Augmented Generation (RAG) — every answer is sourced from actual legal documents, not invented.
              </Typography>
            </Box>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <Grid container spacing={2} alignItems="stretch">
              {[
                { step: '01', icon: <FileSearch size={26} />, color: '#3b82f6', title: 'Document Ingestion', body: 'Admin uploads PDF, DOCX, or TXT legal documents. LegalAI chunks them into semantically meaningful segments and generates dense vector embeddings.' },
                { step: '02', icon: <Database size={26} />, color: '#8b5cf6', title: 'Vector Indexing', body: 'Embeddings are stored in a FAISS vector index for lightning-fast semantic similarity search across thousands of document chunks.' },
                { step: '03', icon: <Brain size={26} />, color: '#10b981', title: 'Semantic Retrieval', body: 'When you ask a question, your query is embedded and compared against the index. The top-k most relevant chunks are retrieved as context.' },
                { step: '04', icon: <Zap size={26} />, color: '#f59e0b', title: 'Gemini Generation', body: 'Google Gemini receives your question + the retrieved legal context and generates a precise, grounded answer — not a hallucination.' },
              ].map((step, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <motion.div variants={fadeUpVariant} style={{ height: '100%' }}>
                    <Box sx={{ p: 3, borderRadius: '20px', border: `1px solid ${alpha(step.color, 0.25)}`, background: alpha(step.color, 0.04), height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', '&:hover': { boxShadow: `0 16px 48px ${alpha(step.color, 0.18)}`, transform: 'translateY(-4px)' } }}>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: alpha(step.color, 0.15), lineHeight: 1, mb: 2, fontSize: '4rem' }}>{step.step}</Typography>
                      <Box sx={{ p: 1.5, borderRadius: '12px', background: alpha(step.color, 0.12), color: step.color, display: 'inline-flex', mb: 2 }}>{step.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.3 }}>{step.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>{step.body}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════
          9. CTA
      ═══════════════════════════════════════════════ */}
      < Box sx={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #111827 100%)', py: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <GlowOrb sx={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '20px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', mb: 3 }}>
                <Scale size={36} color="#60a5fa" />
              </Box>
            </Box>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 900, color: 'white', mb: 2.5, fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.2 }}>
              Ready to Experience <GradientText color="#60a5fa">LegalAI?</GradientText>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 5, fontSize: '1.15rem', lineHeight: 1.8, maxWidth: 560, mx: 'auto' }}>
              Join hundreds of users — lawyers, students, and citizens — who get clear answers about their legal rights in seconds.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button component={Link} to="/try-it" variant="contained" size="large"
                endIcon={<ArrowRight size={18} />}
                sx={{ borderRadius: '14px', px: 5, py: 1.75, fontWeight: 700, fontSize: '1.05rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 16px 48px rgba(59,130,246,0.5)' } }}>
                Try It Free — No Signup
              </Button>
              <Button component={Link} to="/register" variant="outlined" size="large"
                sx={{ borderRadius: '14px', px: 5, py: 1.75, fontWeight: 600, fontSize: '1.05rem', borderColor: 'rgba(255,255,255,0.25)', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)' } }}>
                Create an Account
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 4, color: 'rgba(255,255,255,0.35)' }}>
              No credit card required · GDPR Compliant · Privacy by Design
            </Typography>
          </motion.div>
        </Container>
      </Box>

    </Box >
  );
};

export default About;