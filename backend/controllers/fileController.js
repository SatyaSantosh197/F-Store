const mime = require('mime-types');
const path = require('path');
const axios = require('axios');
const File = require('../models/File');
const Folder = require('../models/Folder');
const telegramService = require('../services/telegramService');

exports.uploadFile = async (req, res) => {
    const { name, visibility, folderId } = req.body;
    const userId = req.user._id;

    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const fileData = req.files.file;

        // Fetch the folder if folderId is provided
        let folder = null;
        if (folderId) {
            folder = await Folder.findById(folderId);
            if (!folder) {
                return res.status(404).json({ message: 'Folder not found' });
            }
        }
        
        // Upload file to Telegram
        const telegramFileId = await telegramService.uploadFileToTelegram(fileData.data, fileData.name);

        // Create File document
        const file = new File({
            name,
            telegramFileId,
            folder: folderId || null,
            visibility,
            createdBy: userId,
            log: [{ action: 'uploaded', performedBy: userId }],
        });

        await file.save();

        // If the file is in a folder, add the file reference
        if (folder) {
            folder.files.push(file._id);
            await folder.save();
        }

        res.status(201).json({ message: 'File uploaded successfully', file });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.downloadFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user._id;

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        file.log.push({ action: 'downloaded', performedBy: userId });
        await file.save();

        const fileLink = await telegramService.getTelegramFileLink(file.telegramFileId);
        const response = await axios.get(fileLink, { responseType: 'stream' });

        const fileExtension = path.extname(file.name) || '.jpg';
        const fileNameWithExtension = `${file.name}${fileExtension}`;
        const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';

        res.setHeader('Content-Disposition', `attachment; filename="${fileNameWithExtension}"`);
        res.setHeader('Content-Type', mimeType);

        response.data.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.renameFile = async (req, res) => {
    const { fileId } = req.params;
    const { newName } = req.body;
    const userId = req.user._id;

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        file.name = newName;
        file.log.push({ action: 'renamed', performedBy: userId });
        await file.save();

        res.status(200).json({ message: 'File renamed successfully', file });
    } catch (error) {
        console.error('Error renaming file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.deleteFile = async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        await file.deleteOne();

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.moveFile = async (req, res) => {
    const { fileId } = req.params;
    const { newFolderId } = req.body;
    const userId = req.user._id;

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        const newFolder = await Folder.findById(newFolderId);
        if (!newFolder) return res.status(404).json({ message: 'Destination folder not found' });

        file.folder = newFolderId;
        file.log.push({ action: 'moved', performedBy: userId });
        await file.save();

        res.status(200).json({ message: 'File moved successfully', file });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.toggleVisibility = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user._id;

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (file.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You cannot update this file.' });
        }

        file.visibility = file.visibility === 'private' ? 'public' : 'private';
        file.log.push({
            action: `changed visibility to ${file.visibility}`,
            performedBy: userId,
            performedAt: new Date(),
        });

        await file.save();

        res.status(200).json({ message: 'File visibility toggled successfully', file });
    } catch (error) {
        console.error('Error toggling file visibility:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
