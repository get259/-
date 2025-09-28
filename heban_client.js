/**
 * 红鸾天喜合盘大模型调用客户端
 * 使用七牛云 Qwen-turbo 模型进行双人八字合盘分析
 */

const axios = require('axios');

class HebanClient {
    constructor() {
        this.apiKey = process.env.QINIU_API_KEY;
        this.baseURL = process.env.QINIU_BASE_URL || 'https://openai.qiniu.com/v1';
        this.model = process.env.QINIU_MODEL || 'qwen-turbo';
        this.timeout = 30000; // 30秒超时
    }

    /**
     * 调用大模型进行合盘分析
     * @param {string} prompt - 完整的提示词
     * @param {Object} options - 可选参数
     * @returns {Object} { success: boolean, text?: string, error?: string }
     */
    async analyzeHeban(prompt, options = {}) {
        try {
            const requestData = {
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens || 2500,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.9,
                stream: false
            };

            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const content = response.data.choices[0].message.content;
                return {
                    success: true,
                    text: content.trim(),
                    usage: response.data.usage
                };
            } else {
                return {
                    success: false,
                    error: '红鸾天喜返回数据格式异常'
                };
            }

        } catch (error) {
            console.error('HebanClient analyzeHeban error:', error.message);
            
            if (error.response) {
                // API返回错误
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 401) {
                    return { success: false, error: 'API密钥无效' };
                } else if (status === 429) {
                    return { success: false, error: '请求频率过高，请稍后再试' };
                } else if (status === 500) {
                    return { success: false, error: '服务器内部错误' };
                } else {
                    return { 
                        success: false, 
                        error: errorData?.error?.message || `API错误: ${status}` 
                    };
                }
            } else if (error.code === 'ECONNABORTED') {
                return { success: false, error: '请求超时，请稍后再试' };
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return { success: false, error: '网络连接失败' };
            } else {
                return { success: false, error: '网络请求异常' };
            }
        }
    }

    /**
     * 测试API连接
     * @returns {Object} { success: boolean, message?: string, error?: string }
     */
    async testConnection() {
        try {
            const testPrompt = '请简单回答：你好，红鸾天喜。';
            const result = await this.analyzeHeban(testPrompt, { maxTokens: 50 });
            
            if (result.success) {
                return {
                    success: true,
                    message: 'API连接正常',
                    response: result.text
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `连接测试失败: ${error.message}`
            };
        }
    }

    /**
     * 获取模型信息
     * @returns {Object} 模型配置信息
     */
    getModelInfo() {
        return {
            model: this.model,
            baseURL: this.baseURL,
            timeout: this.timeout,
            maxTokens: 2500,
            description: '红鸾天喜合盘专用模型'
        };
    }
}

module.exports = {
    HebanClient
};
