const express = require('express');
const folderController = require('../controllers/folderController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', authenticateUser, folderController.createFolder);
router.put('/rename/:folderId', authenticateUser, folderController.renameFolder);
router.delete('/delete/:folderId', authenticateUser, folderController.deleteFolder);
router.put('/lock/:folderId', authenticateUser, folderController.lockFolder);
router.put('/unlock/:folderId', authenticateUser, folderController.unlockFolder);

module.exports = router;
