/**
 * 七牛云 TTS 客户端
 * 封装文本转语音调用，返回音频 Buffer，便于后端转发给前端
 */

const axios = require('axios');

// 手动加载环境变量（与qwen_client.js相同的逻辑）
(() => {
    try {
        require('dotenv').config();
    } catch (_) {
        try {
            const fs = require('fs');
            const path = require('path');
            const envPath = path.resolve(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                content.split(/\r?\n/).forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) return;
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex === -1) return;
                    const key = trimmed.slice(0, eqIndex).trim();
                    const value = trimmed.slice(eqIndex + 1).trim();
                    if (key && !(key in process.env)) {
                        process.env[key] = value;
                    }
                });
            }
        } catch (_) {}
    }
})();

// TTS专用配置（独立于文本API）
const TTS_CONFIG = {
    baseURL: process.env.QINIU_TTS_BASE_URL || process.env.QINIU_BASE_URL || 'https://openai.qiniu.com/v1',
    model: process.env.QINIU_TTS_MODEL || 'tts',
    apiKey: process.env.QINIU_TTS_API_KEY || process.env.QINIU_API_KEY || '',
    defaultVoiceType: process.env.QINIU_TTS_VOICE_TYPE || 'qiniu_zh_male_ybxknjs'
};

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
 * @param {string} [params.voiceType] 建议传入，如 qiniu_zh_male_ybxknjs 或 qiniu_zh_female_xyqxxj
 * @param {string} [params.voiceName] 可选，语音展示名（如：校园清新学姐、天乙贵人）
 * @param {string} [params.category] 可选，音色分类（如：传统音色）
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
        category,
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
        const requestBody = {
            audio: {
                voice_type: voiceType || TTS_CONFIG.defaultVoiceType,
                encoding: format || 'mp3',
                speed_ratio: speechRate || 1.0
            },
            request: {
                text: text
            }
        };
        
        console.log('TTS请求配置:', JSON.stringify({
            url: `${TTS_CONFIG.baseURL}/voice/tts`,
            apiKey: TTS_CONFIG.apiKey ? TTS_CONFIG.apiKey.substring(0, 10) + '...' : 'missing',
            voiceType: voiceType || TTS_CONFIG.defaultVoiceType,
            voiceName: voiceName || '默认',
            category: category || '传统音色',
            body: requestBody
        }, null, 2));
        
        const response = await axios.post(
            `${TTS_CONFIG.baseURL}/voice/tts`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${TTS_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        console.log('TTS响应状态:', response.status);
        console.log('TTS响应数据结构:', {
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            dataType: typeof response.data?.data,
            dataLength: response.data?.data?.length || 0
        });
        
        // 七牛云TTS返回JSON格式，包含Base64编码的音频数据
        if (response.data && response.data.data) {
            // response.data.data 包含Base64编码的音频
            const audioBuffer = Buffer.from(response.data.data, 'base64');
            console.log('Base64解码后音频大小:', audioBuffer.length, '字节');
            
            // 验证音频数据是否有效
            if (audioBuffer.length === 0) {
                console.error('TTS返回空的音频数据');
                return { 
                    success: false, 
                    error: `TTS返回空音频数据，可能音色 ${voiceType || TTS_CONFIG.defaultVoiceType} 不可用` 
                };
            }
            
            return {
                success: true,
                audioBuffer: audioBuffer,
                contentType: getContentType(format)
            };
        } else {
            console.error('TTS响应格式异常:', response.data);
            return { 
                success: false, 
                error: 'TTS响应格式错误：缺少音频数据' 
            };
        }
    } catch (error) {
        console.error('TTS 调用失败:', error.message);
        
        // 如果是404错误，说明TTS服务不可用，返回更友好的错误信息
        if (error.response && error.response.status === 404) {
            return { 
                success: false, 
                error: 'TTS语音合成服务暂时不可用，建议使用文本模式' 
            };
        }
        
        return { success: false, error: error.message };
    }
}

module.exports = {
    synthesizeSpeech
};


