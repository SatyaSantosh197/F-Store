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
    // If private, only mods/owner/admin can do it. If public, also only mods/owner/admin for safety.
    // Adjust if you want different logic for public.
    return isModOrOwnerOrAdmin(folder, user);
  }
  
  function canModifyFile(folder, user) {
    // Renaming, deleting files is restricted to mods/owner/admin irrespective of visibility
    // (If you want different rules for public folders, adjust here)
    return isModOrOwnerOrAdmin(folder, user);
  }
  