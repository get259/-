/**
 * 七牛云大模型调用客户端
 * 支持自定义提示词函数
 */

const axios = require('axios');

// 七牛云API配置
const QINIU_CONFIG = {
    baseURL: 'https://openai.qiniu.com/v1',
    model: 'qwen-turbo',
    apiKey: 'sk-5a08fe9740e3d984e5c6b360058071aa0e3be0132c48d9f074e96514cfd4550a'
};

/**
 * 调用七牛云大模型
 * @param {string} prompt 提示词
 * @param {Object} options 可选参数
 * @returns {Promise<Object>} 模型响应
 */
async function callQwenModel(prompt, options = {}) {
    try {
        const response = await axios.post(
            `${QINIU_CONFIG.baseURL}/chat/completions`,
            {
                model: QINIU_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2000,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${QINIU_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: options.timeout || 30000
            }
        );

        return {
            success: true,
            data: response.data,
            content: response.data.choices[0].message.content
        };
    } catch (error) {
        console.error('调用七牛云大模型失败:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}


/**
 * 主函数：八字分析
 * @param {Object} baziData 八字数据
 * @param {string} questionType 问题类型
 * @param {string} userQuestion 用户问题
 * @param {Function} customPromptFunc 自定义提示词函数
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeBazi(baziData, questionType, userQuestion, customPromptFunc) {
    try {
        // 使用自定义提示词函数
        const prompt = customPromptFunc(baziData, questionType, userQuestion);
        
        console.log('正在调用大模型进行分析...');
        const result = await callQwenModel(prompt);
        
        if (result.success) {
            return {
                success: true,
                baziData: baziData,
                questionType: questionType,
                userQuestion: userQuestion,
                analysis: result.content,
                prompt: prompt // 返回使用的提示词，方便调试
            };
        } else {
            return {
                success: false,
                error: result.error,
                baziData: baziData
            };
        }
    } catch (error) {
        console.error('八字分析失败:', error.message);
        return {
            success: false,
            error: error.message,
            baziData: baziData
        };
    }
}


// 导出函数
module.exports = {
    callQwenModel,
    analyzeBazi,
    QINIU_CONFIG
};
