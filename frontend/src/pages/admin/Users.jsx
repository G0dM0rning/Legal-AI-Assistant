import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import UserManagement from '../../components/admin/UserManagement';
import { adminAPI } from '../../services/api';

const Users = () => {
    const { adminData, fetchDashboardData } = useOutletContext();
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const totalUsers = adminData.stats.totalUsers || 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / LIMIT));

    const handlePageChange = useCallback(async (newPage) => {
        setPage(newPage);
        // Trigger a fresh fetch with pagination from AdminLayout
        await fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <Fade in timeout={500}>
            <Box>
                <UserManagement
                    users={adminData.users}
                    totalUsers={totalUsers}
                    onRefresh={fetchDashboardData}
                    page={page}
                    onPageChange={handlePageChange}
                    totalPages={totalPages}
                />
            </Box>
        </Fade>
    );
};

export default Users;
