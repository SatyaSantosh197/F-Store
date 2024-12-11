const express = require('express');
const folderController = require('../controllers/folderController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', authenticateUser, folderController.createFolder);
router.post('/rename/:folderId', authenticateUser, folderController.renameFolder);
router.post('/delete/:folderId', authenticateUser, folderController.deleteFolder);
router.post('/lock/:folderId', authenticateUser, folderController.lockFolder);
router.post('/unlock/:folderId', authenticateUser, folderController.unlockFolder);
router.post('/open/:folderId', authenticateUser, folderController.openFolder);
router.post('/toggle-visibility/:folderId', authenticateUser, folderController.toggleVisibility);


module.exports = router;
