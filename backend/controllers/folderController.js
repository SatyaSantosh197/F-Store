// backend/controllers/folderController.js
const Folder = require('../models/Folder');

exports.createFolder = async (req, res) => {
    const { name, locked, passwordHash, visibility } = req.body;
    const userId = req.user._id;
    try {
        const folder = new Folder({
            name,
            locked,
            passwordHash,
            visibility,
            createdBy: userId,
            log: [{ action: 'created', performedBy: userId }]
        });
        await folder.save();
        res.status(201).json({ message: 'Folder created successfully', folder });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.renameFolder = async (req, res) => {
    const { folderId } = req.params;
    const { newName } = req.body;
    const userId = req.user._id;
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        folder.name = newName;
        folder.log.push({ action: 'renamed', performedBy: userId });
        await folder.save();
        res.status(200).json({ message: 'Folder renamed successfully', folder });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteFolder = async (req, res) => {
    const { folderId } = req.params;
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        await folder.deleteOne();
        res.status(200).json({ message: 'Folder deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.lockFolder = async (req, res) => {
    const { folderId } = req.params;
    const { passwordHash } = req.body;
    const userId = req.user._id;
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        folder.locked = true;
        folder.passwordHash = passwordHash;
        folder.log.push({ action: 'locked', performedBy: userId });
        await folder.save();
        res.status(200).json({ message: 'Folder locked successfully', folder });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.unlockFolder = async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user._id;
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        folder.locked = false;
        folder.passwordHash = null;
        folder.log.push({ action: 'unlocked', performedBy: userId });
        await folder.save();
        res.status(200).json({ message: 'Folder unlocked successfully', folder });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

