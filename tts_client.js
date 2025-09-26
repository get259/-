/**
 * 七牛云 TTS 客户端
 * 封装文本转语音调用，返回音频 Buffer，便于后端转发给前端
 */

const axios = require('axios');
const { QINIU_CONFIG } = require('./qwen_client');

/**
 * 根据格式返回合适的 content-type
 * @param {string} format mp3|wav|ogg
 * @returns {string}
 */
function getContentType(format) {
    switch ((format || 'mp3').toLowerCase()) {
        case 'wav':
            return 'audio/wav';
        case 'ogg':
            return 'audio/ogg';
        default:
            return 'audio/mpeg';
    }
}

/**
 * 文本转语音
 * @param {Object} params
 * @param {string} params.text 必填，待合成文本
 * @param {string} [params.voiceType] 建议传入，如 qiniu_zh_male_ybxknjs
 * @param {string} [params.voiceName] 可选，语音展示名（仅记录，不影响接口）
 * @param {string} [params.model] 模型 ID，默认 'tts'
 * @param {string} [params.format] 音频格式，默认 mp3
 * @param {number} [params.sampleRate] 采样率，可选
 * @param {number} [params.speechRate] 语速，可选（0-2）
 * @param {number} [params.pitch] 音高，可选（-12 ~ +12）
 * @returns {Promise<{success:boolean, audioBuffer?:Buffer, contentType?:string, error?:string}>}
 */
async function synthesizeSpeech(params) {
    const {
        text,
        voiceType,
        voiceName,
        model = 'tts',
        format = 'mp3',
        sampleRate,
        speechRate,
        pitch
    } = params || {};

    if (!text || typeof text !== 'string') {
        return { success: false, error: 'text 不能为空' };
    }

    try {
        const response = await axios.post(
            `${QINIU_CONFIG.baseURL}/audio/speech`,
            {
                model: model,
                input: text,
                voice: voiceType || voiceName || 'qiniu_zh_male_ybxknjs',
                format: format,
                sample_rate: sampleRate,
                speech_rate: speechRate,
                pitch: pitch
            },
            {
                headers: {
                    'Authorization': `Bearer ${QINIU_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        return {
            success: true,
            audioBuffer: Buffer.from(response.data),
            contentType: getContentType(format)
        };
    } catch (error) {
        console.error('TTS 调用失败:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    synthesizeSpeech
};


