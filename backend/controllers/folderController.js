const Folder = require('../models/Folder');
const bcrypt = require('bcryptjs');
const { isModOrOwnerOrAdmin, canAddFiles, canModify, canModifyFile} = require('../helpers/folderPermissions');


exports.createFolder = async (req, res) => {
  const { name, locked, password, visibility, parentFolderId } = req.body;
  const user = req.user;

  try {
    let passwordHash = null;
    let folderLocked = false;

    if (locked && password) {
      passwordHash = await bcrypt.hash(password, 10);
      folderLocked = true;
    }

    // If a parent folder is provided, validate its existence and permissions
    let parentFolder = null;
    if (parentFolderId) {
      parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder) return res.status(404).json({ message: 'Parent folder not found' });

      // Check if the user can add a subfolder
      if (!isModOrOwnerOrAdmin(parentFolder, user)) {
        return res.status(403).json({ message: 'Unauthorized: You cannot create a folder inside this parent folder.' });
      }
    }

    const folder = new Folder({
      name,
      locked: folderLocked,
      passwordHash,
      visibility: visibility || 'private',
      createdBy: user.id,
      parentFolder: parentFolderId || null,
      mods: [], // Initially empty
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

    if (!canModify(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot delete this folder.' });
    }

    // Ensure folder has no subfolders or files
    const subfolders = await Folder.find({ parentFolder: folderId });
    if (subfolders.length > 0) {
      return res.status(400).json({ message: 'Cannot delete a folder with subfolders' });
    }

    if (folder.files.length > 0) {
      return res.status(400).json({ message: 'Cannot delete a folder with files' });
    }

    await folder.deleteOne();
    res.status(200).json({ message: 'Folder deleted successfully' });
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

    if (!isModOrOwnerOrAdmin(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot update this folder.' });
    }

    folder.visibility = folder.visibility === 'private' ? 'public' : 'private';
    folder.log.push({
      action: `changed visibility to ${folder.visibility}`,
      performedBy: user.id,
      performedAt: new Date(),
    });

    await folder.save();

    res.status(200).json({ message: 'Folder visibility toggled successfully', folder });
  } catch (error) {
    console.error('Error toggling folder visibility:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.addModToFolder = async (req, res) => {
  const { folderId } = req.params;
  const { newModUserId } = req.body;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (folder.createdBy.toString() !== user.id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: You cannot add mods to this folder.' });
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

    if (folder.createdBy.toString() !== user.id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: You cannot remove mods from this folder.' });
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
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId).populate('files');
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (folder.locked) {
      return res.status(401).json({ message: 'Folder is locked. Unlock it first to access.' });
    }

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

exports.listFilesAndSubfolders = async (req, res) => {
  const { folderId } = req.params;
  const user = req.user;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Check permissions: Only mods, owners, or admins can view private folders
    if (folder.visibility === 'private' && !isModOrOwnerOrAdmin(folder, user)) {
      return res.status(403).json({ message: 'Unauthorized: You cannot view the contents of this private folder.' });
    }

    // Get files and subfolders within the folder
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