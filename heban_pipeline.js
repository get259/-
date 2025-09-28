/**
 * 红鸾天喜合盘分析流水线
 * 整合双人八字计算、提示词构建、大模型分析和TTS语音合成
 */

const { calculateBazi } = require('./bazi_calculator');
const { HebanClient } = require('./heban_client');
const { hebanPromptFunction } = require('./heban_prompt_functions');
const { synthesizeSpeech } = require('./tts_client');

/**
 * 完整的合盘分析流水线（仅AI分析，不含TTS）
 * @param {Object} params - 参数对象
 * @param {Object} params.person1 - 甲方生辰信息 {year, month, day, hour}
 * @param {Object} params.person2 - 乙方生辰信息 {year, month, day, hour}
 * @param {string} params.userQuestion - 用户问题
 * @param {Object} params.options - 可选参数
 * @returns {Object} 分析结果
 */
async function analyzeHebanWithAI(params) {
    const { person1, person2, userQuestion, options = {} } = params;
    
    try {
        // 1. 计算双人八字
        const person1Data = calculateBazi(person1.year, person1.month, person1.day, person1.hour);
        const person2Data = calculateBazi(person2.year, person2.month, person2.day, person2.hour);
        
        // 2. 构建合盘提示词
        const prompt = hebanPromptFunction(person1Data, person2Data, userQuestion);
        
        // 3. 调用红鸾天喜大模型分析
        const client = new HebanClient();
        const analysisResult = await client.analyzeHeban(prompt, options);
        
        if (!analysisResult.success) {
            return {
                success: false,
                error: analysisResult.error,
                person1Data: person1Data,
                person2Data: person2Data,
                prompt: prompt
            };
        }
        
        // 4. 返回完整结果
        return {
            success: true,
            person1Data: person1Data,
            person2Data: person2Data,
            analysis: analysisResult.text,
            prompt: prompt,
            usage: analysisResult.usage,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('analyzeHebanWithAI error:', error);
        return {
            success: false,
            error: '合盘分析流水线异常: ' + error.message
        };
    }
}

/**
 * 红鸾天喜合盘分析与可选TTS
 * @param {Object} params
 * @param {Object} params.person1 - 甲方生辰信息 {year, month, day, hour}
 * @param {Object} params.person2 - 乙方生辰信息 {year, month, day, hour}
 * @param {string} params.userQuestion - 用户问题
 * @param {boolean} [params.enableTts] - 是否开启 TTS
 * @param {Object} [params.ttsOptions] - TTS 选项
 * @param {Object} [params.options] - 大模型选项
 * @returns {Promise<{success:boolean, text?:string, audioBuffer?:Buffer, contentType?:string, error?:string, prompt?:string, person1Data?:Object, person2Data?:Object}>}
 */
async function analyzeHebanWithOptionalTts(params) {
    const {
        person1,
        person2,
        userQuestion,
        enableTts = false,
        ttsOptions = {},
        options = {}
    } = params || {};
    
    try {
        // 1. 计算双人八字
        const person1Data = calculateBazi(person1.year, person1.month, person1.day, person1.hour);
        const person2Data = calculateBazi(person2.year, person2.month, person2.day, person2.hour);
        
        // 2. 构建合盘提示词
        const prompt = hebanPromptFunction(person1Data, person2Data, userQuestion);
        
        // 3. 调用红鸾天喜大模型分析
        const client = new HebanClient();
        const analysisResult = await client.analyzeHeban(prompt, options);
        
        if (!analysisResult.success) {
            return {
                success: false,
                error: analysisResult.error,
                person1Data: person1Data,
                person2Data: person2Data,
                prompt: prompt
            };
        }
        
        const text = analysisResult.text;
        
        // 4. 如果不需要TTS，直接返回文本结果
        if (!enableTts) {
            return {
                success: true,
                person1Data: person1Data,
                person2Data: person2Data,
                analysis: text,
                prompt: prompt,
                usage: analysisResult.usage,
                timestamp: new Date().toISOString()
            };
        }
        
        // 5. 进行TTS合成，使用红鸾天喜专用音色
        const defaultTtsOptions = {
            voiceType: 'qiniu_zh_female_xyqxxj',  // 校园清新学姐（女声）
            voiceName: '校园清新学姐',
            category: '传统音色',
            format: 'mp3',
            speechRate: 1.2,  // 统一语速：适中节奏
            pitch: 2,         // 适中音调，体现校园清新感
            ...ttsOptions     // 允许覆盖默认设置
        };
        
        let ttsRes = await synthesizeSpeech({ text, ...defaultTtsOptions });
        
        // 如果女声音色失败，尝试使用男声作为备用
        if (!ttsRes.success && defaultTtsOptions.voiceType === 'qiniu_zh_female_xyqxxj') {
            console.warn('红鸾天喜女声音色失败，尝试使用男声备用:', ttsRes.error);
            const backupOptions = {
                ...defaultTtsOptions,
                voiceType: 'qiniu_zh_male_ybxknjs',  // 备用男声
                voiceName: '天乙贵人（备用）',
                category: '传统音色'
            };
            ttsRes = await synthesizeSpeech({ text, ...backupOptions });
        }
        
        if (!ttsRes.success) {
            // TTS失败时回退到文本模式，而不是完全失败
            console.warn('合盘TTS失败，回退到文本模式:', ttsRes.error);
            return {
                success: true,
                person1Data: person1Data,
                person2Data: person2Data,
                analysis: text,
                prompt: prompt,
                usage: analysisResult.usage,
                timestamp: new Date().toISOString(),
                ttsError: ttsRes.error  // 保留错误信息供前端显示
            };
        }
        
        // 6. 返回完整的音频结果
        return {
            success: true,
            person1Data: person1Data,
            person2Data: person2Data,
            analysis: text,
            audioBuffer: ttsRes.audioBuffer,
            contentType: ttsRes.contentType,
            prompt: prompt,
            usage: analysisResult.usage,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('analyzeHebanWithOptionalTts error:', error);
        return {
            success: false,
            error: '合盘TTS分析流水线异常: ' + error.message
        };
    }
}

/**
 * 测试合盘系统连接
 * @returns {Object} 测试结果
 */
async function testHebanSystem() {
    try {
        // 测试八字计算
        const testPerson1 = calculateBazi(1995, 5, 15, 10);
        const testPerson2 = calculateBazi(1996, 8, 20, 14);
        
        if (!testPerson1 || !testPerson2) {
            return {
                success: false,
                error: '八字计算测试失败'
            };
        }
        
        // 测试红鸾天喜大模型连接
        const client = new HebanClient();
        const connectionTest = await client.testConnection();
        if (!connectionTest.success) {
            return {
                success: false,
                error: '红鸾天喜大模型连接测试失败: ' + connectionTest.error
            };
        }
        
        return {
            success: true,
            message: '红鸾天喜合盘系统测试通过',
            baziCalculator: '正常',
            aiModel: '正常',
            modelInfo: client.getModelInfo()
        };
        
    } catch (error) {
        return {
            success: false,
            error: '合盘系统测试异常: ' + error.message
        };
    }
}

module.exports = {
    analyzeHebanWithAI,
    analyzeHebanWithOptionalTts,
    testHebanSystem
};
