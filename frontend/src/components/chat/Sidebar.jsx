import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText, IconButton, alpha } from '@mui/material';
import { Add, ChatBubbleOutline, Delete, Terminal, History } from '@mui/icons-material';
import { SidebarContainer } from './ChatStyles';

const Sidebar = ({
    isOpen,
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation
}) => {
    return (
        <SidebarContainer isOpen={isOpen}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                    <Terminal htmlColor="#fff" fontSize="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>History</Typography>
            </Box>

            <Box sx={{ px: 2, mb: 4 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onNewChat}
                    sx={{
                        borderRadius: '16px',
                        height: '56px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px rgba(59, 130, 246, 0.35)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    New Case
                </Button>
            </Box>

            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                px: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
                <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
                    {conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <ListItem
                                key={conv._id || conv.id}
                                button
                                onClick={() => onSelectConversation(conv)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { bgcolor: alpha('#94a3b8', 0.1) },
                                    bgcolor: currentConversationId === (conv._id || conv.id) ? alpha('#3b82f6', 0.1) : 'transparent',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: '#94a3b8' }}>
                                    <ChatBubbleOutline fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={conv.title || conv.messages?.[0]?.text || 'Untitled Session'}
                                    secondary={new Date(conv.updated_at || conv.timestamp).toLocaleDateString()}
                                    primaryTypographyProps={{ noWrap: true, fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem', color: '#94a3b8' }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conv._id || conv.id);
                                    }}
                                    sx={{ opacity: 0.2, '&:hover': { opacity: 1, color: '#ef4444' } }}
                                >
                                    <Delete fontSize="inherit" />
                                </IconButton>
                            </ListItem>
                        ))
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                            <History sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="caption">No previous sessions</Typography>
                        </Box>
                    )}
                </List>
            </Box>
        </SidebarContainer>
    );
};

export default Sidebar;
