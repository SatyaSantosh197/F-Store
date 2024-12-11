const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locked: { type: Boolean, default: false },
  passwordHash: { type: String, required: false }, // Optional for unlocked folders
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  log: [
    {
      action: { type: String, required: true }, // e.g., "created", "locked", "unlocked"
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('Folder', folderSchema);
