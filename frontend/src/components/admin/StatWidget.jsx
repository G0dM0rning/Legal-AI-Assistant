import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    TrendingUp,
    TrendingDown,
    HorizontalRule
} from '@mui/icons-material';

const countUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const WidgetCard = styled(Card)(({ theme }) => ({
    background: alpha('#1e293b', 0.5),
    backdropFilter: 'blur(12px)',
    border: `1px solid ${alpha('#94a3b8', 0.1)}`,
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    boxShadow: 'none',
    '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: alpha('#3b82f6', 0.3),
    }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color, 0.1),
    color: color,
    marginBottom: '8px',
}));

const TrendChip = styled(Box)(({ theme, trend }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: trend === 'up' ? alpha('#10b981', 0.1) : trend === 'down' ? alpha('#ef4444', 0.1) : alpha('#94a3b8', 0.1),
    color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8',
}));

const StatWidget = ({ title, value, icon, color = '#3b82f6', trend, trendValue }) => {
    return (
        <WidgetCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <IconWrapper color={color}>
                    {icon}
                </IconWrapper>
                {trend && (
                    <TrendChip trend={trend}>
                        {trend === 'up' ? <TrendingUp sx={{ fontSize: 14 }} /> : trend === 'down' ? <TrendingDown sx={{ fontSize: 14 }} /> : <HorizontalRule sx={{ fontSize: 14 }} />}
                        {trendValue}
                    </TrendChip>
                )}
            </Box>

            <Box sx={{ animation: `${countUp} 0.5s ease-out forwards` }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {title}
                </Typography>
            </Box>
        </WidgetCard>
    );
};

export default StatWidget;
