import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import AuditLog from '../../components/admin/AuditLog';
import { adminAPI } from '../../services/api';

const Audit = () => {
    const { adminData, fetchDashboardData } = useOutletContext();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const PAGE_LIMIT = 11; // User requested 10 to 12

    // Initial sync with global state
    useEffect(() => {
        if (!searchQuery && !statusFilter && page === 1) {
            setFilteredHistory(adminData.trainingHistory.slice(0, PAGE_LIMIT));
            setTotalDocs(adminData.trainingHistory.length);
            setHasMore(adminData.trainingHistory.length > PAGE_LIMIT);
        }
    }, [adminData.trainingHistory, searchQuery, statusFilter, page]);

    // Fetch logic
    const fetchFilteredData = useCallback(async (isLoadMore = false) => {
        const targetPage = isLoadMore ? page + 1 : 1;

        setIsSearching(true);
        try {
            const res = await adminAPI.getTrainingHistory(targetPage, PAGE_LIMIT, searchQuery, statusFilter);
            if (res.success) {
                if (isLoadMore) {
                    setFilteredHistory(prev => [...prev, ...(res.data.history || [])]);
                    setPage(targetPage);
                } else {
                    setFilteredHistory(res.data.history || []);
                    setPage(1);
                }
                setTotalDocs(res.data.total || 0);
                setHasMore(res.data.hasMore || false);
            }
        } catch (err) {
            console.error('Fetch failed:', err);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, statusFilter, page]);

    // Handle Search/Filter changes (Debounced)
    useEffect(() => {
        if (page === 1 && !searchQuery && !statusFilter) return;

        const timer = setTimeout(() => {
            // If they start typing/filtering, reset to page 1
            if (searchQuery || statusFilter) {
                fetchFilteredData(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    const handleResumeTraining = async (docId) => {
        setIsSearching(true);
        try {
            const res = await adminAPI.resumeTraining(docId);
            if (res.success) {
                // Professional redirection to Training Center for monitoring
                navigate(`/admin/training?resumeId=${docId}`);
            } else {
                alert(res.message || 'Failed to resume training');
            }
        } catch (err) {
            console.error('Resume failed:', err);
            alert('Failed to resume training due to a network error.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleDeleteDocument = async (doc) => {
        const confirmDelete = window.confirm(`Are you sure you want to PERMANENTLY delete "${doc.documentName}"? \n\nThis will remove it from the AI's knowledge base, delete all associated vectors, and remove the file from the server.`);

        if (!confirmDelete) return;

        setIsSearching(true);
        try {
            const res = await adminAPI.deleteTrainingDocument(doc._id);
            if (res.success) {
                await fetchDashboardData();
            } else {
                alert(res.message || 'Failed to delete document');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete document due to a network error.');
        } finally {
            setIsSearching(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            default: return 'error';
        }
    };

    return (
        <Fade in timeout={500}>
            <Box>
                <AuditLog
                    history={filteredHistory}
                    onRefresh={fetchDashboardData}
                    formatDate={formatDate}
                    formatFileSize={formatFileSize}
                    getStatusColor={getStatusColor}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    onResume={handleResumeTraining}
                    onDelete={handleDeleteDocument}
                    isLoading={isSearching}
                    onLoadMore={() => fetchFilteredData(true)}
                    hasMore={hasMore}
                    totalDocs={totalDocs}
                />
            </Box>
        </Fade>
    );
};

export default Audit;
