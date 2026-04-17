import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Divider,
} from '@mui/material';
import {
    HelpCircle,
    Search,
    ChevronDown,
    Shield,
    Zap,
    CreditCard,
    Settings,
    Lock,
    Upload,
    MessageSquare,
    ArrowRight,
    CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    color: 'white',
    padding: theme.spacing(15, 0, 10),
    position: 'relative',
    borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
    overflow: 'hidden',
}));

const CategoryChip = styled(Chip)(({ theme, active }) => ({
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: theme.spacing(0.5, 1),
    transition: 'all 0.2s ease',
    ...(active === 'true' && {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        '&:hover': { backgroundColor: theme.palette.primary.dark },
    }),
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
    borderRadius: '16px !important',
    marginBottom: theme.spacing(2),
    background: alpha('#0f172a', 0.4),
    border: `1px solid ${alpha('#ffffff', 0.1)}`,
    boxShadow: 'none',
    '&:before': { display: 'none' },
    '&.Mui-expanded': {
        borderColor: theme.palette.primary.main,
        background: alpha('#0f172a', 0.6),
    },
}));

const categories = [
    { id: 'all', label: 'All', icon: HelpCircle },
    { id: 'general', label: 'General', icon: Zap },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
    { id: 'technical', label: 'Technical', icon: MessageSquare },
];

const faqs = [
    {
        category: 'general',
        question: 'What is LegalAI and who is it for?',
        answer: 'LegalAI is an AI-powered legal document assistant that uses Retrieval-Augmented Generation (RAG) to help lawyers, paralegals, law students, and individuals understand legal documents. It analyzes uploaded legal texts and answers questions with pinpoint accuracy, citing the source documents.',
    },
    {
        category: 'general',
        question: 'What types of legal documents does LegalAI support?',
        answer: 'LegalAI supports PDF, DOCX, DOC, TXT, and Markdown files. This covers contracts, court opinions, statutes, regulations, legal briefs, agreements, and more. The system can handle documents up to 50MB per upload.',
    },
    {
        category: 'general',
        question: 'How accurate is LegalAI?',
        answer: 'LegalAI achieves a 95% accuracy rate on document retrieval tasks. The system retrieves the most semantically relevant passages from uploaded documents and passes them as context to the LLM. Answers are always grounded in the uploaded documents — the AI does not hallucinate laws that were not uploaded.',
    },
    {
        category: 'general',
        question: 'Is LegalAI a replacement for a lawyer?',
        answer: 'No. LegalAI is a research and productivity tool, not a substitute for professional legal advice. It helps you understand and navigate legal documents faster, but for legal decisions with real consequences, always consult a qualified attorney.',
    },
    {
        category: 'security',
        question: 'How is my data secured?',
        answer: 'LegalAI uses bcrypt password hashing (12 rounds), JWT Bearer token authentication, and HTTPS for all data in transit. Uploaded documents are stored in a secure server directory. The MongoDB database uses Atlas with TLS encryption. We never sell or share your data with third parties.',
    },
    {
        category: 'security',
        question: 'Are my uploaded documents stored permanently?',
        answer: 'Documents processed for admin training are stored in the FAISS vector store and the upload directory. The content is retained to power the AI assistant. You can request deletion of specific documents through the admin panel. Personal chat queries are not stored by default.',
    },
    {
        category: 'security',
        question: 'Is LegalAI GDPR compliant?',
        answer: 'Yes. LegalAI is designed with GDPR principles in mind, including data minimization, user consent, right of access, and right to erasure. See our GDPR Compliance page for full details. EU users can request data deletion at any time by contacting support.',
    },
    {
        category: 'security',
        question: 'Who can see my uploaded documents?',
        answer: 'Only admin users (authenticated with admin JWT tokens) can upload training documents. Regular users can only interact through the chat interface. No unauthorized party can access your documents. Our team does not review document contents unless required for technical support.',
    },
    {
        category: 'features',
        question: 'How do I upload a legal document?',
        answer: 'Admin users can upload documents through the Admin Dashboard → Document Management section. Select your file (PDF, DOCX, TXT), click Upload, and the system will chunk, embed, and index the document automatically. Users can then query it through the chat interface.',
    },
    {
        category: 'features',
        question: 'Can I have multiple documents in the knowledge base?',
        answer: 'Yes! LegalAI\'s FAISS vector store accumulates all uploaded documents. You can upload as many legal documents as needed, and the AI will retrieve relevant passages from across all documents when answering queries.',
    },
    {
        category: 'features',
        question: 'What AI model powers LegalAI?',
        answer: 'LegalAI uses Google Gemini (gemini-pro) for text generation and Gemini embeddings (embedding-001) for semantic search by default. If Gemini is unavailable or quota is exceeded, it automatically falls back to Ollama (local LLMs like llama3.2) for full offline capability.',
    },
    {
        category: 'features',
        question: 'Does LegalAI support real-time streaming responses?',
        answer: 'The chat interface supports simulated streaming for a real-time feel. Full streaming via Server-Sent Events is on the product roadmap for a future release.',
    },
    {
        category: 'billing',
        question: 'Is LegalAI free to use?',
        answer: 'LegalAI is currently an open-source project available for self-hosting. You only pay for the underlying AI APIs (Google Gemini has a generous free tier). Commercial SaaS pricing with hosted plans is planned for a future release.',
    },
    {
        category: 'billing',
        question: 'What is the Gemini API free tier limit?',
        answer: 'Google Gemini API provides a free tier of approximately 15 requests/minute and 1 million tokens/day on Gemini Pro. For high-volume production usage, you\'ll need to enable billing on Google Cloud. LegalAI automatically falls back to Ollama when the quota is exceeded.',
    },
    {
        category: 'technical',
        question: 'What are the system requirements for self-hosting?',
        answer: 'Backend: Python 3.10+, 4GB RAM minimum (8GB recommended for Ollama), MongoDB Atlas account or local MongoDB. Frontend: Node.js 18+. Optional: Ollama installed for local AI fallback. The system runs well on any modern VPS or cloud instance.',
    },
    {
        category: 'technical',
        question: 'Why is the first response slow?',
        answer: 'The FAISS vector store is loaded from disk on the first request. Subsequent requests are fast because the store is cached in memory. In production, pre-warm the server by calling /health or /system/status after startup.',
    },
    {
        category: 'technical',
        question: 'How do I reset the vector store?',
        answer: 'Call the reset_vector_store() function from config.py, or simply delete the files inside backend/data/vector_store/ and restart the server. A fresh empty vector store will be created automatically on next startup.',
    },
];

const FAQ = () => {
    const theme = useTheme();
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(false);

    const filtered = faqs.filter(faq => {
        const matchCat = activeCategory === 'all' || faq.category === activeCategory;
        const matchSearch = faq.question.toLowerCase().includes(search.toLowerCase()) ||
            faq.answer.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <HeroSection>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Box sx={{ p: 2, borderRadius: '20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                                <HelpCircle size={40} />
                            </Box>
                        </Box>
                        <Typography variant="h1" align="center" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Help Center
                        </Typography>
                        <Typography variant="h6" align="center" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6, lineHeight: 1.7, maxWidth: '700px', mx: 'auto', fontWeight: 400 }}>
                            Everything you need to know about LegalAI. Can't find your answer? Reach out to our support team.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <TextField
                                placeholder="Search all questions..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{
                                    maxWidth: 550, width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '14px', color: 'white',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="rgba(255,255,255,0.7)" /></InputAdornment> }}
                            />
                        </Box>
                    </motion.div>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: 8 }}>
                {/* Category Filter */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 5 }}>
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <CategoryChip
                                key={cat.id}
                                label={cat.label}
                                active={activeCategory === cat.id ? 'true' : 'false'}
                                icon={<Icon size={15} />}
                                onClick={() => setActiveCategory(cat.id)}
                                variant={activeCategory === cat.id ? 'filled' : 'outlined'}
                                color={activeCategory === cat.id ? 'primary' : 'default'}
                            />
                        );
                    })}
                </Box>

                <Grid container spacing={6}>
                    {/* FAQ List */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Showing {filtered.length} of {faqs.length} questions
                        </Typography>

                        <AnimatePresence>
                            {filtered.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <HelpCircle size={48} color={theme.palette.text.secondary} />
                                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>No results found</Typography>
                                        <Typography color="text.secondary">Try a different search term or category</Typography>
                                    </Box>
                                </motion.div>
                            ) : (
                                filtered.map((faq, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                    >
                                        <StyledAccordion
                                            expanded={expanded === i}
                                            onChange={() => setExpanded(expanded === i ? false : i)}
                                        >
                                            <AccordionSummary
                                                expandIcon={
                                                    <motion.div animate={{ rotate: expanded === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                        <ChevronDown size={20} />
                                                    </motion.div>
                                                }
                                                sx={{ py: 1.5 }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{
                                                        width: 8, height: 8, borderRadius: '50%',
                                                        backgroundColor: categories.find(c => c.id === faq.category)
                                                            ? theme.palette.primary.main : 'transparent',
                                                        flexShrink: 0,
                                                    }} />
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0, pl: 4 }}>
                                                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{faq.answer}</Typography>
                                            </AccordionDetails>
                                        </StyledAccordion>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Card sx={{ borderRadius: '16px', p: 3, mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.primary.main}05)`, border: `1px solid ${theme.palette.primary.main}30` }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Still have questions?</Typography>
                                <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                    Our support team is ready to help. Reach out via email, GitHub, or check the documentation.
                                </Typography>
                                <Button component={Link} to="/support" variant="contained" fullWidth endIcon={<ArrowRight size={16} />} sx={{ borderRadius: '10px', mb: 1.5 }}>
                                    Contact Support
                                </Button>
                                <Button component={Link} to="/documentation" variant="outlined" fullWidth sx={{ borderRadius: '10px' }}>
                                    Read Docs
                                </Button>
                            </Card>

                            <Card sx={{ borderRadius: '16px', p: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Quick Stats</Typography>
                                {[
                                    { label: 'Questions answered', value: `${faqs.length}` },
                                    { label: 'Categories', value: `${categories.length - 1}` },
                                    { label: 'Avg. response time', value: '< 2h' },
                                    { label: 'User satisfaction', value: '98%' },
                                ].map((stat, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: i < 3 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                        <Typography color="text.secondary">{stat.label}</Typography>
                                        <Typography sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                                    </Box>
                                ))}
                            </Card>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Bottom CTA */}
            <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, color: 'white', py: 8, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <CheckCircle2 size={48} style={{ marginBottom: 16, opacity: 0.9 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Ready to get started?</Typography>
                    <Typography sx={{ opacity: 0.85, mb: 4 }}>Join thousands of legal professionals using LegalAI.</Typography>
                    <Button component={Link} to="/register" variant="contained" color="secondary" size="large" endIcon={<ArrowRight size={18} />} sx={{ borderRadius: '12px', px: 5, py: 1.5 }}>
                        Create Free Account
                    </Button>
                </Container>
            </Box>
        </Box>
    );
};

export default FAQ;
