const axios = require('axios');
const FormData = require('form-data');

exports.uploadFileToTelegram = async (fileBuffer, fileName, type) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);

    switch (type) {
      case 'photo':
        formData.append('photo', fileBuffer, fileName);
        break;
      case 'video':
        formData.append('video', fileBuffer, fileName);
        break;
      default:
        formData.append('document', fileBuffer, fileName);
    }

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/send${type.charAt(0).toUpperCase() + type.slice(1)}`,
      formData,
      { headers: formData.getHeaders() }
    );

    if (response.data && response.data.ok) {
      const result = response.data.result;

      // Extract and return file_id and message_id
      const fileId =
        type === 'photo'
          ? result.photo[result.photo.length - 1].file_id
          : type === 'video'
          ? result.video.file_id
          : result.document.file_id;

      return { fileId, messageId: result.message_id };
    } else {
      throw new Error(`Failed to upload ${type} to Telegram`);
    }
  } catch (error) {
    console.error(`Error in uploadFileToTelegram (${type}):`, error.message);
    throw error;
  }
};

 
exports.getTelegramFileLink = async (fileId) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const response = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const filePath = response.data.result.file_path;

  // Return the direct file download link
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
};


exports.deleteFileFromTelegram = async (chatId, messageId) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const apiUrl = `https://api.telegram.org/bot${botToken}/deleteMessage`;

  try {
    const response = await axios.post(apiUrl, {
      chat_id: chatId,
      message_id: messageId,
    });

    if (!response.data.ok) {
      throw new Error('Failed to delete message from Telegram');
    }

    return response.data.result;
  } catch (error) {
    console.error('Error in deleteFileFromTelegram:', error.message);
    throw error;
  }
};

  