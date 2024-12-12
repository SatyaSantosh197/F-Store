// Updated helper functions
function isOwner(folder, user) {
  return folder.createdBy.toString() === user.id.toString();
}

function isMod(folder, user) {
  return folder.mods && folder.mods.some(modId => modId.toString() === user.id.toString());
}

function canAddFiles(folder, user) {
  if (folder.visibility === 'public') return true;
  return isOwner(folder, user) || isMod(folder, user);
}

function canModify(folder, user) {
  return isOwner(folder, user) || isMod(folder, user);
}

function canModifyFile(folder, user) {
  return isOwner(folder, user) || isMod(folder, user);
}

module.exports = {
  isOwner,
  isMod,
  canAddFiles,
  canModify,
  canModifyFile,
};
