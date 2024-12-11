const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: Number, default: 1 }, // Version control for files
  telegramFileId: { type: String, required: true }, // Telegram file identifier
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false }, // Folder association
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  log: [
    {
      action: { type: String, required: true }, // Actions performed on the file
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('File', fileSchema);
