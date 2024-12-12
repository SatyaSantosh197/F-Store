const mime = require('mime-types');
const path = require('path');
const axios = require('axios');
const File = require('../models/File');
const Folder = require('../models/Folder');
const telegramService = require('../services/telegramService');
const { isModOrOwnerOrAdmin, canAddFiles, canModifyFile } = require('../helpers/folderPermissions');

exports.uploadFile = async (req, res) => {
  const { name, folderId } = req.body;
  const user = req.user;

  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const fileData = req.files.file;

    let folder = null;
    if (folderId) {
      folder = await Folder.findById(folderId);
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
    }

    const mimeType = fileData.mimetype;
    const actualFileName = fileData.name;
    let uploadResult;

    if (mimeType.startsWith('image/')) {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'photo');
    } else if (mimeType.startsWith('video/')) {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'video');
    } else if (mimeType.startsWith('audio/')) {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'audio');
    } else if (mimeType === 'application/pdf') {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'document'); // PDFs are handled as documents
    } else if (mimeType.startsWith('application/')) {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'document'); // General application types
    } else {
      uploadResult = await telegramService.uploadFileToTelegram(fileData.data, actualFileName, 'document'); // Default to document
    }
    

    const { fileId, messageId } = uploadResult; // Extract fileId and messageId

    const file = new File({
      name: name || actualFileName, // Use provided name or fall back to the original
      actualFileName, // Store the original name
      telegramFileId: fileId, // Use the fileId from upload result
      telegramMessageId: messageId, // Use the messageId from upload result
      folder: folderId || null,
      createdBy: user.id,
      log: [{ action: 'uploaded', performedBy: user.id }],
    });

    await file.save();

    if (folder) {
      folder.files.push(file._id);
      await folder.save();
    }

    res.status(201).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  const { fileId } = req.params;
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.log.push({ action: 'downloaded', performedBy: user.id });
    await file.save();

    const fileLink = await telegramService.getTelegramFileLink(file.telegramFileId);
    const response = await axios.get(fileLink, { responseType: 'stream' });

    const fileNameWithExtension = file.actualFileName || `file-${file._id}`;
    const fileExtension = path.extname(fileNameWithExtension);
    const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${fileNameWithExtension}"`);
    res.setHeader('Content-Type', mimeType);

    response.data.pipe(res);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Error: File not found on Telegram:', error.message);
      return res.status(404).json({ message: 'File not found on Telegram' });
    }

    console.error('Error downloading file:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.renameFile = async (req, res) => {
  const { fileId } = req.params;
  const { newName } = req.body;
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    let folder = null;
    if (file.folder) {
      folder = await Folder.findById(file.folder);
      if (!folder) return res.status(404).json({ message: 'Folder not found' });

      if (!canModifyFile(folder, user)) {
        return res.status(403).json({ message: 'Unauthorized: You cannot rename this file.' });
      }
    } else {
      if (file.createdBy.toString() !== user.id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: You cannot rename this file.' });
      }
    }

    file.name = newName;
    file.log.push({ action: 'renamed', performedBy: user.id });
    await file.save();

    res.status(200).json({ message: 'File renamed successfully', file });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { fileId } = req.params;
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    let folder = null;
    if (file.folder) {
      folder = await Folder.findById(file.folder);
      if (!folder) return res.status(404).json({ message: 'Folder not found' });

      if (!canModifyFile(folder, user)) {
        return res.status(403).json({ message: 'Unauthorized: You cannot delete this file.' });
      }
    } else {
      if (file.createdBy.toString() !== user.id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: You cannot delete this file.' });
      }
    }

    // Delete the file from Telegram
    await telegramService.deleteFileFromTelegram(process.env.TELEGRAM_CHAT_ID, file.telegramMessageId);

    await file.deleteOne();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.moveFile = async (req, res) => {
  const { fileId } = req.params;
  const { newFolderId } = req.body;
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const currentFolder = await Folder.findById(file.folder);
    const newFolder = await Folder.findById(newFolderId);

    if (!newFolder) return res.status(404).json({ message: 'Destination folder not found' });

    if (!canModifyFile(currentFolder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot move this file.' });
    }

    if (!canAddFiles(newFolder, user)) {
      return res.status(403).json({ message: 'You cannot add files to the destination folder.' });
    }

    file.folder = newFolderId;
    file.log.push({ action: 'moved', performedBy: user.id });
    await file.save();

    if (currentFolder) {
      currentFolder.files = currentFolder.files.filter(fId => fId.toString() !== fileId);
      await currentFolder.save();
    }
    newFolder.files.push(file._id);
    await newFolder.save();

    res.status(200).json({ message: 'File moved successfully', file });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
