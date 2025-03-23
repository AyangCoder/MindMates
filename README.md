# MindMates - 思维伙伴

## 项目介绍

MindMates（思维伙伴）是一个创新型对话平台，支持用户与多个大语言模型进行交互。系统支持单模型对话和多模型协同讨论，为用户提供多元化的AI对话体验。

### 主要功能
- 支持DeepSeek R1和豆包-1.5Pro-32k两个模型的对话
- 简洁直观的用户界面，支持模型快速切换
- 实时对话历史记录和管理
- 支持代码块等富文本格式显示

## 项目结构

```
├── client/          # 前端React应用
│   ├── src/         # 源代码
│   │   ├── components/  # UI组件
│   │   ├── contexts/   # React Context
│   │   ├── services/   # API服务
│   │   └── utils/      # 工具函数
│   ├── public/      # 静态资源
│   └── package.json # 前端依赖
├── server/          # 后端Express服务
│   ├── src/         # 源代码
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 服务层
│   │   └── utils/        # 工具函数
│   └── package.json # 后端依赖
└── README.md        # 项目说明
```

## 开发说明

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 前端开发
```bash
cd client
npm install
npm run dev
```
访问 http://localhost:3000 查看前端页面

### 后端开发
```bash
cd server
npm install
npm run dev
```
后端服务运行在 http://localhost:3001

### 环境变量配置
在server目录下创建.env文件：
```
ARK_API_KEY=your_api_key_here
PORT=3001
```

## 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **UI组件**：Ant Design 5.0
- **状态管理**：React Context API
- **构建工具**：Vite
- **HTTP客户端**：Axios

### 后端
- **运行时**：Node.js
- **框架**：Express.js
- **语言**：TypeScript
- **数据存储**：本地文件系统

## 部署说明

### 前端部署
```bash
cd client
npm run build
```

### 后端部署
```bash
cd server
npm run build
npm run start
```

## 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## 许可证
MIT License