/**
 * 七牛云大模型调用客户端
 * 支持自定义提示词函数
 */

const axios = require('axios');
// 尝试加载环境变量：优先使用 dotenv；若未安装，则手动解析 .env
(() => {
    try {
        // 可选依赖，不做强制安装
        require('dotenv').config();
    } catch (_) {
        // 简单解析项目根目录下的 .env（KEY=VALUE，每行一对，忽略 # 注释）
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

// 七牛云API配置（从环境变量读取，提供合理默认值；API Key 不提供默认）
const QINIU_CONFIG = {
    baseURL: process.env.QINIU_BASE_URL || 'https://openai.qiniu.com/v1',
    model: process.env.QINIU_MODEL || 'qwen-turbo',
    apiKey: process.env.QINIU_API_KEY || ''
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
