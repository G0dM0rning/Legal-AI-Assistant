import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box, Container, Typography, Grid, Card, Chip,
    List, ListItem, ListItemIcon, ListItemText,
    Button, Alert, LinearProgress, Divider,
} from '@mui/material';
import {
    Shield, CheckCircle2, UserCheck, Lock, Database, Trash2,
    RefreshCw, Globe, Mail, FileText, Eye, ArrowRight, Flag,
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
        background: `radial-gradient(circle, ${alpha('#818cf8', 0.15)} 0%, transparent 70%)`,
    },
}));

const TocItem = styled(Box)(({ theme, active }) => ({
    padding: theme.spacing(0.875, 1.5),
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: `3px solid ${active ? '#818cf8' : 'transparent'}`,
    backgroundColor: active ? 'rgba(129,140,248,0.12)' : 'transparent',
    '&:hover': { backgroundColor: 'rgba(129,140,248,0.08)' },
}));

const RightCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[10],
        borderColor: '#818cf8',
    },
}));

const sections = [
    { id: 'overview', label: '1. GDPR Overview' },
    { id: 'lawful-basis', label: '2. Lawful Basis' },
    { id: 'data-subject-rights', label: '3. Your Rights' },
    { id: 'data-transfers', label: '4. International Transfers' },
    { id: 'dpa', label: '5. Data Processing' },
    { id: 'breach', label: '6. Data Breach Policy' },
    { id: 'children', label: '7. Children\'s Data' },
    { id: 'dpo', label: '8. Data Controller' },
    { id: 'complaints', label: '9. Filing Complaints' },
];

const GDPRCompliance = () => {
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

    const S = ({ id, title, children }) => (
        <Box id={id} sx={{ py: 4, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>{title}</Typography>
                {children}
            </motion.div>
        </Box>
    );

    const gdprRights = [
        { icon: <Eye size={22} />, color: '#3b82f6', title: 'Right to Access (Art. 15)', body: 'You can request a complete copy of all personal data we hold about you, including how it is used, who it is shared with, and how long it is retained. We respond within 30 days free of charge.' },
        { icon: <RefreshCw size={22} />, color: '#10b981', title: 'Right to Rectification (Art. 16)', body: 'If any personal data we hold about you is inaccurate or incomplete, you have the right to have it corrected. Contact us with supporting evidence and we will update your data within 7 days.' },
        { icon: <Trash2 size={22} />, color: '#ef4444', title: 'Right to Erasure (Art. 17)', body: 'Also known as the "right to be forgotten". You can request deletion of your account and all associated personal data. We will erase it within 30 days, except where we have a legal obligation to retain it.' },
        { icon: <Lock size={22} />, color: '#8b5cf6', title: 'Right to Restrict Processing (Art. 18)', body: 'You can ask us to pause processing of your data while you contest its accuracy, or while you exercise your right to object. We will not process restricted data except for storage.' },
        { icon: <Database size={22} />, color: '#f59e0b', title: 'Right to Data Portability (Art. 20)', body: 'You can request your personal data in a structured, machine-readable format (JSON) and have it transferred directly to another controller where technically feasible.' },
        { icon: <Shield size={22} />, color: '#06b6d4', title: 'Right to Object (Art. 21)', body: 'You can object to processing of your personal data at any time when processing is based on legitimate interests or for direct marketing. We will stop processing unless we have compelling legitimate grounds.' },
        { icon: <UserCheck size={22} />, color: '#84cc16', title: 'Right to Withdraw Consent', body: 'Where processing is based on your consent, you can withdraw it at any time without affecting the lawfulness of processing before withdrawal.' },
        { icon: <Flag size={22} />, color: '#f97316', title: 'Right Not to be Subject to Automated Decisions', body: 'LegalAI does not make solely automated decisions with legal or significant effects on you. AI responses are informational tools, not binding determinations.' },
    ];

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <LinearProgress variant="determinate" value={readProgress}
                sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #818cf8, #06b6d4)' } }} />

            <HeroSection>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '14px', background: 'rgba(99,102,241,0.25)' }}>
                                <Shield size={32} color="#a5b4fc" />
                            </Box>
                            <Chip label="GDPR Compliant · February 2026" sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }} />
                        </Box>
                        <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            GDPR Compliance
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 700, lineHeight: 1.7, mb: 4, fontWeight: 400 }}>
                            LegalAI is committed to full compliance with the EU General Data Protection Regulation (GDPR). This page details our data processing activities and your rights as a data subject.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {[
                                { label: '✅ GDPR Art. 13/14 Compliant', color: '#4ade80' },
                                { label: '✅ Data Minimization', color: '#60a5fa' },
                                { label: '✅ Right to Erasure', color: '#c4b5fd' },
                                { label: '✅ Consent-Based Processing', color: '#fbbf24' },
                            ].map((badge, i) => (
                                <Box key={i} sx={{ px: 2, py: 0.75, borderRadius: '10px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: badge.color }}>{badge.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </motion.div>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={6}>
                    {/* Sidebar ToC */}
                    <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 2 }}>Contents</Typography>
                            {sections.map(s => (
                                <TocItem key={s.id} active={activeSection === s.id}
                                    onClick={() => { setActiveSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <Typography variant="body2" sx={{ fontWeight: activeSection === s.id ? 700 : 400, fontSize: '0.8rem' }}>{s.label}</Typography>
                                </TocItem>
                            ))}
                            <Box sx={{ mt: 4, p: 2, borderRadius: '12px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#818cf8' }}>EU Data Subject Requests</Typography>
                                <Typography variant="caption" color="text.secondary">Email: waqarahmadisbest@gmail.com</Typography><br />
                                <Typography variant="caption" color="text.secondary">Subject: "GDPR Request"</Typography><br />
                                <Typography variant="caption" color="text.secondary">Response: Within 30 days</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Main Content */}
                    <Grid item xs={12} md={9}>
                        <S id="overview" title="1. GDPR Overview">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                The General Data Protection Regulation (GDPR) (EU) 2016/679 is a comprehensive data protection law that applies to organizations processing personal data of EU/EEA residents. LegalAI complies with GDPR wherever EU users are involved.
                            </Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                LegalAI acts as a <strong>Data Controller</strong> for user account data and a <strong>Data Processor</strong> for documents uploaded by admin users. We have designed our data architecture to be GDPR-compliant by default through:
                            </Typography>
                            <List dense>
                                {[
                                    'Privacy by Design — minimal data collection from the start',
                                    'Pseudonymization — user IDs are MongoDB ObjectIDs, not real names',
                                    'Security by Default — bcrypt hashing, JWT expiration, HTTPS',
                                    'Transparency — clear disclosure of all data processing activities',
                                    'User Rights — all GDPR rights are exercisable via email request',
                                ].map((item, i) => (
                                    <ListItem key={i} sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle2 size={16} color="#818cf8" /></ListItemIcon>
                                        <ListItemText primary={<Typography variant="body2">{item}</Typography>} />
                                    </ListItem>
                                ))}
                            </List>
                        </S>

                        <S id="lawful-basis" title="2. Lawful Basis for Processing">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>
                                Under GDPR, we must have a lawful basis for each type of data processing. Here is our lawful basis for each processing activity:
                            </Typography>
                            <Grid container spacing={2}>
                                {[
                                    { basis: 'Performance of a Contract', article: 'Art. 6(1)(b)', activity: 'Processing account data (name, email, hashed password) to provide the LegalAI service you registered for.' },
                                    { basis: 'Legitimate Interests', article: 'Art. 6(1)(f)', activity: 'Security logging (IP addresses, login timestamps) to protect our users and detect fraudulent access.' },
                                    { basis: 'Legal Obligation', article: 'Art. 6(1)(c)', activity: 'Retaining records as required by applicable law, responding to lawful government requests.' },
                                    { basis: 'Consent', article: 'Art. 6(1)(a)', activity: 'Optional analytics and functional cookies (if you enable them), and receiving marketing communications (if you opt in).' },
                                ].map((item, i) => (
                                    <Grid item xs={12} key={i}>
                                        <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.basis}</Typography>
                                                <Chip label={item.article} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} variant="outlined" />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">{item.activity}</Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </S>

                        <S id="data-subject-rights" title="3. Your Data Subject Rights">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 4 }}>
                                As an EU data subject, you have the following rights under GDPR. To exercise any right, email <strong>waqarahmadisbest@gmail.com</strong> with subject "GDPR Request — [Right Name]". We respond within 30 days.
                            </Typography>
                            <Grid container spacing={2.5}>
                                {gdprRights.map((right, i) => (
                                    <Grid item xs={12} sm={6} key={i}>
                                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                                            <RightCard>
                                                <Box sx={{ p: 2.5, height: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                        <Box sx={{ p: 1, borderRadius: '10px', background: `${right.color}18`, color: right.color, flexShrink: 0 }}>{right.icon}</Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{right.title}</Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{right.body}</Typography>
                                                </Box>
                                            </RightCard>
                                        </motion.div>
                                    </Grid>
                                ))}
                            </Grid>
                        </S>

                        <S id="data-transfers" title="4. International Data Transfers">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                LegalAI uses third-party services that may process data outside the EU. Here is how we protect your data in each case:
                            </Typography>
                            {[
                                { service: 'Google Gemini API', location: 'USA', mechanism: 'Google\'s Standard Contractual Clauses (SCCs) and EU-US Data Privacy Framework adequacy decision.' },
                                { service: 'MongoDB Atlas', location: 'Configurable region', mechanism: 'MongoDB DPA with SCCs. For EU users, we recommend deploying Atlas cluster in eu-west or eu-central regions.' },
                            ].map((transfer, i) => (
                                <Card key={i} sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{transfer.service}</Typography>
                                        <Chip label={transfer.location} size="small" color="info" variant="outlined" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary"><strong>Transfer Mechanism:</strong> {transfer.mechanism}</Typography>
                                </Card>
                            ))}
                        </S>

                        <S id="dpa" title="5. Data Processing Activities Record">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>
                                In compliance with GDPR Art. 30, we maintain a record of our processing activities. Key activities:
                            </Typography>
                            {[
                                { activity: 'User Registration', data: 'Name, email, hashed password', purpose: 'Account creation and authentication', retention: 'Until deletion requested', basis: 'Contract' },
                                { activity: 'User Authentication', data: 'Email, password hash, JWT claims', purpose: 'Verify identity and issue access tokens', retention: 'Token: 24h; Account: Until deleted', basis: 'Contract' },
                                { activity: 'AI Chat Processing', data: 'Query text, user ID', purpose: 'Generate legal AI responses', retention: 'Not stored beyond request lifetime', basis: 'Contract' },
                                { activity: 'Document Training', data: 'Document content, chunk embeddings', purpose: 'Power the legal knowledge base', retention: 'Until admin deletes document', basis: 'Legitimate Interest' },
                                { activity: 'Security Logging', data: 'IP address, login timestamp', purpose: 'Fraud detection and security', retention: '90 days', basis: 'Legitimate Interest' },
                            ].map((row, i) => (
                                <Box key={i} sx={{ mb: 2, p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{row.activity}</Typography>
                                    <Grid container spacing={1}>
                                        {[['Data Processed', row.data], ['Purpose', row.purpose], ['Retention', row.retention], ['Lawful Basis', row.basis]].map(([label, val], j) => (
                                            <Grid item xs={12} sm={6} key={j}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                                                <Typography variant="body2">{val}</Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))}
                        </S>

                        <S id="breach" title="6. Data Breach Policy">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                In the event of a personal data breach, LegalAI will follow the GDPR breach notification requirements:
                            </Typography>
                            <List>
                                {[
                                    { step: 'Within 72 hours', action: 'Notify the relevant supervisory authority (if the breach is likely to result in a risk to individuals\' rights and freedoms).' },
                                    { step: 'Without undue delay', action: 'Notify affected data subjects directly if the breach is likely to result in a high risk to their rights and freedoms.' },
                                    { step: 'Immediate', action: 'Contain the breach, assess scope, and begin remediation including password resets and token revocation if needed.' },
                                ].map((item, i) => (
                                    <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start', mb: 1 }}>
                                        <ListItemIcon sx={{ mt: 0.5, minWidth: 28 }}><CheckCircle2 size={16} color="#818cf8" /></ListItemIcon>
                                        <ListItemText
                                            primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{item.step}</Typography>}
                                            secondary={item.action}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            <Alert severity="info" sx={{ borderRadius: '12px', mt: 2 }}>
                                To report a suspected security breach, email <strong>waqarahmadisbest@gmail.com</strong> immediately with subject "SECURITY BREACH".
                            </Alert>
                        </S>

                        <S id="children" title="7. Children's Data">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                LegalAI is not intended for use by children under the age of 16 (or the applicable age of digital consent in your country). We do not knowingly collect personal data from children.
                            </Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                If we discover that we have inadvertently collected data from a child, we will delete it immediately. Parents or guardians may contact us to request deletion.
                            </Typography>
                        </S>

                        <S id="dpo" title="8. Data Controller Contact">
                            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.06)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Data Controller</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <UserCheck size={18} color="#818cf8" />
                                        <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>Waqar Ahmad</Typography><Typography variant="caption" color="text.secondary">Data Controller, LegalAI</Typography></Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Mail size={18} color="#818cf8" />
                                        <Typography variant="body2">waqarahmadisbest@gmail.com</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Globe size={18} color="#818cf8" />
                                        <Typography variant="body2">Lahore, Punjab, Pakistan</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">For GDPR-related requests, please email with subject "GDPR Request — [Your Right]". We will acknowledge within 3 business days and respond fully within 30 days.</Typography>
                            </Card>
                        </S>

                        <S id="complaints" title="9. Filing Complaints with a Supervisory Authority">
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                If you believe we have not handled your personal data in compliance with GDPR, you have the right to lodge a complaint with your local data protection supervisory authority. EU residents may contact:
                            </Typography>
                            <Alert severity="info" sx={{ borderRadius: '12px', mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}><strong>European Data Protection Board (EDPB):</strong></Typography>
                                <Typography variant="body2">Contact your national DPA. A full list is available at <strong>edpb.europa.eu</strong></Typography>
                            </Alert>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                We encourage you to contact us first before filing a complaint, as we are committed to resolving all privacy concerns directly and promptly.
                            </Typography>
                        </S>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button component={Link} to="/privacy" variant="outlined" sx={{ borderRadius: '10px' }}>Privacy Policy</Button>
                            <Button component={Link} to="/terms" variant="outlined" sx={{ borderRadius: '10px' }}>Terms of Service</Button>
                            <Button component={Link} to="/cookies" variant="outlined" sx={{ borderRadius: '10px' }}>Cookie Policy</Button>
                            <Button component={Link} to="/support" variant="contained" sx={{ borderRadius: '10px', ml: 'auto' }} endIcon={<ArrowRight size={16} />}>Contact Us</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default GDPRCompliance;
