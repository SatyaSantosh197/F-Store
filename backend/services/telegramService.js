const axios = require('axios');
const FormData = require('form-data');

exports.uploadFileToTelegram = async (fileBuffer, fileName) => {
    const form = new FormData();
    form.append('document', fileBuffer, fileName);

    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument?chat_id=${process.env.TELEGRAM_CHAT_ID}`;
    const response = await axios.post(url, form, { headers: form.getHeaders() });
    return response.data.result.document.file_id; // Return file_id for storage
};

exports.getTelegramFileLink = async (fileId) => {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const response = await axios.get(url);
    const filePath = response.data.result.file_path;
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
};
