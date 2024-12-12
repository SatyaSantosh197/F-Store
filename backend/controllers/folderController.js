const { isOwner, isMod, canAddFiles, canModify, canModifyFile } = require('../helpers/folderPermissions');
const telegramService = require('../services/telegramService');
const bcrypt = require('bcryptjs');

const Folder = require('../models/Folder');
const File = require('../models/File');
const User = require('../models/User');


exports.createFolder = async (req, res) => {
  const { name, locked = false, password, visibility = 'public' } = req.body;
  const parentFolderId = req.headers['parent-folder-id'] || null;
  const user = req.user;

  try {
    let passwordHash = null;

    if (locked && password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else if (locked && !password) {
      return res.status(400).json({ message: 'Password is required when locking a folder.' });
    }

    let parentFolder = null;
    if (parentFolderId) {
      parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder) return res.status(404).json({ message: 'Parent folder not found' });

      if (!isOwner(parentFolder, user) && !isMod(parentFolder, user)) {
        return res.status(403).json({ message: 'Unauthorized: You cannot create a folder inside this parent folder.' });
      }
    }

    const folder = new Folder({
      name,
      locked,
      passwordHash,
      visibility,
      createdBy: user.id,
      parentFolder: parentFolderId || null,
      mods: [user.id],
      log: [{ action: 'created', performedBy: user.id }],
    });

    await folder.save();
    res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.renameFolder = async (req, res) => {
  const { folderId } = req.params;
  const { newName } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!canModify(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot rename this folder.' });
    }

    folder.name = newName;
    folder.log.push({ action: 'renamed', performedBy: user.id });
    await folder.save();

    res.status(200).json({ message: 'Folder renamed successfully', folder });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.deleteFolder = async (req, res) => {
  const { folderId } = req.params;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!isOwner(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot delete this folder.' });
    }

    const deleteFolderAndSubfolders = async (folderId) => {
      const subfolders = await Folder.find({ parentFolder: folderId });
      for (const subfolder of subfolders) {
        await deleteFolderAndSubfolders(subfolder._id);
      }

      const files = await File.find({ folder: folderId });
      for (const file of files) {
        try {
          await telegramService.deleteFileFromTelegram(file.telegramFileId);
        } catch (err) {
          console.error(`Error deleting file from Telegram: ${file.name}`, err.message);
        }
        await file.deleteOne();
      }

      await Folder.findByIdAndDelete(folderId);
    };

    await deleteFolderAndSubfolders(folderId);

    res.status(200).json({ message: 'Folder, its subfolders, and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.toggleVisibility = async (req, res) => {
  const { folderId } = req.params;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!canModify(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot update this folder.' });
    }

    folder.visibility = folder.visibility === 'private' ? 'public' : 'private';
    folder.log.push({
      action: `changed visibility to ${folder.visibility}`,
      performedBy: user.id,
    });

    await folder.save();
    res.status(200).json({ message: 'Folder visibility toggled successfully', folder });
  } catch (error) {
    console.error('Error toggling folder visibility:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addModToFolder = async (req, res) => {
  const { folderId } = req.params;
  const { newModUserId } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!isOwner(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can add mods to this folder.' });
    }

    if (folder.mods.some(modId => modId.toString() === newModUserId)) {
      return res.status(400).json({ message: 'User is already a mod' });
    }

    folder.mods.push(newModUserId);
    folder.log.push({ action: 'added mod', performedBy: user.id });
    await folder.save();

    res.status(200).json({ message: 'Mod added successfully', folder });
  } catch (error) {
    console.error('Error adding mod to folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.removeModFromFolder = async (req, res) => {
  const { folderId } = req.params;
  const { modUserId } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!isOwner(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can remove mods from this folder.' });
    }

    folder.mods = folder.mods.filter(modId => modId.toString() !== modUserId);
    folder.log.push({ action: 'removed mod', performedBy: user.id });
    await folder.save();

    res.status(200).json({ message: 'Mod removed successfully', folder });
  } catch (error) {
    console.error('Error removing mod from folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.searchUser = async (req, res) => {
  const { query } = req.query;
  const user = req.user;

  try {
    if (!query) return res.status(400).json({ message: 'Query parameter is required' });

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: user.id },
    }).select('_id username email');

    res.status(200).json({ message: 'Users fetched successfully', users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.lockFolder = async (req, res) => {
  const { folderId } = req.params;
  const { password } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!canModify(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot lock this folder.' });
    }

    if (folder.locked) {
      return res.status(400).json({ message: 'Folder is already locked' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required to lock the folder' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    folder.locked = true;
    folder.passwordHash = passwordHash;
    folder.log.push({ action: 'locked', performedBy: user.id });

    await folder.save();

    res.status(200).json({ message: 'Folder locked successfully', folder });
  } catch (error) {
    console.error('Error locking folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.openFolder = async (req, res) => {
  const { folderId } = req.params;
  const { password } = req.body; // Accept password from request body
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId).populate('files');
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (folder.locked) {
      if (!password) {
        return res.status(401).json({ message: 'Password required to open this folder.' });
      }

      const isMatch = await bcrypt.compare(password, folder.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password. Access denied.' });
      }
    }

    // Check visibility and permissions for private folders
    if (folder.visibility === 'private' && !isModOrOwnerOrAdmin(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot open this private folder.' });
    }

    // Retrieve subfolders
    const subfolders = await Folder.find({ parentFolder: folderId });

    res.status(200).json({
      message: 'Folder opened successfully',
      folder,
      files: folder.files,
      subfolders,
    });
  } catch (error) {
    console.error('Error opening folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.unlockFolder = async (req, res) => {
  const { folderId } = req.params;
  const { password } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (!canModify(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot unlock this folder.' });
    }

    if (!folder.locked) {
      return res.status(400).json({ message: 'Folder is not locked' });
    }

    const isMatch = await bcrypt.compare(password, folder.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    folder.locked = false;
    folder.passwordHash = null;
    folder.log.push({ action: 'unlocked', performedBy: user.id });

    await folder.save();

    res.status(200).json({ message: 'Folder unlocked successfully', folder });
  } catch (error) {
    console.error('Error unlocking folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.searchFilesAndFolders = async (req, res) => {
  const { query, visibility } = req.query;
  const user = req.user;

  try {
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const searchConditions = {
      name: { $regex: query, $options: 'i' }, // Case-insensitive regex search
    };

    // Restrict results based on visibility
    if (visibility === 'public') {
      searchConditions.visibility = 'public';
    } else {
      // Private files/folders should only be visible to their mods, owners, or admin
      searchConditions.$or = [
        { visibility: 'public' },
        { createdBy: user.id },
        { mods: user.id },
      ];
    }

    // Search in both files and folders
    const files = await File.find(searchConditions);
    const folders = await Folder.find(searchConditions);

    res.status(200).json({ message: 'Search results', files, folders });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.redirectToFolder = async (req, res) => {
  const { folderId } = req.params;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (folder.locked) {
      return res.status(401).json({
        message: 'Folder is locked. Please unlock it first to access.',
        locked: true,
      });
    }

    // If unlocked or not locked, list contents
    const files = await File.find({ folder: folderId });
    const subfolders = await Folder.find({ parentFolder: folderId });

    res.status(200).json({
      message: 'Redirected to folder contents successfully',
      folder,
      files,
      subfolders,
    });
  } catch (error) {
    console.error('Error redirecting to folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.listFilesAndSubfolders = async (req, res) => {
  const { folderId } = req.params;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Check visibility and permissions for private folders
    if (folder.visibility === 'private' && !isModOrOwnerOrAdmin(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot view the contents of this private folder.' });
    }

    const files = await File.find({ folder: folderId });
    const subfolders = await Folder.find({ parentFolder: folderId });

    res.status(200).json({
      message: 'Contents retrieved successfully',
      folder: {
        name: folder.name,
        id: folder._id,
        visibility: folder.visibility,
        locked: folder.locked,
        createdBy: folder.createdBy,
      },
      files,
      subfolders,
    });
  } catch (error) {
    console.error('Error listing files and subfolders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};