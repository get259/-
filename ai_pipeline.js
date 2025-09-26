/**
 * AI 处理流水线
 * 1) 接收八字分析文本
 * 2) 可选进行 TTS 合成
 * 输出：文本 或 音频 Buffer
 */

const { analyzeBazi } = require('./qwen_client');
const { synthesizeSpeech } = require('./tts_client');
const { marriagePromptFunction } = require('./marriage_prompt_functions');
const { fortunePromptFunction } = require('./fortune_prompt_functions');

/**
 * 一体化分析与可选 TTS
 * @param {Object} params
 * @param {Object} params.baziData 八字数据
 * @param {string} params.questionType 问题类型
 * @param {string} params.userQuestion 用户问题
 * @param {Function} params.customPromptFunc 提示词函数
 * @param {boolean} [params.enableTts] 是否开启 TTS
 * @param {Object} [params.ttsOptions] TTS 选项，见 synthesizeSpeech
 * @returns {Promise<{success:boolean, text?:string, audioBuffer?:Buffer, contentType?:string, error?:string, prompt?:string}>}
 */
async function analyzeWithOptionalTts(params) {
    const {
        baziData,
        questionType,
        userQuestion,
        customPromptFunc,
        enableTts = false,
        ttsOptions = {}
    } = params || {};

    const result = await analyzeBazi(baziData, questionType, userQuestion, customPromptFunc);
    if (!result.success) {
        return { success: false, error: result.error };
    }

    const text = result.analysis;
    if (!enableTts) {
        return { success: true, text, prompt: result.prompt };
    }

    const ttsRes = await synthesizeSpeech({ text, ...ttsOptions });
    if (!ttsRes.success) {
        return { success: false, error: ttsRes.error };
    }

    return {
        success: true,
        text,
        audioBuffer: ttsRes.audioBuffer,
        contentType: ttsRes.contentType,
        prompt: result.prompt
    };
}

/**
 * 婚姻/感情分析与可选 TTS（复用统一客户端）
 * @param {Object} params
 * @param {Object} params.baziData 八字数据
 * @param {string} params.userQuestion 用户问题
 * @param {boolean} [params.enableTts] 是否开启 TTS
 * @param {Object} [params.ttsOptions] TTS 选项
 * @returns {Promise<{success:boolean, text?:string, audioBuffer?:Buffer, contentType?:string, error?:string, prompt?:string}>}
 */
async function analyzeMarriageWithOptionalTts(params) {
    const {
        baziData,
        userQuestion,
        enableTts = true,
        ttsOptions = {}
    } = params || {};

    const result = await analyzeBazi(baziData, 'marriage', userQuestion, marriagePromptFunction);
    if (!result.success) {
        return { success: false, error: result.error };
    }

    const text = result.analysis;
    if (!enableTts) {
        return { success: true, text, prompt: result.prompt };
    }

    const ttsRes = await synthesizeSpeech({ text, ...ttsOptions });
    if (!ttsRes.success) {
        return { success: false, error: ttsRes.error };
    }

    return {
        success: true,
        text,
        audioBuffer: ttsRes.audioBuffer,
        contentType: ttsRes.contentType,
        prompt: result.prompt
    };
}

/**
 * 时运分析与可选 TTS（强调当下日期 2025-09-26）
 * @param {Object} params
 * @param {Object} params.baziData 八字数据
 * @param {string} params.userQuestion 用户问题
 * @param {boolean} [params.enableTts] 是否开启 TTS
 * @param {Object} [params.ttsOptions] TTS 选项
 * @returns {Promise<{success:boolean, text?:string, audioBuffer?:Buffer, contentType?:string, error?:string, prompt?:string}>}
 */
async function analyzeFortuneWithOptionalTts(params) {
    const {
        baziData,
        userQuestion,
        enableTts = true,
        ttsOptions = {}
    } = params || {};

    const result = await analyzeBazi(baziData, 'fortune', userQuestion, fortunePromptFunction);
    if (!result.success) {
        return { success: false, error: result.error };
    }

    const text = result.analysis;
    if (!enableTts) {
        return { success: true, text, prompt: result.prompt };
    }

    const ttsRes = await synthesizeSpeech({ text, ...ttsOptions });
    if (!ttsRes.success) {
        return { success: false, error: ttsRes.error };
    }

    return {
        success: true,
        text,
        audioBuffer: ttsRes.audioBuffer,
        contentType: ttsRes.contentType,
        prompt: result.prompt
    };
}

module.exports = {
    analyzeWithOptionalTts,
    analyzeMarriageWithOptionalTts,
    analyzeFortuneWithOptionalTts
};


