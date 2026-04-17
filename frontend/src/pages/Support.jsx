import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Chip,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Mail,
    Github,
    Twitter,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Zap,
    Shield,
    BookOpen,
    HelpCircle,
    Send,
    Phone,
    MapPin,
    ArrowRight,
    Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportAPI } from '../services/api';

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
        top: -100, right: -100,
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
    },
}));

const ChannelCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: '20px',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.35s ease',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: theme.shadows[16],
        borderColor: theme.palette.primary.main,
    },
}));

const contactChannels = [
    {
        icon: Mail, color: '#3b82f6', title: 'Email Support',
        description: 'Send us a detailed message and we\'ll get back to you within 24 hours on business days.',
        action: 'waqarahmadisbest@gmail.com', cta: 'Send Email',
        href: 'mailto:waqarahmadisbest@gmail.com', badge: '< 24h',
    },
    {
        icon: Github, color: '#6b7280', title: 'GitHub Issues',
        description: 'Found a bug or want to request a feature? Open an issue on our public GitHub repository.',
        action: 'github.com/Waqar-Ahmad1', cta: 'Open Issue',
        href: 'https://github.com/Waqar-Ahmad1', badge: 'Open Source',
    },
    {
        icon: Twitter, color: '#1d9bf0', title: 'Twitter / X',
        description: 'Quick questions, announcements, and community discussions. Follow us for updates.',
        action: '@WaqarAhmad_Dev', cta: 'Follow Us',
        href: 'https://twitter.com', badge: 'Community',
    },
    {
        icon: BookOpen, color: '#10b981', title: 'Documentation',
        description: 'Our comprehensive docs cover setup, API reference, and integration guides.',
        action: 'legalai.app/documentation', cta: 'Read Docs',
        href: '/documentation', badge: 'Self-Service', internal: true,
    },
];

const issueTypes = [
    'General Question',
    'Bug Report',
    'Feature Request',
    'Account / Billing',
    'Security Concern',
    'API Integration',
    'Data & Privacy',
    'Other',
];

const priorities = ['Low', 'Medium', 'High', 'Critical'];

const Support = () => {
    const theme = useTheme();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ticketRef, setTicketRef] = useState('');

    const handleChange = e => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await supportAPI.submitTicket(form);
            if (response.success) {
                setTicketRef(response.data.ticket_ref);
                setSubmitted(true);
            } else {
                setError(response.message || 'Failed to submit ticket. Please try again.');
            }
        } catch (err) {
            console.error('Support submission error:', err);
            setError('System error occurred. Please contact us via email if this persists.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <HeroSection>
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                                <Chip label="Support Center" sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
                                <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Support Center
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.7, fontWeight: 400 }}>
                                    Our team is dedicated to helping you get the most out of LegalAI. Choose the best way to reach us below.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {[{ icon: Clock, text: '< 24h Response Time' }, { icon: CheckCircle2, text: '98% Satisfaction Rate' }, { icon: Star, text: 'Expert Legal AI Team' }].map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', px: 2, py: 1 }}>
                                                <Icon size={16} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.text}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                                <Box sx={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', p: 3, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>⚡ Quick Help</Typography>
                                    {[
                                        { text: 'Check FAQs for instant answers', link: '/faq' },
                                        { text: 'Browse the documentation', link: '/documentation' },
                                        { text: 'Review system status', link: 'http://localhost:8000/health' },
                                        { text: 'Open a GitHub issue', link: 'https://github.com/Waqar-Ahmad1' },
                                    ].map((item, i) => (
                                        <Box key={i} component={Link} to={item.link}
                                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, px: 2, borderRadius: '10px', mb: 1, textDecoration: 'none', color: 'inherit', '&:hover': { background: 'rgba(255,255,255,0.1)' }, transition: 'all 0.2s' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <CheckCircle2 size={16} color="#4ade80" />
                                                <Typography variant="body2">{item.text}</Typography>
                                            </Box>
                                            <ArrowRight size={14} style={{ opacity: 0.6 }} />
                                        </Box>
                                    ))}
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </HeroSection>

            {/* Contact Channels */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Contact Channels</Typography>
                    <Typography color="text.secondary" sx={{ mb: 5 }}>Choose your preferred way to reach out to our team.</Typography>
                </motion.div>
                <Grid container spacing={3}>
                    {contactChannels.map((ch, i) => {
                        const Icon = ch.icon;
                        return (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                    <ChannelCard>
                                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ p: 1.5, borderRadius: '12px', background: `${ch.color}18`, color: ch.color }}>
                                                    <Icon size={24} />
                                                </Box>
                                                <Chip label={ch.badge} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{ch.title}</Typography>
                                            <Typography color="text.secondary" sx={{ flexGrow: 1, mb: 2, lineHeight: 1.7, fontSize: '0.9rem' }}>{ch.description}</Typography>
                                            <Typography variant="caption" sx={{ color: ch.color, fontWeight: 600, display: 'block', mb: 2 }}>{ch.action}</Typography>
                                            {ch.internal ? (
                                                <Button component={Link} to={ch.href} variant="outlined" size="small" endIcon={<ArrowRight size={14} />} sx={{ borderRadius: '8px', alignSelf: 'flex-start' }}>{ch.cta}</Button>
                                            ) : (
                                                <Button href={ch.href} target="_blank" rel="noopener noreferrer" variant="outlined" size="small" endIcon={<ArrowRight size={14} />} sx={{ borderRadius: '8px', alignSelf: 'flex-start' }}>{ch.cta}</Button>
                                            )}
                                        </CardContent>
                                    </ChannelCard>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            </Container>

            <Divider />

            {/* Support Ticket Form */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={6}>
                    <Grid item xs={12} md={7}>
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Submit a Support Ticket</Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>Fill in the form and our team will respond within 24 hours.</Typography>

                            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                            {submitted ? (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                    <Alert severity="success" sx={{ borderRadius: '16px', p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Ticket submitted successfully! 🎉</Typography>
                                        <Typography>We've received your message and will get back to you at <strong>{form.email}</strong> within 24 hours. Your ticket reference number is: <strong>#{ticketRef}</strong>. Keep this for your records.</Typography>
                                    </Alert>
                                </motion.div>
                            ) : (
                                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth required label="Full Name" name="name" value={form.name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth required label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                    </Grid>
                                    <TextField fullWidth required label="Subject" name="subject" value={form.subject} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    <TextField fullWidth required multiline rows={6} label="Describe your issue in detail..." name="message" value={form.message} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} helperText={`${form.message.length} / 2000 characters`} inputProps={{ maxLength: 2000 }} />
                                    <Button type="submit" variant="contained" size="large" disabled={loading} endIcon={loading ? null : <Send size={18} />}
                                        sx={{ alignSelf: 'flex-start', borderRadius: '12px', px: 4, py: 1.5, fontWeight: 600 }}>
                                        {loading ? 'Submitting...' : 'Submit Ticket'}
                                    </Button>
                                </Box>
                            )}
                        </motion.div>
                    </Grid>

                    {/* Support Info Sidebar */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Card sx={{ borderRadius: '20px', p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Support Hours</Typography>
                                {[
                                    { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM PKT', available: true },
                                    { day: 'Saturday', hours: '10:00 AM – 2:00 PM PKT', available: true },
                                    { day: 'Sunday', hours: 'Emergency only', available: false },
                                ].map((s, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: i < 2 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.day}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.hours}</Typography>
                                        </Box>
                                        <Chip label={s.available ? 'Online' : 'Limited'} size="small" color={s.available ? 'success' : 'warning'} />
                                    </Box>
                                ))}
                            </Card>

                            <Card sx={{ borderRadius: '20px', p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Before you submit</Typography>
                                <List dense>
                                    {[
                                        'Check the FAQ for common questions',
                                        'Review our documentation',
                                        'Search GitHub issues for known bugs',
                                        'Include error messages and steps to reproduce',
                                        'Mention your browser and OS version',
                                    ].map((tip, i) => (
                                        <ListItem key={i} sx={{ px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle2 size={16} color={theme.palette.success.main} /></ListItemIcon>
                                            <ListItemText primary={tip} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Card>

                            <Card sx={{ borderRadius: '20px', p: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}12, ${theme.palette.primary.main}06)`, border: `1px solid ${theme.palette.primary.main}25` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <AlertCircle size={20} color={theme.palette.primary.main} />
                                    <Typography sx={{ fontWeight: 700 }}>Security Issues</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    For security vulnerabilities, please email us directly at <strong>waqarahmadisbest@gmail.com</strong> instead of opening a public GitHub issue. We follow responsible disclosure practices.
                                </Typography>
                            </Card>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Support;
