# LangChain Chat Web

基于 Vue 3 和 Element Plus 搭建的聊天页面框架。页面包含左侧会话/模型选择区域，以及右侧聊天展示区和底部输入区。

## 技术栈

- Vue 3：前端视图框架
- Vite：开发服务器和构建工具
- Element Plus：UI 组件库
- @element-plus/icons-vue：Element Plus 图标
- JavaScript ES Modules：项目模块规范

## 目录结构

```text
.
├── index.html
├── package.json
├── vite.config.js
├── src
│   ├── App.vue
│   ├── main.js
│   ├── styles.css
│   └── services
│       └── httpClient.js
└── README.md
```

## 安装依赖

```bash
npm install
```

## 启动开发服务

```bash
npm run dev
```

启动后访问终端输出的地址，例如：

```text
http://localhost:5173/
```

如果端口已被占用，Vite 会自动切换到 `5174`、`5175` 等其他端口，请以终端实际输出为准。

## 构建生产包

```bash
npm run build
```

构建产物会生成到 `dist/` 目录。

## 本地预览生产包

```bash
npm run preview
```

## 后端接口

项目当前通过 `src/services/httpClient.js` 统一管理 HTTP 请求。

### 获取模型列表

```http
GET /agents/models
Accept: application/json
```

开发环境下会通过 Vite 代理转发到：

```text
http://127.0.0.1:8000/agents/models
```

### 发送聊天消息

```http
POST /agents/chat
Accept: application/json
Content-Type: application/json
```

请求体示例：

```json
{
  "question": "旧金山天气如何？",
  "model_index": 0
}
```

开发环境下会通过 Vite 代理转发到：

```text
http://127.0.0.1:8000/agents/chat
```

## Vite 代理

`vite.config.js` 中配置了 `/agents` 代理，用于解决开发环境浏览器跨域问题：

```js
server: {
  proxy: {
    '/agents': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  },
}
```

因此开发环境前端代码应请求同源路径：

```text
/agents/models
/agents/chat
```

不要在浏览器中直接请求完整后端地址，否则会触发 CORS。

## 环境变量

开发环境默认使用 Vite proxy，不需要配置后端完整地址。

生产环境如果不使用同域反向代理，可以在 `.env` 中配置：

```env
VITE_API_BASE_URL=http://127.0.0.1
VITE_API_PORT=8000
```

## 调试

1. 打开浏览器 DevTools。
2. 在 Console 中查看 `HttpClient` 和 `loadChatModels` 相关日志。
3. 在 Network 中检查请求是否为 `/agents/models` 或 `/agents/chat`。
4. 如需单独验证后端接口：

```bash
curl -i http://127.0.0.1:8000/agents/models -H "Accept: application/json"
```

```bash
curl -i http://127.0.0.1:8000/agents/chat \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"question":"旧金山天气如何？","model_index":0}'
```

5. 如需验证 Vite 代理，假设开发服务端口为 `5175`：

```bash
curl -i http://localhost:5175/agents/models -H "Accept: application/json"
```

## 主要依赖

运行依赖：

- `vue`
- `element-plus`
- `@element-plus/icons-vue`

开发依赖：

- `vite`
- `@vitejs/plugin-vue`
