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
        // TTS失败时回退到文本模式，而不是完全失败
        console.warn('TTS失败，回退到文本模式:', ttsRes.error);
        return { 
            success: true, 
            text, 
            prompt: result.prompt,
            ttsError: ttsRes.error  // 保留错误信息供前端显示
        };
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

    let ttsRes = await synthesizeSpeech({ text, ...ttsOptions });
    
    // 如果女声音色失败，尝试使用男声作为备用
    if (!ttsRes.success && ttsOptions.voiceType === 'qiniu_zh_female_xyqxxj') {
        console.warn('红鸾天喜女声音色失败，尝试使用男声备用:', ttsRes.error);
        const backupOptions = {
            ...ttsOptions,
            voiceType: 'qiniu_zh_male_ybxknjs',  // 备用男声
            voiceName: '天乙贵人（备用）',
            category: '传统音色'
        };
        ttsRes = await synthesizeSpeech({ text, ...backupOptions });
    }
    
    if (!ttsRes.success) {
        // TTS失败时回退到文本模式，而不是完全失败
        console.warn('TTS失败，回退到文本模式:', ttsRes.error);
        return { 
            success: true, 
            text, 
            prompt: result.prompt,
            ttsError: ttsRes.error  // 保留错误信息供前端显示
        };
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
        // TTS失败时回退到文本模式，而不是完全失败
        console.warn('TTS失败，回退到文本模式:', ttsRes.error);
        return { 
            success: true, 
            text, 
            prompt: result.prompt,
            ttsError: ttsRes.error  // 保留错误信息供前端显示
        };
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


