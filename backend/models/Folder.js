const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locked: { type: Boolean, default: false },
  passwordHash: { type: String, required: false },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
  log: [
    {
      action: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);
