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

      if (!canAddFiles(folder, user)) {
        return res.status(403).json({ message: 'You do not have permission to add files to this folder.' });
      }
    }

    const existingFile = await File.findOne({ name, folder: folderId });
    if (existingFile) {
      existingFile.version += 1;
      existingFile.log.push({ action: 'version updated', performedBy: user.id });
      await existingFile.save();
      return res.status(200).json({ message: 'New version uploaded', file: existingFile });
    }

    const telegramFileId = await telegramService.uploadFileToTelegram(fileData.data, fileData.name);

    const file = new File({
      name,
      telegramFileId,
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
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.downloadFile = async (req, res) => {
  const { fileId } = req.params;
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Log the download action
    file.log.push({ action: 'downloaded', performedBy: user.id });
    await file.save();

    // Get file link from Telegram and initiate download
    const fileLink = await telegramService.getTelegramFileLink(file.telegramFileId);
    const response = await axios.get(fileLink, { responseType: 'stream' });

    // Prepare file for download
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
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    let folder = null;
    if (file.folder) {
      folder = await Folder.findById(file.folder);
      if (!folder) return res.status(404).json({ message: 'Folder not found' });

      // Check if user can modify file (mod/owner/admin of that folder)
      if (!canModifyFile(folder, user)) {
        return res.status(403).json({ message: 'Unauthorized: You cannot rename this file.' });
      }
    } else {
      // If file has no folder, only creator or admin can rename
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
      // If no folder, creator or admin can delete
      if (file.createdBy.toString() !== user.id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: You cannot delete this file.' });
      }
    }

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
  const user = req.user;

  try {
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const currentFolder = await Folder.findById(file.folder);
    const newFolder = await Folder.findById(newFolderId);

    if (!newFolder) return res.status(404).json({ message: 'Destination folder not found' });

    // Check if the user has permissions to move the file
    if (!canModifyFile(currentFolder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot move this file.' });
    }

    // Ensure the user can add files to the destination folder
    if (!canAddFiles(newFolder, user)) {
      return res.status(403).json({ message: 'You cannot add files to the destination folder.' });
    }

    // Move the file
    file.folder = newFolderId;
    file.log.push({ action: 'moved', performedBy: user.id });
    await file.save();

    // Update current and destination folders' file lists
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
