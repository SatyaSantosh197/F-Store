const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  actualFileName: { type: String, required: true },
  telegramFileId: { type: String, required: true },
  telegramMessageId: { type: String, required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  log: [
    {
      action: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      performedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('File', fileSchema);
