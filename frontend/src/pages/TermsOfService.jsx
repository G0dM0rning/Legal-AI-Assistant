import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box, Container, Typography, Grid, Card, Chip,
    List, ListItem, ListItemIcon, ListItemText,
    Button, Alert, LinearProgress, Switch, FormControlLabel, Divider,
} from '@mui/material';
import { Scale, CheckCircle2, XCircle, Mail, Globe, Shield, Lock, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    color: 'white',
    padding: theme.spacing(15, 0, 10),
    position: 'relative',
    borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
    overflow: 'hidden',
}));

const TocItem = styled(Box)(({ theme, active }) => ({
    padding: theme.spacing(0.875, 1.5),
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: `3px solid ${active ? theme.palette.secondary.main : 'transparent'}`,
    backgroundColor: active ? `${theme.palette.secondary.main}12` : 'transparent',
    '&:hover': { backgroundColor: `${theme.palette.secondary.main}08` },
}));

const sections = [
    '1. Acceptance', '2. Service Description', '3. Eligibility',
    '4. User Accounts', '5. Acceptable Use', '6. Prohibited Activities',
    '7. Intellectual Property', '8. Disclaimer', '9. Termination',
    '10. Changes', '11. Governing Law', '12. Contact',
];

const sectionIds = [
    'acceptance', 'description', 'eligibility', 'accounts', 'acceptable-use',
    'prohibited', 'ip', 'disclaimer', 'termination', 'changes', 'governing-law', 'contact',
];

const TermsOfService = () => {
    const theme = useTheme();
    const [activeSection, setActiveSection] = useState('acceptance');
    const [readProgress, setReadProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            setReadProgress(Math.round((winScroll / height) * 100));
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const S = ({ id, title, children }) => (
        <Box id={id} sx={{ py: 4, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>{title}</Typography>
                {children}
            </motion.div>
        </Box>
    );

    const bodyText = (text) => <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>{text}</Typography>;
    const li = (items, color = '#10b981') => (
        <List dense>{items.map((item, i) => (
            <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle2 size={16} color={color} /></ListItemIcon>
                <ListItemText primary={<Typography variant="body2">{item}</Typography>} />
            </ListItem>
        ))}</List>
    );

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <LinearProgress variant="determinate" value={readProgress}
                sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' } }} />
            <HeroSection>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '14px', background: 'rgba(139,92,246,0.2)' }}><Scale size={32} color="#c4b5fd" /></Box>
                            <Chip label="Effective: February 18, 2026" sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }} />
                        </Box>
                        <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Terms of Service
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 700, lineHeight: 1.7, mb: 4, fontWeight: 400 }}>
                            Please read these Terms carefully before using LegalAI. By accessing or using our service, you agree to be bound by these terms.
                        </Typography>
                        <Alert severity="warning" sx={{ borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.15)', color: 'white', border: '1px solid rgba(245,158,11,0.3)', '& .MuiAlert-icon': { color: '#fbbf24' } }}>
                            <Typography variant="body2"><strong>Important:</strong> LegalAI is not a law firm and does not provide legal advice. All information is for educational purposes only.</Typography>
                        </Alert>
                    </motion.div>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={6}>
                    <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 2 }}>Sections</Typography>
                            {sections.map((s, i) => (
                                <TocItem key={i} active={activeSection === sectionIds[i]}
                                    onClick={() => { setActiveSection(sectionIds[i]); document.getElementById(sectionIds[i])?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <Typography variant="body2" sx={{ fontWeight: activeSection === sectionIds[i] ? 700 : 400, fontSize: '0.8rem' }}>{s}</Typography>
                                </TocItem>
                            ))}
                            <Alert severity="warning" sx={{ mt: 3, borderRadius: '12px' }}>
                                <Typography variant="caption">Not legal advice. Consult a qualified attorney.</Typography>
                            </Alert>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={9}>
                        <S id="acceptance" title="1. Acceptance of Terms">
                            {bodyText('By accessing or using LegalAI ("Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.')}
                            {bodyText('If you are using LegalAI on behalf of an organization, you represent that you have authority to bind that organization to these Terms.')}
                        </S>
                        <S id="description" title="2. Service Description">
                            {bodyText('LegalAI provides an AI-powered legal document assistant using Retrieval-Augmented Generation (RAG) to help users understand legal documents. Core features include:')}
                            {li(['AI-powered chat for legal document Q&A', 'Upload and processing of PDF, DOCX, TXT files', 'Semantic search across a curated legal knowledge base', 'Admin tools for knowledge base management', 'JWT-based user authentication and role management'])}
                            <Alert severity="info" sx={{ borderRadius: '12px' }}>LegalAI does not constitute legal advice and does not create an attorney-client relationship.</Alert>
                        </S>
                        <S id="eligibility" title="3. Eligibility">
                            {bodyText('To use LegalAI, you must be at least 18 years of age, have legal capacity to enter binding agreements, not be prohibited by applicable law, and provide accurate registration information.')}
                        </S>
                        <S id="accounts" title="4. User Accounts">
                            {bodyText('You are responsible for maintaining the confidentiality of your account credentials, providing accurate information, notifying us of unauthorized access immediately, and not transferring your account to others.')}
                        </S>
                        <S id="acceptable-use" title="5. Acceptable Use">
                            {bodyText('You may use LegalAI for lawful purposes including:')}
                            {li(['Personal legal research and document comprehension', 'Educational use by law students and researchers', 'Business legal document review for informational purposes', 'API integration into your own applications with attribution'])}
                        </S>
                        <S id="prohibited" title="6. Prohibited Activities">
                            {bodyText('The following are strictly prohibited and may result in immediate account termination:')}
                            <Grid container spacing={1.5}>
                                {[
                                    'Uploading malicious files or attempting to exploit the system',
                                    'Bypassing rate limits, authentication, or security controls',
                                    'Providing legal advice for compensation without appropriate licensing',
                                    'Impersonating any person, attorney, or legal professional',
                                    'Uploading documents containing illegal content or stolen IP',
                                    'Automated scraping of AI responses without written permission',
                                ].map((item, i) => (
                                    <Grid item xs={12} sm={6} key={i}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: '10px', border: `1px solid ${theme.palette.error.light}30`, background: `${theme.palette.error.main}05` }}>
                                            <XCircle size={16} color={theme.palette.error.main} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <Typography variant="body2" color="text.secondary">{item}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </S>
                        <S id="ip" title="7. Intellectual Property">
                            {bodyText('LegalAI software, algorithms, UI designs, and branding are owned by Waqar Ahmad and protected by copyright law. Documents you upload remain your property; you grant LegalAI a limited license to process them for the AI service only.')}
                        </S>
                        <S id="disclaimer" title="8. Disclaimer & Limitation of Liability">
                            <Alert severity="warning" sx={{ borderRadius: '12px', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>IMPORTANT LEGAL DISCLAIMER</Typography>
                                <Typography variant="body2">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. LEGALAI SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.</Typography>
                            </Alert>
                            {bodyText('Nothing on this platform constitutes legal advice. Always consult a qualified, licensed attorney before making legal decisions.')}
                        </S>
                        <S id="termination" title="9. Termination">
                            {bodyText('You may terminate your account at any time by contacting us. We may suspend or terminate accounts immediately for Terms violations, illegal activity, or service abuse, with 30 days\' notice for other reasons.')}
                        </S>
                        <S id="changes" title="10. Changes to Terms">
                            {bodyText('We may modify these Terms at any time. Material changes will be announced by email at least 14 days before taking effect. Continued use constitutes acceptance of the new Terms.')}
                        </S>
                        <S id="governing-law" title="11. Governing Law">
                            {bodyText('These Terms are governed by the laws of Pakistan. Disputes shall be resolved in the courts of Lahore, Punjab, Pakistan. EU consumer protection laws and GDPR apply to EU users regardless of this clause.')}
                        </S>
                        <S id="contact" title="12. Contact">
                            <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.secondary.main}30`, background: `${theme.palette.secondary.main}06` }}>
                                <Typography sx={{ fontWeight: 700, mb: 2 }}>LegalAI / Waqar Ahmad</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Mail size={16} color={theme.palette.primary.main} /><Typography variant="body2">waqarahmadisbest@gmail.com</Typography></Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Globe size={16} color={theme.palette.primary.main} /><Typography variant="body2">Lahore, Punjab, Pakistan</Typography></Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary">For Terms-related questions, include "Terms / Legal" in your email subject line.</Typography>
                            </Card>
                        </S>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button component={Link} to="/privacy" variant="outlined" sx={{ borderRadius: '10px' }}>Privacy Policy</Button>
                            <Button component={Link} to="/cookies" variant="outlined" sx={{ borderRadius: '10px' }}>Cookie Policy</Button>
                            <Button component={Link} to="/gdpr" variant="outlined" sx={{ borderRadius: '10px' }}>GDPR</Button>
                            <Button component={Link} to="/support" variant="contained" sx={{ borderRadius: '10px', ml: 'auto' }}>Contact Us</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default TermsOfService;
