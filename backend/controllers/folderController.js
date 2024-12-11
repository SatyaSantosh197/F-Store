const Folder = require('../models/Folder');
const bcrypt = require('bcryptjs');

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
    const { password } = req.body;
    const userId = req.user._id;

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        if (folder.locked) {
            return res.status(400).json({ message: 'Folder is already locked' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        folder.locked = true;
        folder.passwordHash = passwordHash;
        folder.log.push({ action: 'locked', performedBy: userId });

        await folder.save();

        res.status(200).json({ message: 'Folder locked successfully', folder });
    } catch (error) {
        console.error('Error locking folder:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.unlockFolder = async (req, res) => {
    const { folderId } = req.params;
    const { password } = req.body;
    const userId = req.user._id;

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        if (!folder.locked) {
            return res.status(400).json({ message: 'Folder is not locked' });
        }

        const isMatch = await bcrypt.compare(password, folder.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        folder.locked = false;
        folder.passwordHash = null;
        folder.log.push({ action: 'unlocked', performedBy: userId });

        await folder.save();

        res.status(200).json({ message: 'Folder unlocked successfully', folder });
    } catch (error) {
        console.error('Error unlocking folder:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.openFolder = async (req, res) => {
    const { folderId } = req.params;

    try {
        const folder = await Folder.findById(folderId).populate('files');
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        if (folder.visibility === 'private') {
            return res.status(403).json({ message: 'Unauthorized: This folder is private and cannot be opened.' });
        }

        if (folder.locked) {
            return res.status(401).json({ message: 'Folder is locked. Provide a password to unlock.' });
        }

        res.status(200).json({
            message: 'Folder opened successfully',
            folder,
            files: folder.files,
        });
    } catch (error) {
        console.error('Error opening folder:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.toggleVisibility = async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user._id;

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        if (folder.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You cannot update this folder.' });
        }

        folder.visibility = folder.visibility === 'private' ? 'public' : 'private';
        folder.log.push({
            action: `changed visibility to ${folder.visibility}`,
            performedBy: userId,
            performedAt: new Date(),
        });

        await folder.save();

        res.status(200).json({ message: 'Folder visibility toggled successfully', folder });
    } catch (error) {
        console.error('Error toggling folder visibility:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
