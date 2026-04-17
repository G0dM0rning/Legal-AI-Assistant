import React from 'react';
import { Box, Fade } from '@mui/material';
import SupportCenter from '../../components/admin/SupportCenter';

const Support = () => {
    return (
        <Fade in timeout={500}>
            <Box>
                <SupportCenter />
            </Box>
        </Fade>
    );
};

export default Support;
