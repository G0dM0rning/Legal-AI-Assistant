import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box, Container, Typography, Grid, Card, Chip,
    List, ListItem, ListItemIcon, ListItemText,
    Button, Alert, LinearProgress, Switch, FormControlLabel, Divider,
} from '@mui/material';
import { Globe, CheckCircle2, XCircle, Mail, Shield, Settings, ArrowRight, Info, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    color: 'white',
    padding: theme.spacing(15, 0, 10),
    position: 'relative',
    borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
    overflow: 'hidden',
}));

const CookieCard = styled(Card)(({ theme }) => ({
    borderRadius: '16px',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.25s ease',
    '&:hover': { boxShadow: theme.shadows[8] },
}));

const cookieTypes = [
    {
        name: 'Strictly Necessary',
        color: '#10b981',
        canToggle: false,
        description: 'These cookies are essential for the website to function. They enable core features like login, security tokens, and session management.',
        examples: [
            { name: 'authToken', purpose: 'Stores your JWT authentication token for user and admin access', duration: 'Session / 24h', type: 'localStorage' },
            { name: 'adminUser', purpose: 'Stores admin profile data for dashboard display', duration: 'Session', type: 'localStorage' },
            { name: 'user', purpose: 'Cached user profile data', duration: 'Session', type: 'localStorage' },
        ],
    },
    {
        name: 'Functional',
        color: '#3b82f6',
        canToggle: true,
        description: 'These cookies enhance functionality by remembering your preferences such as theme, language, and UI settings.',
        examples: [
            { name: 'theme', purpose: 'Remembers your light/dark mode preference', duration: '1 year', type: 'localStorage' },
            { name: 'language', purpose: 'Stores your preferred language', duration: '1 year', type: 'localStorage' },
        ],
    },
    {
        name: 'Analytics',
        color: '#f59e0b',
        canToggle: true,
        description: 'We currently do not use analytics cookies. If we add them in the future, you will be prompted for consent.',
        examples: [],
    },
    {
        name: 'Marketing / Advertising',
        color: '#ef4444',
        canToggle: false,
        description: 'LegalAI does not use advertising or marketing cookies. We do not show ads or track you for ad targeting, ever.',
        examples: [],
    },
];

const CookiePolicy = () => {
    const theme = useTheme();
    const [readProgress, setReadProgress] = useState(0);
    const [preferences, setPreferences] = useState({ functional: true, analytics: false });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            setReadProgress(Math.round((winScroll / height) * 100));
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSave = () => {
        localStorage.setItem('cookiePrefs', JSON.stringify(preferences));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <LinearProgress variant="determinate" value={readProgress}
                sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10b981, #3b82f6)' } }} />

            <HeroSection>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '14px', background: 'rgba(16,185,129,0.2)' }}>
                                <Globe size={32} color="#6ee7b7" />
                            </Box>
                            <Chip label="Last updated: February 18, 2026" sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }} />
                        </Box>
                        <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Cookie Policy
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 700, lineHeight: 1.7, mb: 4, fontWeight: 400 }}>
                            LegalAI uses minimal cookies and browser storage. This page explains exactly what we store, why, and how you can control it.
                        </Typography>
                        <Alert severity="success" sx={{ borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'white', border: '1px solid rgba(16,185,129,0.3)', '& .MuiAlert-icon': { color: '#6ee7b7' } }}>
                            <Typography variant="body2"><strong>Good news:</strong> We don't use advertising cookies or third-party trackers. Only strictly necessary authentication tokens and optional UI preference storage.</Typography>
                        </Alert>
                    </motion.div>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                {/* What are cookies */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>What Are Cookies?</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 2, maxWidth: 800 }}>
                        Cookies are small text files stored on your browser or device when you visit a website. LegalAI primarily uses <strong>localStorage</strong> rather than traditional HTTP cookies, which means data stays on your device and is never sent to our server with every request — only when you explicitly make an API call.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 6, maxWidth: 800 }}>
                        We use the minimum amount of storage necessary to provide you with a secure, functional experience. We do not set any third-party cookies.
                    </Typography>
                </motion.div>

                {/* Cookie Types */}
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Cookie Categories</Typography>
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    {cookieTypes.map((type, i) => (
                        <Grid item xs={12} md={6} key={i}>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <CookieCard>
                                    <Box sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: type.color, flexShrink: 0 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{type.name}</Typography>
                                            </Box>
                                            {!type.canToggle ? (
                                                <Chip label="Required" size="small" color="default" />
                                            ) : (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={type.name === 'Functional' ? preferences.functional : preferences.analytics}
                                                            onChange={e => setPreferences(p => ({ ...p, [type.name === 'Functional' ? 'functional' : 'analytics']: e.target.checked }))}
                                                        />
                                                    }
                                                    label=""
                                                    sx={{ m: 0 }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>{type.description}</Typography>
                                        {type.examples.length > 0 ? (
                                            <List dense>
                                                {type.examples.map((ex, j) => (
                                                    <ListItem key={j} sx={{ px: 0, alignItems: 'flex-start' }}>
                                                        <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}><CheckCircle2 size={14} color={type.color} /></ListItemIcon>
                                                        <ListItemText
                                                            primary={<Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{ex.name}</Typography>}
                                                            secondary={<Typography variant="caption" color="text.secondary">{ex.purpose} · {ex.duration} · {ex.type}</Typography>}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', background: 'action.hover' }}>
                                                <XCircle size={14} color={theme.palette.text.secondary} />
                                                <Typography variant="caption" color="text.secondary">No cookies of this type are currently set.</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CookieCard>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* Cookie Preferences */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <Card sx={{ borderRadius: '20px', p: 4, mb: 6, border: `2px solid ${theme.palette.primary.main}30`, background: `${theme.palette.primary.main}05` }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Your Cookie Preferences</Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>Adjust your preferences below. Changes take effect immediately.</Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Strictly Necessary</Typography>
                                        <Chip label="Always On" size="small" color="success" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">Auth tokens required for login. Cannot be disabled.</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Functional</Typography>
                                        <Switch size="small" checked={preferences.functional} onChange={e => setPreferences(p => ({ ...p, functional: e.target.checked }))} />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">UI preferences like theme and language.</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Analytics</Typography>
                                        <Switch size="small" checked={preferences.analytics} onChange={e => setPreferences(p => ({ ...p, analytics: e.target.checked }))} />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">Currently not used. Toggle for future use.</Typography>
                                </Card>
                            </Grid>
                        </Grid>
                        {saved && <Alert severity="success" sx={{ borderRadius: '10px', mb: 2 }}>Preferences saved successfully!</Alert>}
                        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '10px', px: 4 }}>Save Preferences</Button>
                    </Card>
                </motion.div>

                {/* How to manage */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Managing Cookies in Your Browser</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>
                        Since LegalAI uses localStorage rather than traditional cookies, you can clear all stored data by:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {[
                            { browser: 'Chrome', steps: 'Settings → Privacy & Security → Clear browsing data → Cached images and files + Site data' },
                            { browser: 'Firefox', steps: 'Options → Privacy & Security → Cookies and Site Data → Clear Data' },
                            { browser: 'Safari', steps: 'Preferences → Privacy → Manage Website Data → Remove All' },
                            { browser: 'Edge', steps: 'Settings → Privacy → Clear browsing data → Cached data and files + Cookies' },
                        ].map((b, i) => (
                            <Grid item xs={12} sm={6} key={i}>
                                <Box sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{b.browser}</Typography>
                                    <Typography variant="body2" color="text.secondary">{b.steps}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                    <Alert severity="info" sx={{ borderRadius: '12px', mb: 4 }}>
                        Clearing browser data will log you out of LegalAI. You will need to sign in again.
                    </Alert>
                </motion.div>

                {/* Navigation */}
                <Divider sx={{ my: 4 }} />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button component={Link} to="/privacy" variant="outlined" sx={{ borderRadius: '10px' }}>Privacy Policy</Button>
                    <Button component={Link} to="/terms" variant="outlined" sx={{ borderRadius: '10px' }}>Terms of Service</Button>
                    <Button component={Link} to="/gdpr" variant="outlined" sx={{ borderRadius: '10px' }}>GDPR</Button>
                    <Button component={Link} to="/support" variant="contained" sx={{ borderRadius: '10px', ml: 'auto' }}>Contact Us</Button>
                </Box>
            </Container>
        </Box>
    );
};

export default CookiePolicy;
