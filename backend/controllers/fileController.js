const mime = require('mime-types');
const path = require('path');
const axios = require('axios');
const File = require('../models/File');
const Folder = require('../models/Folder');
const telegramService = require('../services/telegramService');


exports.uploadFile = async (req, res) => {
    const { name, visibility, folderId } = req.body;
    const userId = req.user._id;

    if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    const fileData = req.files.file;

    try {
        // Validate folder if provided
        let folder = null;
        if (folderId) {
            folder = await Folder.findById(folderId);
            if (!folder) return res.status(404).json({ message: 'Folder not found' });
        }

        // Upload the file to Telegram and get the file ID
        const telegramFileId = await telegramService.uploadFileToTelegram(
            fileData.data,
            fileData.name
        );

        // Save the file metadata in the database
        const file = new File({
            name,
            telegramFileId,
            folder: folderId || null,
            visibility,
            createdBy: userId,
            log: [{ action: 'uploaded', performedBy: userId }],
        });

        await file.save();

        res.status(201).json({ message: 'File uploaded successfully', file });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.downloadFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user._id;

    try {
        // Find the file in the database
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Log the download action
        file.log.push({ action: 'downloaded', performedBy: userId });
        await file.save();

        // Get the Telegram file download link
        const fileLink = await telegramService.getTelegramFileLink(file.telegramFileId);

        // Fetch the file from Telegram as a stream
        const response = await axios.get(fileLink, { responseType: 'stream' });

        // Determine file extension and MIME type
        const fileExtension = path.extname(file.name) || '.jpg'; // Default to ".jpg" if no extension exists
        const fileNameWithExtension = `${file.name}${fileExtension}`;
        const mimeType = mime.getType(fileExtension); // Get MIME type from the extension

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileNameWithExtension}"`);
        res.setHeader('Content-Type', mimeType || 'application/octet-stream'); // Fallback to 'application/octet-stream'

        // Pipe the file stream to the response
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
        // Find the file in the database
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Update the file name and log the rename action
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
    const userId = req.user._id;

    try {
        // Find the file in the database
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Delete the file record
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
        // Find the file in the database
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Validate the destination folder
        const newFolder = await Folder.findById(newFolderId);
        if (!newFolder) return res.status(404).json({ message: 'Destination folder not found' });

        // Update the file's folder and log the move action
        file.folder = newFolderId;
        file.log.push({ action: 'moved', performedBy: userId });
        await file.save();

        res.status(200).json({ message: 'File moved successfully', file });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
