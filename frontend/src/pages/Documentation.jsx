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
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    BookOpen,
    Code2,
    Zap,
    Shield,
    Upload,
    MessageSquare,
    Settings,
    ChevronDown,
    Search,
    ExternalLink,
    CheckCircle2,
    Terminal,
    Key,
    Database,
    ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
    position: 'relative',
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    color: theme.palette.common.white,
    padding: theme.spacing(15, 0, 10),
    borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.05)',
        pointerEvents: 'none',
    },
}));

const SectionCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: '20px',
    background: alpha('#0f172a', 0.6),
    border: `1px solid ${alpha('#ffffff', 0.1)}`,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-6px)',
        borderColor: theme.palette.primary.main,
        background: alpha('#0f172a', 0.8),
    },
}));

const CodeBlock = styled(Box)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? '#0d1117' : '#1e1e2e',
    borderRadius: '12px',
    padding: theme.spacing(2.5),
    fontFamily: '"Courier New", monospace',
    fontSize: '0.875rem',
    color: '#e2e8f0',
    overflowX: 'auto',
    position: 'relative',
    '& .keyword': { color: '#c678dd' },
    '& .string': { color: '#98c379' },
    '& .comment': { color: '#5c6370', fontStyle: 'italic' },
}));

const sections = [
    { id: 'quickstart', title: 'Quick Start', icon: Zap, color: '#f59e0b', description: 'Get up and running in minutes' },
    { id: 'authentication', title: 'Authentication', icon: Key, color: '#3b82f6', description: 'JWT tokens and auth flows' },
    { id: 'api', title: 'API Reference', icon: Code2, color: '#10b981', description: 'Complete endpoint documentation' },
    { id: 'upload', title: 'Document Upload', icon: Upload, color: '#8b5cf6', description: 'File ingestion and processing' },
    { id: 'chat', title: 'AI Chat', icon: MessageSquare, color: '#ef4444', description: 'Querying the legal knowledge base' },
    { id: 'security', title: 'Security', icon: Shield, color: '#06b6d4', description: 'Best practices for production' },
    { id: 'database', title: 'Database', icon: Database, color: '#f97316', description: 'MongoDB collections and indexes' },
    { id: 'deployment', title: 'Deployment', icon: Terminal, color: '#84cc16', description: 'Docker and production setup' },
];

const Documentation = () => {
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('quickstart');

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            <HeroSection>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Chip
                            label="v1.0 Documentation"
                            sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }}
                        />
                        <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Documentation
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: '700px', mb: 6, lineHeight: 1.7, fontWeight: 400 }}>
                            Everything you need to integrate, use, and deploy LegalAI — from quick start to advanced configuration.
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Search documentation..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{
                                maxWidth: '600px',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    borderRadius: '14px',
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: 'white' },
                                },
                                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start"><Search size={20} color="rgba(255,255,255,0.7)" /></InputAdornment>
                                ),
                            }}
                        />
                    </motion.div>
                </Container>
            </HeroSection>

            {/* Section Grid */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>Browse Documentation</Typography>
                <Grid container spacing={3}>
                    {filteredSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <Grid item xs={12} sm={6} md={3} key={section.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.07 }}
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <SectionCard sx={{ borderColor: activeSection === section.id ? section.color : undefined }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{
                                                width: 52, height: 52, borderRadius: '14px',
                                                background: `${section.color}18`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                mb: 2, color: section.color,
                                            }}>
                                                <Icon size={24} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{section.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">{section.description}</Typography>
                                        </CardContent>
                                    </SectionCard>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            </Container>

            <Divider />

            {/* Quick Start Guide */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', background: '#f59e0b18', color: '#f59e0b' }}><Zap size={28} /></Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>Quick Start Guide</Typography>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>1. Clone & Install</Typography>
                            <CodeBlock>
                                <Box component="span" className="comment"># Clone the repository</Box>{'\n'}
                                git clone https://github.com/Waqar-Ahmad1/legalai{'\n'}
                                cd legalai{'\n\n'}
                                <Box component="span" className="comment"># Backend setup</Box>{'\n'}
                                cd backend{'\n'}
                                pip install -r requirements.txt{'\n\n'}
                                <Box component="span" className="comment"># Frontend setup</Box>{'\n'}
                                cd ../frontend{'\n'}
                                npm install
                            </CodeBlock>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>2. Configure Environment</Typography>
                            <CodeBlock>
                                <Box component="span" className="comment"># backend/.env</Box>{'\n'}
                                <Box component="span" className="keyword">MONGO_URI</Box>=mongodb+srv://...{'\n'}
                                <Box component="span" className="keyword">SECRET_KEY</Box>=your-256-bit-secret{'\n'}
                                <Box component="span" className="keyword">ADMIN_SECRET_KEY</Box>=your-admin-key{'\n'}
                                <Box component="span" className="keyword">ADMIN_API_KEY</Box>=your-api-key{'\n'}
                                <Box component="span" className="keyword">GEMINI_API_KEY</Box>=your-gemini-key{'\n'}
                                <Box component="span" className="keyword">DEBUG</Box>=false
                            </CodeBlock>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>3. Start the Backend</Typography>
                            <CodeBlock>
                                <Box component="span" className="comment"># From /backend directory</Box>{'\n'}
                                uvicorn main:app --reload --host 0.0.0.0 --port 8000{'\n\n'}
                                <Box component="span" className="comment"># API will be available at:</Box>{'\n'}
                                <Box component="span" className="string">http://localhost:8000</Box>{'\n'}
                                <Box component="span" className="string">http://localhost:8000/docs</Box>{' '}<Box component="span" className="comment"># Swagger UI</Box>
                            </CodeBlock>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>4. Start the Frontend</Typography>
                            <CodeBlock>
                                <Box component="span" className="comment"># From /frontend directory</Box>{'\n'}
                                npm start{'\n\n'}
                                <Box component="span" className="comment"># App will be available at:</Box>{'\n'}
                                <Box component="span" className="string">http://localhost:3000</Box>
                            </CodeBlock>
                        </Grid>
                    </Grid>
                </motion.div>
            </Container>

            <Divider />

            {/* API Reference */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', background: '#10b98118', color: '#10b981' }}><Code2 size={28} /></Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>API Reference</Typography>
                    </Box>

                    {[
                        { method: 'POST', path: '/register', desc: 'Register a new user account', auth: false },
                        { method: 'POST', path: '/login', desc: 'Authenticate and receive JWT token', auth: false },
                        { method: 'POST', path: '/admin/signup', desc: 'Register a new admin (requires secret key)', auth: false },
                        { method: 'POST', path: '/admin/signin', desc: 'Admin authentication', auth: false },
                        { method: 'POST', path: '/chat', desc: 'Query the legal AI with a question', auth: true },
                        { method: 'POST', path: '/admin/train', desc: 'Upload and train on a legal document', auth: true },
                        { method: 'GET', path: '/admin/dashboard/stats', desc: 'Get dashboard statistics', auth: true },
                        { method: 'GET', path: '/admin/training/history', desc: 'Get training document history', auth: true },
                        { method: 'GET', path: '/admin/users', desc: 'List all registered users', auth: true },
                        { method: 'DELETE', path: '/admin/training/document/{id}', desc: 'Delete a training document', auth: true },
                        { method: 'GET', path: '/system/status', desc: 'Get system health status', auth: false },
                        { method: 'GET', path: '/health', desc: 'Health check endpoint', auth: false },
                    ].map((ep, i) => (
                        <Box key={i} sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2,
                            mb: 1.5, borderRadius: '10px', border: `1px solid ${theme.palette.divider}`,
                            '&:hover': { backgroundColor: 'action.hover' },
                        }}>
                            <Chip
                                label={ep.method}
                                size="small"
                                sx={{
                                    fontWeight: 700, minWidth: 60,
                                    backgroundColor: ep.method === 'GET' ? '#10b98120' : ep.method === 'DELETE' ? '#ef444420' : '#3b82f620',
                                    color: ep.method === 'GET' ? '#10b981' : ep.method === 'DELETE' ? '#ef4444' : '#3b82f6',
                                }}
                            />
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, minWidth: 300 }}>{ep.path}</Typography>
                            <Typography color="text.secondary" sx={{ flexGrow: 1 }}>{ep.desc}</Typography>
                            {ep.auth && <Chip label="Auth" size="small" color="warning" variant="outlined" />}
                        </Box>
                    ))}
                </motion.div>
            </Container>

            <Divider />

            {/* Key Concepts */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 6 }}>Key Concepts</Typography>
                <Grid container spacing={4}>
                    {[
                        { icon: <Zap size={24} />, color: '#f59e0b', title: 'RAG Pipeline', body: 'LegalAI uses Retrieval-Augmented Generation. Documents are chunked, embedded via Gemini (or Ollama), stored in FAISS, and retrieved semantically at query time before being passed to the LLM.' },
                        { icon: <Shield size={24} />, color: '#3b82f6', title: 'JWT Authentication', body: 'All protected endpoints require a Bearer token in the Authorization header. Tokens are issued on login and expire in 24 hours. Admin and User tokens carry different claims.' },
                        { icon: <Database size={24} />, color: '#10b981', title: 'MongoDB Collections', body: 'The system uses four collections: users, admins, training_documents, and documents. Proper indexes are created on email (unique), created_at, and uploadDate for performance.' },
                        { icon: <Settings size={24} />, color: '#8b5cf6', title: 'AI Providers', body: 'LegalAI uses a SmartAIProvider that tries Gemini first (best performance), then falls back to Ollama (local), then fake embeddings. The active provider is reported via /system/status.' },
                    ].map((concept, i) => (
                        <Grid item xs={12} md={6} key={i}>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <Card sx={{ p: 3, borderRadius: '16px', height: '100%', border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: '10px', background: `${concept.color}18`, color: concept.color }}>{concept.icon}</Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{concept.title}</Typography>
                                    </Box>
                                    <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{concept.body}</Typography>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* CTA */}
            <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, color: 'white', py: 8, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Need More Help?</Typography>
                    <Typography sx={{ opacity: 0.85, mb: 4, fontSize: '1.1rem' }}>Check our FAQs, browse the community, or contact our support team.</Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button component={Link} to="/faq" variant="contained" color="secondary" size="large" endIcon={<ArrowRight size={18} />} sx={{ borderRadius: '12px', px: 4 }}>Browse FAQs</Button>
                        <Button component={Link} to="/support" variant="outlined" size="large" sx={{ borderRadius: '12px', px: 4, borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' } }}>Contact Support</Button>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Documentation;
