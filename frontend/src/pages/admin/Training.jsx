import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import { adminAPI } from '../../services/api';
import TrainingCenter from '../../components/admin/TrainingCenter';

const Training = () => {
    const { fetchDashboardData } = useOutletContext();

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [filesStatus, setFilesStatus] = useState({});

    // Real-time monitoring for Resumed training
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resumeId');
    const [activeTraining, setActiveTraining] = useState(null);
    const pollingInterval = useRef(null);

    // Initial check for resumeId
    useEffect(() => {
        if (resumeId) {
            startMonitoring(resumeId);
        }
        return () => stopMonitoring();
    }, [resumeId]);

    const stopMonitoring = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    const startMonitoring = (id) => {
        if (!id) return;
        setUploading(true);
        stopMonitoring();

        let retryCount = 0;
        const fetchStatus = async () => {
            try {
                const res = await adminAPI.getTrainingStatus(id);
                if (res.success) {
                    const data = res.data;
                    setActiveTraining(data);
                    setBatchProgress(data.progress || 0);
                    retryCount = 0; // Reset on success

                    if (data.status === 'completed' || data.status === 'failed' || data.status === 'error') {
                        stopMonitoring();
                        setUploading(false);
                        fetchDashboardData(true); // Background refresh
                    }
                } else {
                    retryCount++;
                    if (retryCount > 5) stopMonitoring();
                }
            } catch (err) {
                console.error('Status fetch failed:', err);
                retryCount++;
                if (retryCount > 5) stopMonitoring();
            }
        };

        fetchStatus();
        pollingInterval.current = setInterval(fetchStatus, 3000); // Relaxed to 3s
    };

    const handleFilesSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            // Initialize status for new files
            const newStatus = {};
            files.forEach(file => {
                newStatus[file.name] = { status: 'pending', progress: 0 };
            });
            setFilesStatus(prev => ({ ...prev, ...newStatus }));
        }
    };

    const handleRemoveFile = (index) => {
        const fileToRemove = selectedFiles[index];
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilesStatus(prev => {
            const next = { ...prev };
            delete next[fileToRemove.name];
            return next;
        });
    };

    const handleClearAll = () => {
        setSelectedFiles([]);
        setFilesStatus({});
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setBatchProgress(0);

        const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const totalFiles = selectedFiles.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = selectedFiles[i];

            // Mark current file as processing
            setFilesStatus(prev => ({
                ...prev,
                [file.name]: { ...prev[file.name], status: 'processing', progress: 0 }
            }));

            // Individual file progress simulation pulse
            let fileProgress = 0;
            const progressInterval = setInterval(() => {
                fileProgress = Math.min(fileProgress + 5, 95);
                setFilesStatus(prev => ({
                    ...prev,
                    [file.name]: { ...prev[file.name], progress: fileProgress }
                }));
            }, 200);

            try {
                const response = await adminAPI.uploadDocument(file, adminData);

                clearInterval(progressInterval);

                if (response.success) {
                    setFilesStatus(prev => ({
                        ...prev,
                        [file.name]: { status: 'success', progress: 100 }
                    }));

                    // Trigger real-time monitoring for the newly uploaded document
                    if (response.data && response.data.documentId) {
                        startMonitoring(response.data.documentId);
                    }
                } else {
                    setFilesStatus(prev => ({
                        ...prev,
                        [file.name]: { status: 'error', progress: 0, error: response.message }
                    }));
                }
            } catch (err) {
                clearInterval(progressInterval);
                setFilesStatus(prev => ({
                    ...prev,
                    [file.name]: { status: 'error', progress: 0, error: err.message }
                }));
            }

            // Update aggregate batch progress
            const newBatchProgress = Math.round(((i + 1) / totalFiles) * 100);
            setBatchProgress(newBatchProgress);
        }

        setUploading(false);
        fetchDashboardData();
    };

    const handleBulkTrain = async () => {
        setUploading(true);
        try {
            const response = await adminAPI.bulkTrainDocuments();
            if (response.success) {
                if (response.data?.documentId) {
                    startMonitoring(response.data.documentId);
                } else {
                    // Sync complete case (no new files)
                    alert(response.message || 'Library is already up to date.');
                    setUploading(false);
                }
            } else {
                alert('Bulk training failed to start: ' + (response.message || 'Unknown error'));
                setUploading(false);
            }
        } catch (err) {
            console.error('Bulk train failed:', err);
            alert('Bulk train error: ' + err.message);
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    };

    return (
        <Fade in timeout={500}>
            <Box>
                <TrainingCenter
                    selectedFiles={selectedFiles}
                    onFilesSelect={handleFilesSelect}
                    onUpload={handleUpload}
                    uploading={uploading}
                    batchProgress={batchProgress}
                    filesStatus={filesStatus}
                    onRemoveFile={handleRemoveFile}
                    formatFileSize={formatFileSize}
                    onClearAll={handleClearAll}
                    activeTraining={activeTraining}
                    onBulkTrain={handleBulkTrain}
                />
            </Box>
        </Fade>
    );
};

export default Training;
