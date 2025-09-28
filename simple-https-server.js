const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 导入现有的server.js中的所有路由和中间件
const app = express();

// 中间件配置
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// CORS配置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 安全中间件
const helmet = require('helmet');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "https://openai.qiniu.com"],
            mediaSrc: ["'self'", "blob:"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// 导入所有现有的路由
const baziCalculator = require('./bazi_calculator');
const aiPipeline = require('./ai_pipeline');
const liuyaoPipeline = require('./liuyao_pipeline');
const hebanPipeline = require('./heban_pipeline');
const ttsClient = require('./tts_client');
const { LiuyaoGenerator } = require('./liuyao_generator');

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        https: true
    });
});

// 八字计算API
app.post('/api/calculate_bazi', async (req, res) => {
    try {
        const { year, month, day, hour } = req.body;
        const result = baziCalculator.calculateBazi(year, month, day, hour);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('八字计算错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 问道API (天乙贵人)
app.post('/api/ask', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body;
        const result = await aiPipeline.analyzeWithOptionalTts(year, month, day, hour, question, false);
        res.json(result);
    } catch (error) {
        console.error('问道分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ask_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body;
        const result = await aiPipeline.analyzeWithOptionalTts(year, month, day, hour, question, true, tts);
        
        if (result.success && result.audioBuffer) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length,
                'X-Text': result.text || ''
            });
            res.send(result.audioBuffer);
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('问道TTS分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 姻缘分析API
app.post('/api/ask_marriage', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body;
        const result = await aiPipeline.analyzeMarriageWithOptionalTts(year, month, day, hour, question, false);
        res.json(result);
    } catch (error) {
        console.error('姻缘分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ask_marriage_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body;
        const result = await aiPipeline.analyzeMarriageWithOptionalTts(year, month, day, hour, question, true, tts);
        
        if (result.success && result.audioBuffer) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length,
                'X-Text': result.text || ''
            });
            res.send(result.audioBuffer);
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('姻缘TTS分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 时运分析API
app.post('/api/ask_fortune', async (req, res) => {
    try {
        const { year, month, day, hour, question } = req.body;
        const result = await aiPipeline.analyzeFortuneWithOptionalTts(year, month, day, hour, question, false);
        res.json(result);
    } catch (error) {
        console.error('时运分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ask_fortune_tts', async (req, res) => {
    try {
        const { year, month, day, hour, question, tts } = req.body;
        const result = await aiPipeline.analyzeFortuneWithOptionalTts(year, month, day, hour, question, true, tts);
        
        if (result.success && result.audioBuffer) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length,
                'X-Text': result.text || ''
            });
            res.send(result.audioBuffer);
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('时运TTS分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 六爻占卜API (太极贵人)
app.post('/api/ask_liuyao', async (req, res) => {
    try {
        const { question, hexagramData } = req.body;
        const result = await liuyaoPipeline.analyzeLiuyaoWithOptionalTts(question, false, hexagramData);
        res.json(result);
    } catch (error) {
        console.error('六爻分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ask_liuyao_tts', async (req, res) => {
    try {
        const { question, hexagramData, tts } = req.body;
        const result = await liuyaoPipeline.analyzeLiuyaoWithOptionalTts(question, true, hexagramData, tts);
        
        if (result.success && result.audioBuffer) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length,
                'X-Text': result.text || ''
            });
            res.send(result.audioBuffer);
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('六爻TTS分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 六爻卦象生成API
app.post('/api/generate_hexagram', async (req, res) => {
    try {
        const { throwResults } = req.body;
        
        if (throwResults && Array.isArray(throwResults) && throwResults.length === 6) {
            // 使用前端传来的投掷结果生成卦象
            const generator = new LiuyaoGenerator();
            const hexagramData = generator.generateHexagramFromThrows(throwResults);
            res.json({ success: true, data: hexagramData });
        } else {
            // 如果没有投掷结果，随机生成
            const generator = new LiuyaoGenerator();
            const hexagramData = generator.generateHexagram();
            res.json({ success: true, data: hexagramData });
        }
    } catch (error) {
        console.error('六爻卦象生成错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 合盘分析API (红鸾天喜)
app.post('/api/ask_heban', async (req, res) => {
    try {
        const { person1, person2, question } = req.body;
        const result = await hebanPipeline.analyzeHebanWithOptionalTts(person1, person2, question, false);
        res.json(result);
    } catch (error) {
        console.error('合盘分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ask_heban_tts', async (req, res) => {
    try {
        const { person1, person2, question, tts } = req.body;
        const result = await hebanPipeline.analyzeHebanWithOptionalTts(person1, person2, question, true, tts);
        
        if (result.success && result.audioBuffer) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length,
                'X-Text': result.text || ''
            });
            res.send(result.audioBuffer);
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('合盘TTS分析错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 纯TTS API
app.post('/api/tts_audio', async (req, res) => {
    try {
        const { text, voiceType = 'qiniu_zh_male_ybxknjs', format = 'mp3', speechRate = 1.0, pitch = 1 } = req.body;
        
        if (!text) {
            return res.status(400).json({ success: false, error: '缺少文本内容' });
        }

        const audioBuffer = await ttsClient.synthesize(text, voiceType, format, speechRate, pitch);
        
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);
    } catch (error) {
        console.error('TTS合成错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建自签名证书
function createSelfSignedCert() {
    const crypto = require('crypto');
    const forge = require('node-forge');
    
    try {
        // 生成私钥
        const keyPair = forge.pki.rsa.generateKeyPair(2048);
        const privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);
        
        // 创建证书
        const cert = forge.pki.createCertificate();
        cert.publicKey = keyPair.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        
        const attrs = [{
            name: 'commonName',
            value: 'localhost'
        }, {
            name: 'countryName',
            value: 'CN'
        }, {
            shortName: 'ST',
            value: 'Beijing'
        }, {
            name: 'localityName',
            value: 'Beijing'
        }, {
            name: 'organizationName',
            value: '道求职'
        }, {
            shortName: 'OU',
            value: 'IT'
        }];
        
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keyPair.privateKey);
        
        const certPem = forge.pki.certificateToPem(cert);
        
        // 保存证书和私钥
        fs.writeFileSync('server.key', privateKey);
        fs.writeFileSync('server.crt', certPem);
        
        console.log('✅ SSL证书生成成功');
        return true;
    } catch (error) {
        console.error('❌ SSL证书生成失败:', error.message);
        return false;
    }
}

// 启动HTTPS服务器
function startHttpsServer() {
    try {
        // 检查证书是否存在
        if (!fs.existsSync('server.key') || !fs.existsSync('server.crt')) {
            console.log('🔐 正在生成SSL证书...');
            if (!createSelfSignedCert()) {
                console.log('💡 使用HTTP模式启动（语音识别功能受限）');
                const http = require('http');
                const httpServer = http.createServer(app);
                const port = process.env.PORT || 3000;
                httpServer.listen(port, () => {
                    console.log('🚀 HTTP服务器启动成功!');
                    console.log(`📱 访问地址: http://localhost:${port}`);
                    console.log('⚠️  语音识别功能需要HTTPS环境，建议使用Chrome的--unsafely-treat-insecure-origin-as-secure参数');
                });
                return;
            }
        }
        
        const options = {
            key: fs.readFileSync('server.key'),
            cert: fs.readFileSync('server.crt')
        };
        
        const httpsServer = https.createServer(options, app);
        const port = process.env.PORT || 3443;
        
        httpsServer.listen(port, () => {
            console.log('🚀 HTTPS服务器启动成功!');
            console.log(`📱 访问地址: https://localhost:${port}`);
            console.log('🔐 使用HTTPS协议，语音识别功能已启用');
            console.log('⚠️  首次访问时浏览器会提示证书不安全，请点击"高级"->"继续访问"');
            console.log('🎤 现在可以正常使用语音输入功能了！');
        });
        
    } catch (error) {
        console.error('❌ HTTPS服务器启动失败:', error.message);
        console.log('💡 回退到HTTP模式');
        const http = require('http');
        const httpServer = http.createServer(app);
        const port = process.env.PORT || 3000;
        httpServer.listen(port, () => {
            console.log('🚀 HTTP服务器启动成功!');
            console.log(`📱 访问地址: http://localhost:${port}`);
            console.log('⚠️  语音识别功能需要HTTPS环境');
        });
    }
}

// 启动服务器
startHttpsServer();
