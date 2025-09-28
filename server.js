/**
 * 轻量级 Web 服务（Express）
 * - POST /api/ask：根据生日与问题生成 AI 文本回复
 * - POST /api/tts_audio：将文本转换为音频二进制流（支持更多可选参数）
 * - POST /api/ask_tts：一体化问答并返回音频二进制流
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');

// 业务模块
const { calculateBazi } = require('./bazi_calculator');
const { customPromptFunction } = require('./prompt_functions');
const { analyzeWithOptionalTts, analyzeMarriageWithOptionalTts, analyzeFortuneWithOptionalTts } = require('./ai_pipeline');
const { analyzeLiuyaoWithOptionalTts } = require('./liuyao_pipeline');
const { analyzeHebanWithOptionalTts } = require('./heban_pipeline');
const { synthesizeSpeech } = require('./tts_client');
const { ASRClient } = require('./asr_client');

const app = express();

// 安全中间件 - 配置CSP以允许前端JavaScript正常工作
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本
            scriptSrcAttr: ["'unsafe-inline'"], // 允许内联事件处理器
            styleSrc: ["'self'", "'unsafe-inline'", "https:"], // 允许内联样式
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"], // 允许AJAX请求到同源
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:", "data:"], // 允许blob和data URL用于音频
            frameSrc: ["'self'"],
        },
    },
}));

// CORS配置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : true, // 生产环境需要配置具体域名
    credentials: true
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 解析JSON请求体
app.use(express.json({ limit: '1mb' }));

// 配置multer用于处理文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB限制
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 根路由 - 提供新的前端页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

/**
 * 八字计算路由
 * POST /api/calculate_bazi
 * body: { year, month, day, hour }
 * 返回：{ success, baziData }
 */
app.post('/api/calculate_bazi', (req, res) => {
    try {
        const { year, month, day, hour } = req.body || {};
        
        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number'
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);
        
        return res.json({ 
            success: true, 
            baziData: baziData 
        });
    } catch (error) {
        console.error('/api/calculate_bazi error:', error);
        return res.status(500).json({ success: false, error: '八字计算失败' });
    }
});

/**
 * 婚姻/感情 文本路由
 * POST /api/ask_marriage
 * body: { year, month, day, hour, question }
 * 返回：{ success, analysis, prompt }
 */
app.post('/api/ask_marriage', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body || {};
        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);

        // 检查API密钥是否配置
        if (process.env.QINIU_API_KEY === '你的七牛云API密钥' || !process.env.QINIU_API_KEY) {
            // 返回模拟分析结果
            const mockAnalysis = `# 天乙贵人婚姻分析

## 八字信息
- 公历生日：${baziData.solarDate.year}年${baziData.solarDate.month}月${baziData.solarDate.day}日${baziData.solarDate.hour}时
- 农历生日：${baziData.lunarDate.year}年${baziData.lunarDate.month}月${baziData.lunarDate.day}日
- 八字：${baziData.fullBazi}

## 婚姻感情分析
贫道观道友八字，${baziData.bazi.dayPillar}日主，${baziData.bazi.monthPillar}月令，整体格局${baziData.bazi.yearPillar}年柱，${baziData.bazi.hourPillar}时柱。

**关于您的问题："${question}"**

根据您的八字分析，贫道建议：

1. **感情运势**：您的八字显示感情方面${baziData.bazi.dayPillar}日主，适合寻找${baziData.bazi.monthPillar}相配的伴侣
2. **正缘时机**：建议在${baziData.solarDate.month}月后开始新的感情规划
3. **注意事项**：避免与${baziData.bazi.monthPillar}相冲的感情关系

**温馨提示**：此分析基于传统八字理论，仅供参考。如需更精准分析，请配置真实的API密钥。

---
*注：当前为演示模式，请配置七牛云API密钥以获得更精准的AI分析。*`;

            return res.json({
                success: true,
                analysis: mockAnalysis,
                prompt: '演示模式 - 请配置API密钥'
            });
        }

        const analysisResult = await analyzeMarriageWithOptionalTts({
            baziData,
            userQuestion: question,
            enableTts: false
        });

        if (!analysisResult.success) {
            return res.status(500).json({ success: false, error: analysisResult.error || '分析失败' });
        }

        return res.json({ success: true, analysis: analysisResult.text, prompt: analysisResult.prompt });
    } catch (error) {
        console.error('/api/ask_marriage error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 时运 文本路由
 * POST /api/ask_fortune
 * body: { year, month, day, hour, question }
 * 返回：{ success, analysis, prompt }
 */
app.post('/api/ask_fortune', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body || {};
        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);

        // 检查API密钥是否配置
        if (process.env.QINIU_API_KEY === '你的七牛云API密钥' || !process.env.QINIU_API_KEY) {
            // 返回模拟分析结果
            const mockAnalysis = `# 天乙贵人时运分析

## 八字信息
- 公历生日：${baziData.solarDate.year}年${baziData.solarDate.month}月${baziData.solarDate.day}日${baziData.solarDate.hour}时
- 农历生日：${baziData.lunarDate.year}年${baziData.lunarDate.month}月${baziData.lunarDate.day}日
- 八字：${baziData.fullBazi}

## 时运分析
贫道观道友八字，${baziData.bazi.dayPillar}日主，${baziData.bazi.monthPillar}月令，整体格局${baziData.bazi.yearPillar}年柱，${baziData.bazi.hourPillar}时柱。

**关于您的问题："${question}"**

根据您的八字分析，贫道建议：

1. **近期运势**：您的八字显示${baziData.bazi.dayPillar}日主，近期运势${baziData.bazi.monthPillar}月令影响较大
2. **转运时机**：建议在${baziData.solarDate.month}月后运势会有所改善
3. **注意事项**：避免与${baziData.bazi.monthPillar}相冲的时间段做重要决定

**温馨提示**：此分析基于传统八字理论，仅供参考。如需更精准分析，请配置真实的API密钥。

---
*注：当前为演示模式，请配置七牛云API密钥以获得更精准的AI分析。*`;

            return res.json({
                success: true,
                analysis: mockAnalysis,
                prompt: '演示模式 - 请配置API密钥'
            });
        }

        const analysisResult = await analyzeFortuneWithOptionalTts({
            baziData,
            userQuestion: question,
            enableTts: false
        });

        if (!analysisResult.success) {
            return res.status(500).json({ success: false, error: analysisResult.error || '分析失败' });
        }

        return res.json({ success: true, analysis: analysisResult.text, prompt: analysisResult.prompt });
    } catch (error) {
        console.error('/api/ask_fortune error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 问答路由
 * POST /api/ask
 * body: { year, month, day, hour, question }
 * 返回：{ success: boolean, analysis?: string, prompt?: string, error?: string }
 */
app.post('/api/ask', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body || {};

        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        // 1) 计算八字
        const baziData = calculateBazi(year, month, day, hour);

        // 检查API密钥是否配置
        if (process.env.QINIU_API_KEY === '你的七牛云API密钥' || !process.env.QINIU_API_KEY) {
            // 返回模拟分析结果
            const mockAnalysis = `# 天乙贵人事业分析

## 八字信息
- 公历生日：${baziData.solarDate.year}年${baziData.solarDate.month}月${baziData.solarDate.day}日${baziData.solarDate.hour}时
- 农历生日：${baziData.lunarDate.year}年${baziData.lunarDate.month}月${baziData.lunarDate.day}日
- 八字：${baziData.fullBazi}

## 事业分析
贫道观道友八字，${baziData.bazi.dayPillar}日主，${baziData.bazi.monthPillar}月令，整体格局${baziData.bazi.yearPillar}年柱，${baziData.bazi.hourPillar}时柱。

**关于您的问题："${question}"**

根据您的八字分析，贫道建议：

1. **职业选择**：您的八字显示适合从事与${baziData.bazi.dayPillar}相关的行业
2. **发展时机**：建议在${baziData.solarDate.month}月后开始新的职业规划
3. **注意事项**：避免与${baziData.bazi.monthPillar}相冲的行业

**温馨提示**：此分析基于传统八字理论，仅供参考。如需更精准分析，请配置真实的API密钥。

---
*注：当前为演示模式，请配置七牛云API密钥以获得更精准的AI分析。*`;

            return res.json({
                success: true,
                analysis: mockAnalysis,
                prompt: '演示模式 - 请配置API密钥'
            });
        }

        // 2) 组合提示词 + 调用大模型（通过流水线以便后续可开关 TTS）
        const analysisResult = await analyzeWithOptionalTts({
            baziData,
            questionType: 'career',
            userQuestion: question,
            customPromptFunc: customPromptFunction,
            enableTts: false
        });

        if (!analysisResult.success) {
            return res.status(500).json({ success: false, error: analysisResult.error || '分析失败' });
        }

        // analyzeWithOptionalTts 返回 { success, text, prompt }
        return res.json({
            success: true,
            analysis: analysisResult.text,
            prompt: analysisResult.prompt
        });
    } catch (error) {
        console.error('/api/ask error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 语音路由
 * POST /api/tts_audio
 * body: { text_to_synthesize, voiceType?, format? }
 * 返回：audio/* 二进制流
 */
app.post('/api/tts_audio', async (req, res) => {
    try {
        const { text_to_synthesize, voiceType, voiceName, model, format, sampleRate, speechRate, pitch } = req.body || {};

        if (typeof text_to_synthesize !== 'string' || !text_to_synthesize.trim()) {
            return res.status(400).json({ success: false, error: 'text_to_synthesize 不能为空' });
        }

        const ttsRes = await synthesizeSpeech({
            text: text_to_synthesize,
            voiceType,
            voiceName,
            model,
            format,
            sampleRate,
            speechRate,
            pitch
        });

        if (!ttsRes.success) {
            return res.status(502).json({ success: false, error: ttsRes.error || 'TTS 合成失败' });
        }

        res.setHeader('Content-Type', ttsRes.contentType || 'audio/mpeg');
        return res.send(ttsRes.audioBuffer);
    } catch (error) {
        console.error('/api/tts_audio error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 一体化问答 + 语音
 * POST /api/ask_tts
 * body: {
 *   year, month, day, hour, question,
 *   tts: { voiceType?, voiceName?, model?, format?, sampleRate?, speechRate?, pitch? }
 * }
 * 返回：audio/* 二进制流
 */
app.post('/api/ask_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body || {};

        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);

        const analysisResult = await analyzeWithOptionalTts({
            baziData,
            questionType: 'career',
            userQuestion: question,
            customPromptFunc: customPromptFunction,
            enableTts: true,
            ttsOptions: {
                voiceType: tts && tts.voiceType,
                voiceName: tts && tts.voiceName,
                model: (tts && tts.model) || 'tts',
                format: (tts && tts.format) || 'mp3',
                sampleRate: tts && tts.sampleRate,
                speechRate: tts && tts.speechRate,
                pitch: tts && tts.pitch
            }
        });

        if (!analysisResult.success) {
            return res.status(502).json({ success: false, error: analysisResult.error || '问答或合成失败' });
        }

        // 检查是否有TTS错误（回退到文本模式）
        if (analysisResult.ttsError) {
            // TTS失败，返回JSON格式的文本响应
            return res.json({
                success: true,
                analysis: analysisResult.text,
                prompt: analysisResult.prompt,
                ttsError: analysisResult.ttsError
            });
        }

        if (analysisResult.text) {
            try { res.setHeader('X-Text', encodeURIComponent(analysisResult.text)); } catch (_) {}
        }
        res.setHeader('Content-Type', analysisResult.contentType || 'audio/mpeg');
        return res.send(analysisResult.audioBuffer);
    } catch (error) {
        console.error('/api/ask_tts error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 婚姻/感情 一体化问答 + 语音
 * POST /api/ask_marriage_tts
 * body: {
 *   year, month, day, hour, question,
 *   tts: { voiceType?, voiceName?, model?, format?, sampleRate?, speechRate?, pitch? }
 * }
 * 返回：audio/* 二进制流
 */
app.post('/api/ask_marriage_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body || {};

        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);

        const analysisResult = await analyzeMarriageWithOptionalTts({
            baziData,
            userQuestion: question,
            enableTts: true,
            ttsOptions: {
                voiceType: tts && tts.voiceType,
                voiceName: tts && tts.voiceName,
                model: (tts && tts.model) || 'tts',
                format: (tts && tts.format) || 'mp3',
                sampleRate: tts && tts.sampleRate,
                speechRate: tts && tts.speechRate,
                pitch: tts && tts.pitch
            }
        });

        if (!analysisResult.success) {
            return res.status(502).json({ success: false, error: analysisResult.error || '问答或合成失败' });
        }

        if (analysisResult.text) {
            try { res.setHeader('X-Text', encodeURIComponent(analysisResult.text)); } catch (_) {}
        }
        res.setHeader('Content-Type', analysisResult.contentType || 'audio/mpeg');
        return res.send(analysisResult.audioBuffer);
    } catch (error) {
        console.error('/api/ask_marriage_tts error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 时运 一体化问答 + 语音（强调当天日期 2025-09-26）
 * POST /api/ask_fortune_tts
 * body: {
 *   year, month, day, hour, question,
 *   tts: { voiceType?, voiceName?, model?, format?, sampleRate?, speechRate?, pitch? }
 * }
 * 返回：audio/* 二进制流
 */
app.post('/api/ask_fortune_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body || {};

        if (
            typeof year !== 'number' ||
            typeof month !== 'number' ||
            typeof day !== 'number' ||
            typeof hour !== 'number' ||
            typeof question !== 'string' || !question.trim()
        ) {
            return res.status(400).json({ success: false, error: '参数不完整或格式错误' });
        }

        const baziData = calculateBazi(year, month, day, hour);

        const analysisResult = await analyzeFortuneWithOptionalTts({
            baziData,
            userQuestion: question,
            enableTts: true,
            ttsOptions: {
                voiceType: tts && tts.voiceType,
                voiceName: tts && tts.voiceName,
                model: (tts && tts.model) || 'tts',
                format: (tts && tts.format) || 'mp3',
                sampleRate: tts && tts.sampleRate,
                speechRate: tts && tts.speechRate,
                pitch: tts && tts.pitch
            }
        });

        if (!analysisResult.success) {
            return res.status(502).json({ success: false, error: analysisResult.error || '问答或合成失败' });
        }

        if (analysisResult.text) {
            try { res.setHeader('X-Text', encodeURIComponent(analysisResult.text)); } catch (_) {}
        }
        res.setHeader('Content-Type', analysisResult.contentType || 'audio/mpeg');
        return res.send(analysisResult.audioBuffer);
    } catch (error) {
        console.error('/api/ask_fortune_tts error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 六爻太极贵人 文本路由
 * POST /api/ask_liuyao
 * body: { question }
 * 返回：{ success, analysis, prompt, hexagramData }
 */
app.post('/api/ask_liuyao', async (req, res) => {
    try {
        const { question, hexagramData: userHexagramData } = req.body || {};
        
        if (typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: '问题不能为空' });
        }

        // 检查API密钥是否配置
        if (process.env.QINIU_API_KEY === '你的七牛云API密钥' || !process.env.QINIU_API_KEY) {
            // 返回模拟分析结果
            const mockAnalysis = `# 太极贵人六爻测算

## 摇卦信息
贫道为道友摇得一卦，现将卦象详述如下：

**关于您的问题："${question}"**

## 卦象分析
本卦为演示模式，贫道观此卦象，卦辞曰："时来运转，否极泰来"。

### 详细爻辞与生克推演
- **初爻**：足下根基稳固，宜守不宜攻
- **二爻**：人际关系和谐，贵人相助
- **三爻**：事业转折点，需谨慎决策
- **四爻**：财运渐旺，投资有利
- **五爻**：地位提升，名声远扬
- **上爻**：功成身退，知足常乐

### 贫道的预测与方向指引
根据卦象显示，此事**可成**，但需**待时而动**。

### 行动建议与注意事项
1. **近期宜静不宜动**，观察时机
2. **多行善事**，积累福德
3. **保持耐心**，机缘自来

### 太极贵人结语
道友莫急，天机自有定数。按此卦象行事，必有所成。愿道友福慧双修，前程似锦！

---
*注：当前为演示模式，请配置七牛云API密钥以获得更精准的AI分析。*`;

            return res.json({
                success: true,
                analysis: mockAnalysis,
                prompt: '演示模式 - 请配置API密钥',
                hexagramData: userHexagramData || null
            });
        }

        // 使用用户摇卦结果或生成新的卦象
        let hexagramData;
        if (userHexagramData) {
            hexagramData = userHexagramData;
            console.log('六爻API使用用户摇卦结果:', hexagramData.mainHexagram?.name);
        } else {
            // 兼容旧的调用方式，自动生成卦象
            const { LiuyaoGenerator } = require('./liuyao_generator');
            const generator = new LiuyaoGenerator();
            hexagramData = generator.generateHexagram();
            console.log('六爻API自动生成卦象:', hexagramData.mainHexagram?.name);
        }
        
        const analysisResult = await analyzeLiuyaoWithOptionalTts({
            userQuestion: question,
            hexagramData: hexagramData, // 传递卦象数据给AI分析
            enableTts: false
        });

        if (!analysisResult.success) {
            return res.status(500).json({ success: false, error: analysisResult.error || '六爻分析失败' });
        }

        return res.json({ 
            success: true, 
            analysis: analysisResult.analysis, 
            prompt: analysisResult.prompt,
            hexagramData: analysisResult.hexagramData
        });
    } catch (error) {
        console.error('/api/ask_liuyao error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 六爻太极贵人 一体化问答 + 语音
 * POST /api/ask_liuyao_tts
 * body: {
 *   question,
 *   tts: { voiceType?, voiceName?, model?, format?, sampleRate?, speechRate?, pitch? }
 * }
 * 返回：audio/* 二进制流
 */
app.post('/api/ask_liuyao_tts', async (req, res) => {
    try {
        const { question, hexagramData: userHexagramData, tts } = req.body || {};

        if (typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: '问题不能为空' });
        }

        // 使用用户摇卦结果或生成新的卦象
        let hexagramData;
        if (userHexagramData) {
            hexagramData = userHexagramData;
            console.log('六爻TTS API使用用户摇卦结果:', hexagramData.mainHexagram?.name);
        } else {
            // 兼容旧的调用方式，自动生成卦象
            const { LiuyaoGenerator } = require('./liuyao_generator');
            const generator = new LiuyaoGenerator();
            hexagramData = generator.generateHexagram();
            console.log('六爻TTS API自动生成卦象:', hexagramData.mainHexagram?.name);
        }
        
        const analysisResult = await analyzeLiuyaoWithOptionalTts({
            userQuestion: question,
            hexagramData: hexagramData, // 传递卦象数据给AI分析
            enableTts: true,
            ttsOptions: {
                voiceType: tts && tts.voiceType,
                voiceName: tts && tts.voiceName,
                model: (tts && tts.model) || 'tts',
                format: (tts && tts.format) || 'mp3',
                sampleRate: tts && tts.sampleRate,
                speechRate: tts && tts.speechRate,
                pitch: tts && tts.pitch
            }
        });

        if (!analysisResult.success) {
            return res.status(502).json({ success: false, error: analysisResult.error || '六爻问答或合成失败' });
        }

        // 检查是否有TTS错误（回退到文本模式）
        if (analysisResult.ttsError) {
            // TTS失败，返回JSON格式的文本响应
            return res.json({
                success: true,
                analysis: analysisResult.analysis,
                prompt: analysisResult.prompt,
                hexagramData: analysisResult.hexagramData,
                ttsError: analysisResult.ttsError
            });
        }

        if (analysisResult.analysis) {
            try { res.setHeader('X-Text', encodeURIComponent(analysisResult.analysis)); } catch (_) {}
        }
        res.setHeader('Content-Type', analysisResult.contentType || 'audio/mpeg');
        return res.send(analysisResult.audioBuffer);
    } catch (error) {
        console.error('/api/ask_liuyao_tts error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 红鸾天喜合盘 文本路由
 * POST /api/ask_heban
 * body: { person1: {year, month, day, hour}, person2: {year, month, day, hour}, question }
 * 返回：{ success, analysis, prompt, person1Data, person2Data }
 */
app.post('/api/ask_heban', async (req, res) => {
    try {
        const { person1, person2, question } = req.body || {};
        
        // 验证输入参数
        if (!person1 || !person2 || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: '请输入完整的双人生辰信息和问题' });
        }

        // 验证甲方生辰信息
        if (
            typeof person1.year !== 'number' ||
            typeof person1.month !== 'number' ||
            typeof person1.day !== 'number' ||
            typeof person1.hour !== 'number'
        ) {
            return res.status(400).json({ success: false, error: '甲方生辰信息格式错误' });
        }

        // 验证乙方生辰信息
        if (
            typeof person2.year !== 'number' ||
            typeof person2.month !== 'number' ||
            typeof person2.day !== 'number' ||
            typeof person2.hour !== 'number'
        ) {
            return res.status(400).json({ success: false, error: '乙方生辰信息格式错误' });
        }

        // 检查API密钥是否配置
        if (process.env.QINIU_API_KEY === '你的七牛云API密钥' || !process.env.QINIU_API_KEY) {
            // 返回模拟分析结果
            const mockAnalysis = `# 红鸾天喜合盘测算

## 双人八字概述
本宫为有缘人观测双人八字，现将合盘结果详述如下：

**关于您的问题："${question}"**

### 甲方八字概况
- 生辰：${person1.year}年${person1.month}月${person1.day}日${person1.hour}时
- 五行属性：演示模式，请配置API密钥获取详细分析

### 乙方八字概况  
- 生辰：${person2.year}年${person2.month}月${person2.day}日${person2.hour}时
- 五行属性：演示模式，请配置API密钥获取详细分析

## 红鸾天喜合盘综述
根据双人八字观测，本宫判断此二人：

### 配对指数：★★★★☆ (演示)
- **五行相配**：较为和谐，相生大于相克
- **性格互补**：一动一静，刚柔并济  
- **感情走向**：有情人终成眷属的良好基础

### 相处之道与感情指引
1. **相处建议**：多沟通理解，包容对方差异
2. **注意事项**：避免在特定时期发生争执
3. **感情增进**：建议多参与户外活动增进感情

### 红鸾天喜结语
有缘人啊，情深不负，缘浅不强求。按此合盘所示，二人若用心经营，定能白头偕老，琴瑟和鸣。

---
*注：当前为演示模式，请配置七牛云API密钥以获得更精准的合盘分析。*`;

            return res.json({
                success: true,
                analysis: mockAnalysis,
                prompt: '演示模式 - 请配置API密钥',
                person1Data: null,
                person2Data: null
            });
        }

        const analysisResult = await analyzeHebanWithOptionalTts({
            person1,
            person2,
            userQuestion: question,
            enableTts: false
        });

        if (!analysisResult.success) {
            return res.status(500).json({ success: false, error: analysisResult.error || '合盘分析失败' });
        }

        return res.json({ 
            success: true, 
            analysis: analysisResult.analysis, 
            prompt: analysisResult.prompt,
            person1Data: analysisResult.person1Data,
            person2Data: analysisResult.person2Data
        });
    } catch (error) {
        console.error('/api/ask_heban error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 红鸾天喜合盘 一体化问答 + 语音
 * POST /api/ask_heban_tts
 * body: {
 *   person1: {year, month, day, hour}, 
 *   person2: {year, month, day, hour}, 
 *   question,
 *   tts: { voiceType?, voiceName?, model?, format?, sampleRate?, speechRate?, pitch? }
 * }
 * 返回：audio/* 二进制流
 */
app.post('/api/ask_heban_tts', async (req, res) => {
    try {
        const { person1, person2, question, tts } = req.body || {};

        // 验证输入参数
        if (!person1 || !person2 || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: '请输入完整的双人生辰信息和问题' });
        }

        // 验证甲方生辰信息
        if (
            typeof person1.year !== 'number' ||
            typeof person1.month !== 'number' ||
            typeof person1.day !== 'number' ||
            typeof person1.hour !== 'number'
        ) {
            return res.status(400).json({ success: false, error: '甲方生辰信息格式错误' });
        }

        // 验证乙方生辰信息
        if (
            typeof person2.year !== 'number' ||
            typeof person2.month !== 'number' ||
            typeof person2.day !== 'number' ||
            typeof person2.hour !== 'number'
        ) {
            return res.status(400).json({ success: false, error: '乙方生辰信息格式错误' });
        }

        const analysisResult = await analyzeHebanWithOptionalTts({
            person1,
            person2,
            userQuestion: question,
            enableTts: true,
            ttsOptions: {
                voiceType: tts && tts.voiceType,
                voiceName: tts && tts.voiceName,
                model: (tts && tts.model) || 'tts',
                format: (tts && tts.format) || 'mp3',
                sampleRate: tts && tts.sampleRate,
                speechRate: tts && tts.speechRate,
                pitch: tts && tts.pitch
            }
        });

        if (!analysisResult.success) {
            return res.status(502).json({ success: false, error: analysisResult.error || '合盘问答或合成失败' });
        }

        // 检查是否有TTS错误（回退到文本模式）
        if (analysisResult.ttsError) {
            // TTS失败，返回JSON格式的文本响应
            return res.json({
                success: true,
                analysis: analysisResult.analysis,
                prompt: analysisResult.prompt,
                person1Data: analysisResult.person1Data,
                person2Data: analysisResult.person2Data,
                ttsError: analysisResult.ttsError
            });
        }

        if (analysisResult.analysis) {
            try { res.setHeader('X-Text', encodeURIComponent(analysisResult.analysis)); } catch (_) {}
        }
        res.setHeader('Content-Type', analysisResult.contentType || 'audio/mpeg');
        return res.send(analysisResult.audioBuffer);
    } catch (error) {
        console.error('/api/ask_heban_tts error:', error);
        return res.status(500).json({ success: false, error: '服务端异常' });
    }
});

/**
 * 六爻卦象生成API
 * POST /api/generate_hexagram
 * body: { throwResults: Array }
 * 返回：{ success: boolean, hexagram?: Object, error?: string }
 */
app.post('/api/generate_hexagram', (req, res) => {
    try {
        const { throwResults } = req.body || {};
        
        if (!throwResults || !Array.isArray(throwResults) || throwResults.length !== 6) {
            return res.status(400).json({ 
                success: false, 
                error: '摇卦结果数据不完整，需要6次投掷结果' 
            });
        }
        
        // 使用 LiuyaoGenerator 生成卦象
        const { LiuyaoGenerator } = require('./liuyao_generator');
        const generator = new LiuyaoGenerator();
        
        // 创建一个模拟的卦象数据，使用前端传来的摇卦结果
        const hexagramData = {
            lines: throwResults,
            changingLines: throwResults
                .map((line, index) => line.isChanging ? index + 1 : null)
                .filter(pos => pos !== null),
            
            // 构建主卦和变卦的二进制表示
            mainHexagram: {
                binary: throwResults.map(line => line.value).join(''),
                name: '待解析',
                symbol: throwResults.slice().reverse().map(line => line.symbol).join('\n')
            },
            
            timestamp: new Date().toISOString(),
            
            summary: {
                totalChangingLines: throwResults.filter(line => line.isChanging).length,
                hasChanges: throwResults.some(line => line.isChanging)
            }
        };
        
        // 使用 LiuyaoGenerator 的完整逻辑来处理卦象
        const completeHexagram = generator.generateHexagram();
        
        // 合并前端摇卦结果和后端生成的完整卦象数据
        const finalHexagram = {
            ...completeHexagram,
            // 保留前端的摇卦结果，但使用后端的卦象解析
            lines: throwResults,
            userThrowResults: throwResults,
            generatedByBackend: true
        };
        
        return res.json({
            success: true,
            hexagram: finalHexagram
        });
        
    } catch (error) {
        console.error('/api/generate_hexagram error:', error);
        return res.status(500).json({ 
            success: false, 
            error: '卦象生成服务异常' 
        });
    }
});

// ASR功能现在使用浏览器原生Web Speech API，不需要后端处理

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});


