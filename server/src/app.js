import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 配置跨域
app.use(cors());

// 配置请求体解析
app.use(express.json());

// 配置速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP在windowMs内最多100个请求
});
app.use(limiter);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 聊天完成路由
app.post('/api/chat/completions', async (req, res) => {
  try {
    const { model, messages } = req.body;
    // TODO: 实现与选定模型的API交互
    res.json({
      id: 'chat-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '这是一个测试响应'
          },
          finish_reason: 'stop'
        }
      ]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});