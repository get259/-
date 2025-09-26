/**
 * 轻量级 Web 服务（Express）
 * - POST /api/ask：根据生日与问题生成 AI 文本回复
 * - POST /api/tts_audio：将文本转换为音频二进制流（支持更多可选参数）
 * - POST /api/ask_tts：一体化问答并返回音频二进制流
 */

const express = require('express');

// 业务模块
const { calculateBazi } = require('./bazi_calculator');
const { customPromptFunction } = require('./prompt_functions');
const { analyzeWithOptionalTts, analyzeMarriageWithOptionalTts, analyzeFortuneWithOptionalTts } = require('./ai_pipeline');
const { synthesizeSpeech } = require('./tts_client');

const app = express();
app.use(express.json({ limit: '1mb' }));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});


