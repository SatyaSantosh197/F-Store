const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., "uploaded", "created folder"
  resourceType: { type: String, required: true }, // e.g., "file", "folder"
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);
