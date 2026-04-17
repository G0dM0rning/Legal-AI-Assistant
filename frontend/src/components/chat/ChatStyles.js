import { styled, alpha, keyframes } from '@mui/material/styles';
import { Box, Paper, IconButton, Chip, Button } from '@mui/material';
import { motion } from 'framer-motion';

export const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const MainContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    height: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: theme.palette.text.primary,
}));

export const SidebarContainer = styled(Box, { shouldForwardProp: (prop) => prop !== 'isOpen' })(({ theme, isOpen }) => ({
    width: '320px',
    backgroundColor: alpha('#1e293b', 0.8),
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'relative',
    zIndex: 10,
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    marginLeft: isOpen ? 0 : -320,
    boxShadow: isOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
}));

export const SidebarToggle = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'isOpen' })(({ theme, isOpen }) => ({
    position: 'fixed',
    left: isOpen ? 320 : 0,
    marginLeft: isOpen ? -20 : 20,
    top: 20,
    zIndex: 2000,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    width: 40,
    height: 40,
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: `0 4px 15px ${alpha('#3b82f6', 0.4)}`,
    '&:hover': {
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        transform: 'scale(1.1) rotate(5deg)',
    },
}));

export const MainSection = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'transparent',
    position: 'relative',
    overflow: 'hidden',
}));

export const ChatHeaderStyled = styled(Box, { shouldForwardProp: (prop) => prop !== 'isOpen' })(({ theme, isOpen }) => ({
    padding: theme.spacing(1.5, 4),
    paddingLeft: theme.spacing(9),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
    background: alpha('#0f172a', 0.6),
    backdropFilter: 'blur(20px)',
    zIndex: 1000,
    height: 72,
}));

export const ChatArea = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing(4, 2),
    scrollBehavior: 'smooth',
    alignItems: 'center',
    background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.divider, 0.2),
        borderRadius: '10px',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${alpha(theme.palette.divider, 0.2)} transparent`,
}));

export const MessagesContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    flexDirection: 'column',
}));

export const InputSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5, 4, 3),
    backgroundColor: 'transparent',
}));

export const InputContainer = styled(Box)(({ theme }) => ({
    maxWidth: 900,
    margin: '0 auto',
    position: 'relative',
    backgroundColor: alpha('#1e293b', 0.8),
    backdropFilter: 'blur(30px)',
    borderRadius: 24,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:focus-within': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 1px ${theme.palette.primary.main}, 0 20px 50px ${alpha(theme.palette.primary.main, 0.2)}`,
        transform: 'translateY(-2px)',
    },
}));

export const MessageBubbleStyled = styled(motion.div)(({ theme, isUser, isError }) => ({
    maxWidth: isUser ? '85%' : '100%',
    padding: theme.spacing(2.5, 3.5),
    marginBottom: theme.spacing(3),
    borderRadius: isUser ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
    backgroundColor: isError
        ? alpha(theme.palette.error.dark, 0.2)
        : isUser
            ? '#1e293b'
            : alpha('#1e293b', 0.4),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isUser ? alpha('#3b82f6', 0.4) : alpha(theme.palette.divider, 0.1)}`,
    color: theme.palette.text.primary,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    boxShadow: isUser
        ? `0 10px 30px ${alpha('#3b82f6', 0.15)}`
        : '0 10px 40px rgba(0,0,0,0.3)',
    position: 'relative',
    fontSize: '1rem',
    lineHeight: 1.8,
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: isUser ? alpha('#3b82f6', 0.6) : alpha(theme.palette.primary.main, 0.3),
        transform: 'translateY(-2px)',
        backgroundColor: isUser ? '#243147' : alpha('#1e293b', 0.6),
    }
}));

export const SourceTag = styled(Chip)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.light,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    height: 24,
    fontSize: '0.75rem',
    fontWeight: 500,
    margin: theme.spacing(0.5, 0.5, 0, 0),
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
}));

export const ActionButton = styled(Button)(({ theme }) => ({
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    boxShadow: `0 4px 15px ${alpha('#3b82f6', 0.2)}`,
    '&:hover': {
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        transform: 'translateY(-2px)',
        boxShadow: `0 6px 20px ${alpha('#3b82f6', 0.3)}`,
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.MuiButton-outlined': {
        background: alpha('#3b82f6', 0.1),
        border: `1px solid ${alpha('#3b82f6', 0.3)}`,
        color: '#93c5fd',
        '&:hover': {
            background: alpha('#3b82f6', 0.2),
            borderColor: '#3b82f6',
        }
    }
}));

export const SystemMessageContainer = styled(Box, { shouldForwardProp: (prop) => prop !== 'isError' })(({ theme, isError }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
    '& > div': {
        padding: theme.spacing(2, 3),
        borderRadius: '16px',
        backgroundColor: isError ? alpha('#ef4444', 0.15) : alpha('#1e293b', 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isError ? alpha('#ef4444', 0.3) : alpha('#3b82f6', 0.2)}`,
        color: isError ? '#fca5a5' : '#e2e8f0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing(2),
        maxWidth: '85%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        fontWeight: 500
    }
}));

export const AttachmentBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    padding: theme.spacing(1, 4),
    maxWidth: 900,
    margin: '0 auto',
    animation: 'fadeIn 0.3s ease-out',
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'translateY(0)' }
    }
}));

export const FileChip = styled(motion.div)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: '12px',
    backgroundColor: alpha('#3b82f6', 0.1),
    border: `1px solid ${alpha('#3b82f6', 0.2)}`,
    color: '#3b82f6',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha('#3b82f6', 0.15),
        borderColor: alpha('#3b82f6', 0.4),
        transform: 'translateY(-2px)'
    }
}));
