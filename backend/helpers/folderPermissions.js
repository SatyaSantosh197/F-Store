function isModOrOwnerOrAdmin(folder, user) {
  if (user.role === 'admin') return true;
  if (folder.createdBy.toString() === user.id.toString()) return true;
  if (folder.mods && folder.mods.some(modId => modId.toString() === user.id.toString())) return true;
  return false;
}

function canAddFiles(folder, user) {
  // If folder is public, anyone can add files.
  if (folder.visibility === 'public') return true;
  // If folder is private, only mods/owner/admin can add files
  return isModOrOwnerOrAdmin(folder, user);
}

function canModify(folder, user) {
  // Actions like rename folder, delete folder, lock/unlock folder
  return isModOrOwnerOrAdmin(folder, user);
}

function canModifyFile(folder, user) {
  // Renaming, deleting files is restricted to mods/owner/admin irrespective of visibility
  return isModOrOwnerOrAdmin(folder, user);
}

// Export all functions
module.exports = {
  isModOrOwnerOrAdmin,
  canAddFiles,
  canModify,
  canModifyFile,
};
