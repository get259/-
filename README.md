# 道求职 - 智能八字占卜平台
####视频是 https://www.bilibili.com/video/BV1s9nizyE3A/?share_source=copy_web&vd_source=4e09b72d2554c72cf539b8687d26f561#####
一个面向应届求职生的智能命理分析应用，结合传统命理学和现代AI技术，提供事业、姻缘、时运、六爻占卜、合盘分析等全方位指导。

## 🌟 功能特色

### 🎯 三大核心功能

1. **问道 (天乙贵人)** - 八字分析
   - 🏢 事业分析：求职指导、职业发展建议
   - 💕 姻缘分析：感情咨询、婚姻指导
   - ⏰ 时运分析：当下运势、短期预测

2. **六爻 (太极贵人)** - 占卜问卦
   - 🪙 铜钱摇卦：3D动画效果的真实摇卦体验
   - 🔮 卦象生成：专业的六爻卦象生成和解析
   - 📊 针对性预测：具体事件的吉凶判断和行动指引

3. **合盘 (红鸾天喜)** - 双人八字分析
   - 💑 配对分析：双人八字匹配度测算
   - 💝 相处建议：专业的情感指导和相处之道
   - 📚 历史记录：保存合盘记录，支持快速重测

### 🎨 技术特色

- 🤖 **AI角色扮演**：三个不同性格的命理专家，古风语言风格
- 🎵 **多模态输出**：文本+语音双重体验，支持语音输入
- 📱 **现代化UI**：沉浸式古风界面，流畅动画效果
- 🔒 **安全可靠**：环境变量保护、CORS配置、错误处理完善

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** 或 **yarn**
- **现代浏览器** (推荐Chrome，支持Web Speech API)

### 安装步骤

1. **下载项目**
   ```bash
   # 下载项目文件到本地
   # 解压到目标文件夹
   cd 道求职
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp env.example .env
   
   # 编辑.env文件，填入你的七牛云API密钥
   # QINIU_API_KEY=你的七牛云API密钥
   ```

4. **启动服务**
   ```bash
   # 生产模式
   npm start
   
   # 开发模式（自动重启）
   npm run dev
   ```

5. **访问应用**
   - 打开浏览器访问：http://localhost:3000
   - 选择需要的功能进行体验

## 📁 项目文件结构

### 🔧 核心服务文件

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `server.js` | 主服务器文件，提供所有API接口 | ⭐⭐⭐⭐⭐ |
| `package.json` | 项目配置和依赖管理 | ⭐⭐⭐⭐⭐ |
| `.env` | 环境变量配置（需要自己创建） | ⭐⭐⭐⭐⭐ |
| `env.example` | 环境变量配置模板 | ⭐⭐⭐⭐ |

### 🧮 八字计算模块

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `bazi_calculator.js` | 八字计算器，公历转农历，四柱推算 | ⭐⭐⭐⭐⭐ |

### 🤖 AI客户端模块

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `qwen_client.js` | 七牛云大模型调用客户端 | ⭐⭐⭐⭐⭐ |
| `liuyao_client.js` | 六爻太极贵人专用AI客户端 | ⭐⭐⭐⭐ |
| `heban_client.js` | 合盘红鸾天喜专用AI客户端 | ⭐⭐⭐⭐ |
| `tts_client.js` | 语音合成客户端 | ⭐⭐⭐⭐ |
| `asr_client.js` | 语音识别客户端（备用，主要使用浏览器API） | ⭐⭐ |

### 🔄 业务流水线

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `ai_pipeline.js` | 八字分析AI处理流水线 | ⭐⭐⭐⭐⭐ |
| `liuyao_pipeline.js` | 六爻占卜AI处理流水线 | ⭐⭐⭐⭐ |
| `heban_pipeline.js` | 合盘分析AI处理流水线 | ⭐⭐⭐⭐ |

### 🔮 六爻占卜模块

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `liuyao_generator.js` | 六爻卦象生成器，铜钱投掷逻辑 | ⭐⭐⭐⭐⭐ |

### 📝 AI提示词模块

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `prompt_functions.js` | 天乙贵人事业分析提示词 | ⭐⭐⭐⭐⭐ |
| `marriage_prompt_functions.js` | 天乙贵人姻缘分析提示词 | ⭐⭐⭐⭐ |
| `fortune_prompt_functions.js` | 天乙贵人时运分析提示词 | ⭐⭐⭐⭐ |
| `liuyao_prompt_functions.js` | 太极贵人六爻分析提示词 | ⭐⭐⭐⭐ |
| `heban_prompt_functions.js` | 红鸾天喜合盘分析提示词 | ⭐⭐⭐⭐ |

### 🎨 前端页面文件

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `public/main.html` | 主页面，功能选择界面 | ⭐⭐⭐⭐⭐ |
| `public/wendao.html` | 问道功能页面（天乙贵人） | ⭐⭐⭐⭐⭐ |
| `public/liuyao.html` | 六爻功能页面（太极贵人） | ⭐⭐⭐⭐ |
| `public/heban.html` | 合盘功能页面（红鸾天喜） | ⭐⭐⭐⭐ |
| `public/wendao-chat.html` | 问道聊天界面（高级版） | ⭐⭐⭐ |
| `public/index.html` | 备用主页面 | ⭐⭐ |

### 📱 前端脚本文件

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `public/app.js` | 通用前端交互逻辑 | ⭐⭐⭐⭐ |
| `public/heban-app.js` | 合盘页面专用交互逻辑 | ⭐⭐⭐⭐ |
| `public/liuyao-app.js` | 六爻页面专用交互逻辑 | ⭐⭐⭐⭐ |
| `public/style.css` | 通用样式文件 | ⭐⭐⭐ |

### 📄 文档文件

| 文件名 | 功能说明 | 重要性 |
|--------|----------|--------|
| `README.md` | 项目说明文档 | ⭐⭐⭐⭐⭐ |
| `七牛云秋招项目：智能八字，六爻，合盘测算网站.md` | 项目设计文档 | ⭐⭐⭐ |
| `七牛云秋招项目：智能八字，六爻，合盘测算网站.pdf` | 项目设计PDF | ⭐⭐⭐ |
| `道求职_七牛云项目计划书.pdf` | 项目计划书 | ⭐⭐⭐ |
| `deepseek_mermaid_20250928_73402d.png` | 项目流程图 | ⭐⭐ |

## 📚 依赖说明

### 生产依赖
```json
{
  "axios": "^1.6.0",        // HTTP客户端，用于调用七牛云API
  "cors": "^2.8.5",         // 跨域资源共享中间件
  "express": "^4.19.2",     // Web服务器框架
  "form-data": "^4.0.4",    // 表单数据处理
  "helmet": "^7.1.0",       // 安全中间件
  "multer": "^2.0.2"        // 文件上传中间件
}
```

### 开发依赖
```json
{
  "nodemon": "^3.0.2"       // 开发时自动重启服务器
}
```

## 🔧 可用脚本

```bash
npm start          # 启动生产服务器
npm run dev        # 启动开发服务器（nodemon自动重启）
npm test           # 测试八字计算器
npm run test-qwen  # 测试大模型连接
npm run test-tts   # 测试语音合成
npm run health     # 检查服务状态
```

## ⚙️ 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 七牛云大模型API配置
QINIU_API_KEY=你的七牛云API密钥
QINIU_BASE_URL=https://openai.qiniu.com/v1
QINIU_MODEL=qwen-turbo

# 服务器配置
PORT=3000
NODE_ENV=development
```

## 📚 API接口文档

### 基础信息
- **服务地址**: `http://localhost:3000`
- **内容类型**: `application/json`

### 八字分析API

#### 1. 事业问答
```http
POST /api/ask
POST /api/ask_tts  # 带语音输出
```

#### 2. 姻缘问答
```http
POST /api/ask_marriage
POST /api/ask_marriage_tts  # 带语音输出
```

#### 3. 时运问答
```http
POST /api/ask_fortune
POST /api/ask_fortune_tts  # 带语音输出
```

### 六爻占卜API

#### 1. 六爻占卜
```http
POST /api/ask_liuyao
POST /api/ask_liuyao_tts  # 带语音输出
```

### 合盘分析API

#### 1. 双人合盘
```http
POST /api/ask_heban
POST /api/ask_heban_tts  # 带语音输出
```

### 语音合成API

#### 1. 纯TTS合成
```http
POST /api/tts_audio
```

### 健康检查
```http
GET /health
```

## 🎯 使用场景

### 目标用户
- 📚 应届毕业生和在校学生
- 💼 求职焦虑的大学生
- 🔍 寻求职业指导的年轻人
- 🔮 对传统命理感兴趣的群体

### 应用场景
- 求职迷茫时的方向指导
- 面试前的心理建设
- 职业规划的参考建议
- 感情问题的专业咨询
- 当下运势的实时分析
- 重要决策的占卜参考

## 🔮 三大AI角色特色

### 天乙贵人 (问道)
- **角色定位**：严肃专业的八字大师
- **语言风格**：古风庄重，以"贫道"自称
- **专业领域**：事业、姻缘、时运三大方向
- **音色特色**：`qiniu_zh_male_ybxknjs` (男声，庄重)

### 太极贵人 (六爻)
- **角色定位**：仙风道骨的占卜专家
- **语言风格**：古风飘逸，精通周易
- **专业领域**：六爻占卜、具体事件预测
- **音色特色**：`qiniu_zh_male_szxyxd` (率真校园向导)

### 红鸾天喜 (合盘)
- **角色定位**：活泼亲切的姻缘之神
- **语言风格**：温柔浪漫，充满希望
- **专业领域**：双人合盘、情感指导
- **音色特色**：`qiniu_zh_female_xyqxxj` (校园清新学姐)

## 🛠️ 开发指南

### 项目架构

```
道求职/
├── 📁 核心服务
│   ├── server.js                 # Express服务器主文件
│   ├── package.json             # 项目配置和依赖
│   └── .env                     # 环境变量配置
│
├── 📁 八字计算
│   └── bazi_calculator.js       # 八字计算核心算法
│
├── 📁 AI客户端
│   ├── qwen_client.js           # 七牛云大模型客户端
│   ├── liuyao_client.js         # 六爻专用AI客户端
│   ├── heban_client.js          # 合盘专用AI客户端
│   ├── tts_client.js            # 语音合成客户端
│   └── asr_client.js            # 语音识别客户端
│
├── 📁 业务流水线
│   ├── ai_pipeline.js           # 八字分析流水线
│   ├── liuyao_pipeline.js       # 六爻占卜流水线
│   └── heban_pipeline.js        # 合盘分析流水线
│
├── 📁 六爻占卜
│   └── liuyao_generator.js      # 六爻卦象生成器
│
├── 📁 AI提示词
│   ├── prompt_functions.js      # 事业分析提示词
│   ├── marriage_prompt_functions.js  # 姻缘分析提示词
│   ├── fortune_prompt_functions.js   # 时运分析提示词
│   ├── liuyao_prompt_functions.js    # 六爻分析提示词
│   └── heban_prompt_functions.js     # 合盘分析提示词
│
├── 📁 前端页面
│   ├── public/main.html         # 主页面（功能选择）
│   ├── public/wendao.html       # 问道功能页面
│   ├── public/liuyao.html       # 六爻功能页面
│   ├── public/heban.html        # 合盘功能页面
│   ├── public/wendao-chat.html  # 问道聊天界面
│   └── public/index.html        # 备用主页面
│
├── 📁 前端脚本
│   ├── public/app.js            # 通用前端交互逻辑
│   ├── public/heban-app.js      # 合盘页面交互逻辑
│   ├── public/liuyao-app.js     # 六爻页面交互逻辑
│   └── public/style.css         # 通用样式文件
│
└── 📁 项目文档
    ├── README.md                # 项目说明文档
    ├── 七牛云秋招项目：智能八字，六爻，合盘测算网站.md
    ├── 七牛云秋招项目：智能八字，六爻，合盘测算网站.pdf
    ├── 道求职_七牛云项目计划书.pdf
    └── deepseek_mermaid_20250928_73402d.png  # 项目流程图
```

## 🎮 功能使用指南

### 1. 问道功能 (天乙贵人)
1. 访问：http://localhost:3000/wendao.html
2. 输入生辰八字信息
3. 选择分析方向：事业/姻缘/时运
4. 输入具体问题
5. 选择输出格式：文字/语音
6. 获得专业的八字分析

### 2. 六爻功能 (太极贵人)
1. 访问：http://localhost:3000/liuyao.html
2. 输入要占卜的具体问题
3. 点击"开始摇卦"观看铜钱动画
4. 等待6次投掷完成生成卦象
5. 获得基于真实卦象的占卜分析

### 3. 合盘功能 (红鸾天喜)
1. 访问：http://localhost:3000/heban.html
2. 分别输入甲方和乙方的生辰信息
3. 输入合盘相关问题
4. 选择输出格式
5. 获得双人八字匹配分析和相处建议

## 🔍 测试验证

### 健康检查
```bash
curl http://localhost:3000/health
```

### 测试八字分析
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"year":1995,"month":5,"day":15,"hour":10,"question":"我的事业发展如何？"}'
```

### 测试语音合成
```bash
npm run test-tts
```

## 🚨 注意事项

1. **API密钥配置**：必须配置有效的七牛云API密钥才能使用AI分析和语音合成功能
2. **浏览器兼容性**：语音识别功能需要现代浏览器支持，推荐使用Chrome
3. **网络连接**：需要稳定的网络连接以调用七牛云API服务
4. **端口占用**：确保3000端口未被其他应用占用

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢七牛云提供的AI大模型和语音合成服务
- 感谢传统八字和六爻文化的智慧传承
- 感谢所有为项目贡献的开发者

---

**道友好，愿你在求职路上得到天乙贵人的指引！** 🙏

## 🔗 快速访问链接

- 🏠 **主页面**: http://localhost:3000
- 🏢 **问道功能**: http://localhost:3000/wendao.html
- ☯️ **六爻功能**: http://localhost:3000/liuyao.html
- 💕 **合盘功能**: http://localhost:3000/heban.html
- 💬 **问道聊天**: http://localhost:3000/wendao-chat.html

- 🔍 **健康检查**: http://localhost:3000/health

