import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box, Container, Typography, Grid, Card, Chip,
    Divider, List, ListItem, ListItemIcon, ListItemText,
    Button, Alert, LinearProgress,
} from '@mui/material';
import {
    Shield, Lock, Eye, Database, Trash2, Share2,
    Bell, Globe, UserCheck, Mail, ArrowRight, CheckCircle2,
    RefreshCw, FileText, Server, Key,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    color: 'white',
    padding: theme.spacing(15, 0, 10),
    position: 'relative',
    borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-20%', right: '-10%',
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
    },
}));

const SectionBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
}));

const TocItem = styled(Box)(({ theme, active }) => ({
    padding: theme.spacing(1, 1.5),
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: `3px solid ${active ? theme.palette.primary.main : 'transparent'}`,
    backgroundColor: active ? `${theme.palette.primary.main}12` : 'transparent',
    '&:hover': { backgroundColor: `${theme.palette.primary.main}08` },
}));

const sections = [
    { id: 'overview', title: '1. Overview', icon: FileText },
    { id: 'data-collected', title: '2. Data We Collect', icon: Database },
    { id: 'how-used', title: '3. How We Use Your Data', icon: Eye },
    { id: 'sharing', title: '4. Data Sharing', icon: Share2 },
    { id: 'storage', title: '5. Data Storage & Security', icon: Server },
    { id: 'rights', title: '6. Your Rights', icon: UserCheck },
    { id: 'cookies', title: '7. Cookies', icon: Globe },
    { id: 'retention', title: '8. Data Retention', icon: RefreshCw },
    { id: 'contact', title: '9. Contact Us', icon: Mail },
];

const PrivacyPolicy = () => {
    const theme = useTheme();
    const [activeSection, setActiveSection] = useState('overview');
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

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            {/* Read Progress Bar */}
            <LinearProgress
                variant="determinate"
                value={readProgress}
                sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' } }}
            />

            <HeroSection>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '14px', background: 'rgba(59,130,246,0.2)', backdropFilter: 'blur(10px)' }}>
                                <Shield size={32} color="#60a5fa" />
                            </Box>
                            <Chip label="Last updated: February 18, 2026" sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }} />
                        </Box>
                        <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Privacy Policy
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 700, lineHeight: 1.7, mb: 4, fontWeight: 400 }}>
                            At LegalAI, we take your privacy seriously. This policy explains what data we collect, how we use it, and your rights as a user of our platform.
                        </Typography>
                        <Alert severity="info" sx={{ borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.15)', color: 'white', border: '1px solid rgba(59,130,246,0.3)', '& .MuiAlert-icon': { color: '#60a5fa' } }}>
                            <Typography variant="body2">This document applies to all users of LegalAI, including visitors to our website, registered users, and admin users.</Typography>
                        </Alert>
                    </motion.div>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={6}>
                    {/* Table of Contents — Sticky Sidebar */}
                    <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 2 }}>Contents</Typography>
                            {sections.map(s => {
                                const Icon = s.icon;
                                return (
                                    <TocItem key={s.id} active={activeSection === s.id} onClick={() => { setActiveSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Icon size={14} />
                                            <Typography variant="body2" sx={{ fontWeight: activeSection === s.id ? 700 : 400, fontSize: '0.8rem' }}>{s.title}</Typography>
                                        </Box>
                                    </TocItem>
                                );
                            })}
                            <Box sx={{ mt: 4, p: 2, borderRadius: '12px', background: `${theme.palette.primary.main}10`, border: `1px solid ${theme.palette.primary.main}25` }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>Questions?</Typography>
                                <Typography variant="caption" color="text.secondary">Contact our privacy team at</Typography><br />
                                <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>waqarahmadisbest@gmail.com</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Main Content */}
                    <Grid item xs={12} md={9}>
                        <SectionBox id="overview">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}><FileText size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>1. Overview</Typography>
                                </Box>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                    LegalAI ("we", "us", or "our") is an AI-powered legal document assistant operated by Waqar Ahmad. This Privacy Policy governs the collection, use, and disclosure of information when you use LegalAI at <strong>legalai.app</strong> or any associated services.
                                </Typography>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                    By using LegalAI, you agree to the collection and use of information as described here. We are committed to complying with the General Data Protection Regulation (GDPR), Pakistan's Personal Data Protection Act, and applicable international privacy laws.
                                </Typography>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                    If you do not agree with this policy, please discontinue use of our services and contact us to have your data deleted.
                                </Typography>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="data-collected">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#10b98115', color: '#10b981' }}><Database size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>2. Data We Collect</Typography>
                                </Box>

                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Account Data</Typography>
                                <List dense sx={{ mb: 3 }}>
                                    {[
                                        { label: 'Name', detail: 'Provided during registration, used for personalization' },
                                        { label: 'Email address', detail: 'Used for login, notifications, and support communications' },
                                        { label: 'Password', detail: 'Stored as a bcrypt hash (12 rounds). We never see your plaintext password.' },
                                        { label: 'Role', detail: '"user" or "admin" — determines access levels' },
                                        { label: 'Account creation timestamp', detail: 'Stored for security audit purposes' },
                                    ].map((item, i) => (
                                        <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                                            <ListItemIcon sx={{ mt: 0.5, minWidth: 28 }}><CheckCircle2 size={16} color="#10b981" /></ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>}
                                                secondary={item.detail}
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Usage Data</Typography>
                                <List dense sx={{ mb: 3 }}>
                                    {[
                                        'Chat queries you send to the AI assistant',
                                        'Documents uploaded by admin users for training',
                                        'Login timestamps and session activity',
                                        'IP address and browser User-Agent (for security)',
                                        'System error logs (anonymized)',
                                    ].map((item, i) => (
                                        <ListItem key={i} sx={{ px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle2 size={16} color="#3b82f6" /></ListItemIcon>
                                            <ListItemText primary={<Typography variant="body2">{item}</Typography>} />
                                        </ListItem>
                                    ))}
                                </List>

                                <Alert severity="success" sx={{ borderRadius: '12px' }}>
                                    <Typography variant="body2"><strong>We do NOT collect:</strong> Payment information, government IDs, biometric data, or any sensitive personal information beyond what is listed above.</Typography>
                                </Alert>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="how-used">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#8b5cf615', color: '#8b5cf6' }}><Eye size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>3. How We Use Your Data</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    {[
                                        { icon: <UserCheck size={20} />, color: '#3b82f6', title: 'Authentication', body: 'Verify your identity, issue JWT tokens, and maintain session security.' },
                                        { icon: <Bell size={20} />, color: '#f59e0b', title: 'Service Improvement', body: 'Analyze aggregate usage patterns to improve LegalAI\'s accuracy and performance.' },
                                        { icon: <Shield size={20} />, color: '#10b981', title: 'Security', body: 'Detect suspicious activity, prevent unauthorized access, and protect your account.' },
                                        { icon: <Mail size={20} />, color: '#ef4444', title: 'Communications', body: 'Send account notifications, security alerts, and (optionally) product updates.' },
                                        { icon: <Lock size={20} />, color: '#8b5cf6', title: 'Legal Compliance', body: 'Fulfill our legal obligations under applicable data protection laws.' },
                                        { icon: <Database size={20} />, color: '#06b6d4', title: 'AI Training', body: 'Admin-uploaded documents are embedded to power the legal knowledge base. User queries are not used to retrain models.' },
                                    ].map((item, i) => (
                                        <Grid item xs={12} sm={6} key={i}>
                                            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                    <Box sx={{ p: 1, borderRadius: '8px', background: `${item.color}15`, color: item.color }}>{item.icon}</Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">{item.body}</Typography>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="sharing">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#f59e0b15', color: '#f59e0b' }}><Share2 size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>4. Data Sharing</Typography>
                                </Box>
                                <Alert severity="warning" sx={{ borderRadius: '12px', mb: 3 }}>
                                    <Typography variant="body2"><strong>We do not sell your data.</strong> We never sell, rent, or trade your personal information to third parties for marketing purposes.</Typography>
                                </Alert>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>We only share data in these limited circumstances:</Typography>
                                <List>
                                    {[
                                        { title: 'Google Gemini API', detail: 'Chat queries and document chunks are sent to Google\'s Gemini API to generate AI responses. Google\'s data use is governed by their privacy policy.' },
                                        { title: 'MongoDB Atlas', detail: 'User accounts and training data are stored in MongoDB Atlas (cloud database). MongoDB\'s data processing agreement covers this transfer.' },
                                        { title: 'Legal Requirements', detail: 'We may disclose information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of our users.' },
                                        { title: 'Business Transfer', detail: 'In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of that transaction, with advance notice provided.' },
                                    ].map((item, i) => (
                                        <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start', mb: 1 }}>
                                            <ListItemIcon sx={{ mt: 0.5, minWidth: 28 }}><ArrowRight size={16} color={theme.palette.primary.main} /></ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>}
                                                secondary={<Typography variant="body2" color="text.secondary">{item.detail}</Typography>}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="storage">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#06b6d415', color: '#06b6d4' }}><Server size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>5. Data Storage & Security</Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    {[
                                        { icon: <Key size={20} />, color: '#3b82f6', title: 'Password Security', body: 'All passwords are hashed using bcrypt with 12 salt rounds. Plaintext passwords are never stored or logged.' },
                                        { icon: <Lock size={20} />, color: '#8b5cf6', title: 'JWT Tokens', body: 'Authentication tokens expire in 24 hours and are signed with a strong HMAC-SHA256 secret key.' },
                                        { icon: <Shield size={20} />, color: '#10b981', title: 'HTTPS Encryption', body: 'All data in transit is encrypted via TLS 1.3. MongoDB Atlas uses encryption at rest.' },
                                        { icon: <Server size={20} />, color: '#f59e0b', title: 'Data Location', body: 'Data is stored on servers within your region when possible. MongoDB Atlas cluster location is configured per deployment.' },
                                    ].map((item, i) => (
                                        <Grid item xs={12} sm={6} key={i}>
                                            <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                    <Box sx={{ p: 1, borderRadius: '8px', background: `${item.color}15`, color: item.color }}>{item.icon}</Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">{item.body}</Typography>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="rights">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#ef444415', color: '#ef4444' }}><UserCheck size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>6. Your Rights</Typography>
                                </Box>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>Under GDPR and applicable privacy laws, you have the following rights regarding your personal data:</Typography>
                                <Grid container spacing={2}>
                                    {[
                                        { right: 'Right to Access', desc: 'Request a copy of all personal data we hold about you.' },
                                        { right: 'Right to Rectification', desc: 'Correct inaccurate or incomplete personal information.' },
                                        { right: 'Right to Erasure', desc: 'Request deletion of your account and all associated data ("right to be forgotten").' },
                                        { right: 'Right to Portability', desc: 'Receive your data in a structured, machine-readable format.' },
                                        { right: 'Right to Restrict Processing', desc: 'Limit how we process your data in certain circumstances.' },
                                        { right: 'Right to Object', desc: 'Object to processing based on legitimate interests or for direct marketing.' },
                                    ].map((item, i) => (
                                        <Grid item xs={12} sm={6} key={i}>
                                            <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>{item.right}</Typography>
                                                <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
                                    <Typography variant="body2">To exercise any of these rights, email <strong>waqarahmadisbest@gmail.com</strong> with the subject line "Privacy Request". We will respond within <strong>30 days</strong>.</Typography>
                                </Alert>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="cookies">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#84cc1615', color: '#84cc16' }}><Globe size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>7. Cookies</Typography>
                                </Box>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                    LegalAI uses minimal cookies and localStorage to keep you logged in. We do not use advertising cookies or tracking pixels. See our <Box component={Link} to="/cookies" sx={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Cookie Policy</Box> for full details.
                                </Typography>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="retention">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#f9731615', color: '#f97316' }}><RefreshCw size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>8. Data Retention</Typography>
                                </Box>
                                <List>
                                    {[
                                        { label: 'Account data', period: 'Retained until you request deletion' },
                                        { label: 'Training documents (embeddings)', period: 'Retained indefinitely until admin deletes them' },
                                        { label: 'Chat query logs', period: 'Not retained beyond the current session by default' },
                                        { label: 'Security logs (IP, login timestamps)', period: 'Retained for 90 days, then purged automatically' },
                                        { label: 'Deleted account data', period: 'Permanently erased within 30 days of deletion request' },
                                    ].map((item, i) => (
                                        <ListItem key={i} sx={{ px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle2 size={16} color={theme.palette.primary.main} /></ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>}
                                                secondary={item.period}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </motion.div>
                        </SectionBox>

                        <SectionBox id="contact">
                            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '10px', background: '#3b82f615', color: '#3b82f6' }}><Mail size={22} /></Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>9. Contact Us</Typography>
                                </Box>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>
                                    For privacy-related questions, data requests, or complaints, please contact our Data Controller:
                                </Typography>
                                <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.primary.main}30`, background: `${theme.palette.primary.main}06` }}>
                                    <Typography sx={{ fontWeight: 700, mb: 2 }}>Data Controller: LegalAI / Waqar Ahmad</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Mail size={16} color={theme.palette.primary.main} /><Typography variant="body2">waqarahmadisbest@gmail.com</Typography></Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Globe size={16} color={theme.palette.primary.main} /><Typography variant="body2">Lahore, Punjab, Pakistan</Typography></Box>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="body2" color="text.secondary">Response time: Within 30 days as required by GDPR. For urgent matters, include "URGENT" in your subject line.</Typography>
                                </Card>
                            </motion.div>
                        </SectionBox>

                        {/* Navigation */}
                        <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button component={Link} to="/terms" variant="outlined" sx={{ borderRadius: '10px' }}>Terms of Service</Button>
                            <Button component={Link} to="/cookies" variant="outlined" sx={{ borderRadius: '10px' }}>Cookie Policy</Button>
                            <Button component={Link} to="/gdpr" variant="outlined" sx={{ borderRadius: '10px' }}>GDPR Compliance</Button>
                            <Button component={Link} to="/support" variant="contained" sx={{ borderRadius: '10px', ml: 'auto' }}>Contact Support</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default PrivacyPolicy;
