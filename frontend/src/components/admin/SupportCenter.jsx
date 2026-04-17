import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    IconButton,
    Button,
    Divider,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    MessageSquare,
    Mail,
    Trash2,
    CheckCircle,
    Reply,
    Clock,
    Filter,
    Search,
    User,
    AlertCircle,
    Send,
    Eye
} from 'lucide-react';
import { supportAPI } from '../../services/api';

const glassBox = {
    background: alpha('#1e293b', 0.5),
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha('#94a3b8', 0.1)}`,
    borderRadius: '24px',
    p: 3,
};

const SupportCenter = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [replying, setReplying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const statusMap = {
        0: null, // All
        1: 'pending',
        2: 'read',
        3: 'replied'
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            // Always fetch all tickets now that status filters are removed from UI
            const response = await supportAPI.getTickets(null);
            if (response.success) {
                setTickets(response.data.tickets || []);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleMarkAsRead = async (ticketId) => {
        try {
            const response = await supportAPI.markAsRead(ticketId);
            if (response.success) {
                fetchTickets();
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: 'read' });
                }
            }
        } catch (err) {
            console.error('Mark as read failed:', err);
        }
    };

    const handleDelete = async (ticketId) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const response = await supportAPI.deleteTicket(ticketId);
            if (response.success) {
                setTickets(tickets.filter(t => t.id !== ticketId));
                if (selectedTicket && selectedTicket.id === ticketId) setSelectedTicket(null);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim()) return;
        setReplying(true);
        try {
            const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const response = await supportAPI.replyToTicket(selectedTicket.id, {
                message: replyMessage,
                admin_name: admin.name || 'Admin',
                admin_email: admin.email || 'admin@legalai.com'
            });
            if (response.success) {
                setReplyOpen(false);
                setReplyMessage('');
                fetchTickets();
                // Close details or refresh details
                setSelectedTicket(null);
            }
        } catch (err) {
            console.error('Reply failed:', err);
        } finally {
            setReplying(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p.toLowerCase()) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#3b82f6';
            default: return '#10b981';
        }
    };

    const formatDate = (date) => new Date(date).toLocaleString();

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticket_ref.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={glassBox}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                        <MessageSquare size={24} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>Support Management</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>AUDIT AND RESPONSE CONTROL</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            width: 300,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: alpha('#94a3b8', 0.05),
                                color: 'white',
                                '& fieldset': { borderColor: alpha('#94a3b8', 0.1) },
                                '&:hover fieldset': { borderColor: alpha('#3b82f6', 0.3) },
                            }
                        }}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, color: '#94a3b8' }} />
                        }}
                    />
                </Box>
            </Box>

            {/* Removed Tabs to simplify support view */}

            {loading ? (
                <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={30} sx={{ color: '#3b82f6' }} /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : filteredTickets.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                    <Mail size={48} style={{ marginBottom: 16 }} />
                    <Typography>No support tickets found</Typography>
                </Box>
            ) : (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredTickets.map((ticket) => (
                        <Paper key={ticket.id} sx={{
                            bgcolor: alpha('#94a3b8', 0.05),
                            borderRadius: '16px',
                            border: `1px solid ${ticket.status === 'pending' ? alpha('#3b82f6', 0.3) : alpha('#94a3b8', 0.1)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': { border: `1px solid ${alpha('#3b82f6', 0.5)}`, bgcolor: alpha('#94a3b8', 0.08) }
                        }}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: alpha(getPriorityColor(ticket.priority), 0.2), color: getPriorityColor(ticket.priority) }}>
                                        <User size={20} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>{ticket.subject}</Typography>
                                            <Chip label={ticket.ticket_ref} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: alpha('#94a3b8', 0.1), color: '#94a3b8' }} />
                                            {ticket.status === 'pending' && <Chip label="NEW" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                From: {ticket.name} ({ticket.email}) • {formatDate(ticket.created_at)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="View Details">
                                        <IconButton size="small" onClick={() => { setSelectedTicket(ticket); if (ticket.status === 'pending') handleMarkAsRead(ticket.id); }} sx={{ color: '#3b82f6' }}>
                                            <Eye size={18} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDelete(ticket.id)} sx={{ color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </ListItem>
                        </Paper>
                    ))}
                </List>
            )}

            {/* Ticket Detail Dialog */}
            <Dialog
                open={Boolean(selectedTicket)}
                onClose={() => setSelectedTicket(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#0f172a',
                        backgroundImage: 'none',
                        borderRadius: '24px',
                        border: `1px solid ${alpha('#94a3b8', 0.1)}`,
                        color: 'white'
                    }
                }}
            >
                {selectedTicket && (
                    <>
                        <DialogTitle sx={{ borderBottom: `1px solid ${alpha('#94a3b8', 0.1)}`, pb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedTicket.subject}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Ticket Reference: #{selectedTicket.ticket_ref}</Typography>
                                </Box>
                                <Chip
                                    label={selectedTicket.priority.toUpperCase()}
                                    size="small"
                                    sx={{ bgcolor: alpha(getPriorityColor(selectedTicket.priority), 0.1), color: getPriorityColor(selectedTicket.priority), fontWeight: 800 }}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ py: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Message from {selectedTicket.name}:</Typography>
                                <Paper sx={{ mt: 1, p: 2, bgcolor: alpha('#94a3b8', 0.05), borderRadius: '12px', border: `1px solid ${alpha('#94a3b8', 0.05)}` }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedTicket.message}</Typography>
                                </Paper>
                            </Box>

                            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Admin Replies:</Typography>
                                    {selectedTicket.replies.map((reply, idx) => (
                                        <Paper key={idx} sx={{ mt: 1, p: 2, bgcolor: alpha('#10b981', 0.03), borderRadius: '12px', border: `1px solid ${alpha('#10b981', 0.1)}` }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{reply.message}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#10b981', fontWeight: 600 }}>
                                                — Sent by {reply.admin_name} at {formatDate(reply.timestamp)}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha('#94a3b8', 0.1)}` }}>
                            <Button onClick={() => setSelectedTicket(null)} sx={{ color: '#94a3b8' }}>Close</Button>
                            <Button
                                variant="contained"
                                startIcon={<Reply size={18} />}
                                onClick={() => setReplyOpen(true)}
                                sx={{ bgcolor: '#3b82f6', borderRadius: '10px', '&:hover': { bgcolor: '#2563eb' } }}
                            >
                                Send Reply
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Reply Dialog */}
            <Dialog
                open={replyOpen}
                onClose={() => setReplyOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#0f172a',
                        backgroundImage: 'none',
                        borderRadius: '24px',
                        border: `1px solid ${alpha('#94a3b8', 0.1)}`,
                        color: 'white'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Draft Reply</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: '#94a3b8' }}>
                        Replying to: <strong>{selectedTicket?.email}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        placeholder="Type your response here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                bgcolor: alpha('#94a3b8', 0.05),
                                color: 'white',
                                '& fieldset': { borderColor: alpha('#94a3b8', 0.1) },
                                '&:hover fieldset': { borderColor: alpha('#3b82f6', 0.3) },
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setReplyOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
                    <Button
                        disabled={replying || !replyMessage.trim()}
                        variant="contained"
                        endIcon={replying ? <CircularProgress size={16} color="inherit" /> : <Send size={18} />}
                        onClick={handleReply}
                        sx={{ bgcolor: '#3b82f6', borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#2563eb' } }}
                    >
                        Send Now
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SupportCenter;
