// backend/controllers/logController.js
const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
    const { resourceType, resourceId } = req.query;
    try {
        const query = {};
        if (resourceType) query.resourceType = resourceType;
        if (resourceId) query.resourceId = resourceId;
        const logs = await Log.find(query).populate('performedBy', 'username');
        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
