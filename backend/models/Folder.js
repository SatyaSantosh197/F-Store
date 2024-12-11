const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locked: { type: Boolean, default: false },
  passwordHash: { type: String, required: false },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  log: [
    {
      action: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('Folder', folderSchema);
