const express = require('express');
const fileController = require('../controllers/fileController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/upload', authenticateUser, fileController.uploadFile);
router.get('/download/:fileId', authenticateUser, fileController.downloadFile);
router.post('/rename/:fileId', authenticateUser, fileController.renameFile);
router.delete('/delete/:fileId', authenticateUser, fileController.deleteFile);
router.post('/move/:fileId', authenticateUser, fileController.moveFile);
router.post('/toggle-visibility/:fileId', authenticateUser, fileController.toggleVisibility);

module.exports = router;
