/**
 * 六爻太极贵人分析流水线
 * 整合六爻生成、提示词构建、大模型分析和TTS语音合成
 */

const { LiuyaoGenerator } = require('./liuyao_generator');
const { LiuyaoClient } = require('./liuyao_client');
const { liuyaoPromptFunction } = require('./liuyao_prompt_functions');
const { synthesizeSpeech } = require('./tts_client');

/**
 * 完整的六爻分析流水线（仅AI分析，不含TTS）
 * @param {Object} params - 参数对象
 * @param {string} params.userQuestion - 用户问题
 * @param {Object} params.options - 可选参数
 * @returns {Object} 分析结果
 */
async function analyzeLiuyaoWithAI(params) {
    const { userQuestion, options = {} } = params;
    
    try {
        // 1. 生成六爻卦象
        const generator = new LiuyaoGenerator();
        const hexagramData = generator.generateHexagram();
        
        // 2. 构建提示词
        const prompt = liuyaoPromptFunction(hexagramData, userQuestion);
        
        // 3. 调用大模型分析
        const client = new LiuyaoClient();
        const analysisResult = await client.analyzeHexagram(prompt, options);
        
        if (!analysisResult.success) {
            return {
                success: false,
                error: analysisResult.error,
                hexagramData: hexagramData,
                prompt: prompt
            };
        }
        
        // 4. 返回完整结果
        return {
            success: true,
            hexagramData: hexagramData,
            analysis: analysisResult.text,
            prompt: prompt,
            usage: analysisResult.usage,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('analyzeLiuyaoWithAI error:', error);
        return {
            success: false,
            error: '六爻分析流水线异常: ' + error.message
        };
    }
}

/**
 * 六爻太极贵人分析与可选TTS
 * @param {Object} params
 * @param {string} params.userQuestion 用户问题
 * @param {Object} [params.hexagramData] 用户摇卦的卦象数据（如果提供则使用，否则自动生成）
 * @param {boolean} [params.enableTts] 是否开启 TTS
 * @param {Object} [params.ttsOptions] TTS 选项
 * @param {Object} [params.options] 大模型选项
 * @returns {Promise<{success:boolean, text?:string, audioBuffer?:Buffer, contentType?:string, error?:string, prompt?:string, hexagramData?:Object}>}
 */
async function analyzeLiuyaoWithOptionalTts(params) {
    const {
        userQuestion,
        hexagramData: userHexagramData,
        enableTts = false,
        ttsOptions = {},
        options = {}
    } = params || {};
    
    try {
        // 1. 使用用户摇卦结果或生成新的六爻卦象
        let hexagramData;
        if (userHexagramData) {
            // 使用用户摇卦的结果
            hexagramData = userHexagramData;
            console.log('使用用户摇卦结果:', hexagramData);
        } else {
            // 自动生成卦象（兼容旧的调用方式）
            const generator = new LiuyaoGenerator();
            hexagramData = generator.generateHexagram();
            console.log('自动生成卦象:', hexagramData);
        }
        
        // 2. 构建提示词
        const prompt = liuyaoPromptFunction(hexagramData, userQuestion);
        
        // 3. 调用大模型分析
        const client = new LiuyaoClient();
        const analysisResult = await client.analyzeHexagram(prompt, options);
        
        if (!analysisResult.success) {
            return {
                success: false,
                error: analysisResult.error,
                hexagramData: hexagramData,
                prompt: prompt
            };
        }
        
        const text = analysisResult.text;
        
        // 4. 如果不需要TTS，直接返回文本结果
        if (!enableTts) {
            return {
                success: true,
                hexagramData: hexagramData,
                analysis: text,
                prompt: prompt,
                usage: analysisResult.usage,
                timestamp: new Date().toISOString()
            };
        }
        
        // 5. 进行TTS合成，使用太极贵人专用音色
        const defaultTtsOptions = {
            voiceType: 'qiniu_zh_male_szxyxd',  // 率真校园向导
            voiceName: '率真校园向导',
            format: 'mp3',
            speechRate: 1.2,  // 统一语速：适中节奏
            pitch: 2,         // 适当提高音高，增加语调变化
            ...ttsOptions     // 允许覆盖默认设置
        };
        
        const ttsRes = await synthesizeSpeech({ text, ...defaultTtsOptions });
        
        if (!ttsRes.success) {
            // TTS失败时回退到文本模式，而不是完全失败
            console.warn('六爻TTS失败，回退到文本模式:', ttsRes.error);
            return {
                success: true,
                hexagramData: hexagramData,
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
            hexagramData: hexagramData,
            analysis: text,
            audioBuffer: ttsRes.audioBuffer,
            contentType: ttsRes.contentType,
            prompt: prompt,
            usage: analysisResult.usage,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('analyzeLiuyaoWithOptionalTts error:', error);
        return {
            success: false,
            error: '六爻TTS分析流水线异常: ' + error.message
        };
    }
}

/**
 * 仅生成六爻卦象（不调用AI）
 * @param {string} userQuestion - 用户问题
 * @returns {Object} 卦象结果
 */
function generateLiuyaoOnly(userQuestion) {
    try {
        const generator = new LiuyaoGenerator();
        const hexagramData = generator.generateHexagram();
        const formattedHexagram = generator.formatHexagram(hexagramData);
        
        return {
            success: true,
            hexagramData: hexagramData,
            formattedText: formattedHexagram,
            userQuestion: userQuestion,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('generateLiuyaoOnly error:', error);
        return {
            success: false,
            error: '六爻生成失败: ' + error.message
        };
    }
}

/**
 * 测试六爻系统连接
 * @returns {Object} 测试结果
 */
async function testLiuyaoSystem() {
    try {
        // 测试卦象生成
        const hexagramTest = generateLiuyaoOnly('测试问题');
        if (!hexagramTest.success) {
            return {
                success: false,
                error: '六爻生成器测试失败: ' + hexagramTest.error
            };
        }
        
        // 测试大模型连接
        const client = new LiuyaoClient();
        const connectionTest = await client.testConnection();
        if (!connectionTest.success) {
            return {
                success: false,
                error: '大模型连接测试失败: ' + connectionTest.error
            };
        }
        
        return {
            success: true,
            message: '六爻太极贵人系统测试通过',
            hexagramGenerator: '正常',
            aiModel: '正常',
            modelInfo: client.getModelInfo()
        };
        
    } catch (error) {
        return {
            success: false,
            error: '系统测试异常: ' + error.message
        };
    }
}

module.exports = {
    analyzeLiuyaoWithAI,
    analyzeLiuyaoWithOptionalTts,
    generateLiuyaoOnly,
    testLiuyaoSystem
};
