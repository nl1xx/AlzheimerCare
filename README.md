# 阿尔茨海默照护助手 (CareAssist)

这是一个专为阿尔茨海默病患者家属设计的照护 App，包含认知评估、知识社区、生命体征监测等核心功能。（只是一个最小可行性产品）

## 项目结构

- `backend/`: Node.js + Express + SQLite 后端 API
- `frontend/`: React Native (Expo) 移动端应用

## 如何运行

### 1. 环境准备
确保电脑已安装：
- [Node.js](https://nodejs.org/) (建议 v16 或更高)
- [Expo Go](https://expo.dev/client) (在手机上安装此 App 以进行预览)

### 2. 启动后端 (Backend)

打开终端 (Terminal) 进入 backend 目录：

```bash
cd backend
npm install
npm start
```

如果成功，将看到：`Server running on http://localhost:3000`

### 3. 启动前端 (Frontend)

打开一个新的终端窗口，进入 frontend 目录：

```bash
cd frontend
npm install
npx expo start 或 npx expo start --tunnel
```

- 终端会出现一个二维码。
- 使用手机上的 **Expo Go** App 扫描二维码（安卓）或使用相机扫描（iOS）。
- App 将在您的手机上加载。

## 技术架构

- **前端**: React Native, Expo, React Navigation, Axios
- **后端**: Node.js, Express
- **数据库**: SQLite (本地文件数据库，无需额外安装)

如有问题，请检查网络连接，确保手机和电脑在同一 WiFi 下（如果使用真机调试）。
