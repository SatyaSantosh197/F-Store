const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  telegramFileId: { type: String, required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  log: [
    {
      action: { type: String, required: true }, // e.g., "uploaded", "downloaded"
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('File', fileSchema);
