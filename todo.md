# 🌳 树洞系统 - 项目需求文档

## 项目概述
类似于"百度贴吧"的分布式讨论平台，具有用户认证、内容发布、审核管理等功能。

---

## 功能需求

### 1. 用户认证系统 ✅
- [x] **分为管理员和普通账号**
  - 支持本地账号+密码登录
  - 用户角色分为 `admin` (管理员) 和 `user` (普通用户)
  - JWT token 认证

- **实现细节：**
  - User 模型包含: username, password (加密), role, createdAt
  - 密码使用 bcryptjs 加密存储
  - 登录返回 JWT token 和用户信息

### 2. 分区管理系统 ✅
- [x] **所有账号都可以创建分区**
  - 分区类似百度贴吧的"吧"
  - 分区包含: 名称, 描述, 创建者, 吧主

- [x] **首次创建的人将成为吧主**
  - 分区创建者默认成为吧主 (moderator)
  - 吧主拥有分区的管理权限

- **审核规则：**
  - 管理员创建的分区: 直接发布 (status: 'approved')
  - 普通用户创建的分区: 需经过管理员审核 (status: 'pending')

- **实现细节：**
  - Section 模型: name, description, creator, moderator, status, createdAt
  - API endpoints:
    - POST /api/sections - 创建分区
    - GET /api/sections - 获取所有已审核分区
    - GET /api/sections/:id - 获取单个分区
    - GET /api/sections/admin/all - 管理员获取所有分区
    - PUT /api/sections/:id/approve - 管理员审核分区

### 3. 内容发布系统 ✅
- [x] **任何账号都可以在分区下发布内容**
  
- [x] **支持多种内容类型：**
  - 文字内容
  - 图片内容
  - 投票内容

- **审核规则：**
  - 管理员发布的内容: 直接显示 (status: 'approved')
  - 普通用户发布的内容: 需经过管理员审核 (status: 'pending')

- **实现细节：**
  - Post 模型: title, content, images, poll, author, section, status, likes, createdAt
  - Poll 子对象: question, options, votes
  - API endpoints:
    - POST /api/posts - 发布内容
    - GET /api/posts - 获取所有内容 (管理员)
    - GET /api/posts/section/:sectionId - 获取分区内容
    - GET /api/posts/:id - 获取单个内容
    - POST /api/posts/:id/like - 点赞
    - PUT /api/posts/:id/approve - 管理员审核

### 4. 评论和点赞系统 ✅
- [x] **任何账号都可以在内容下点赞**
  - 点赞是可逆操作
  - 支持内容点赞和评论点赞

- [x] **任何账号都可以在内容下评论**
  - 评论文本内容
  - 支持对评论点赞

- **实现细节：**
  - Comment 模型: content, author, post, likes, createdAt
  - Post 和 Comment 都支持 likes 数组 (存储用户ID)
  - API endpoints:
    - POST /api/comments - 发表评论
    - GET /api/comments/post/:postId - 获取评论列表
    - POST /api/comments/:id/like - 点赞评论

### 5. 管理员审核系统 ✅
- [x] **管理员可审核普通用户的内容**
  - 待审核分区列表
  - 待审核内容列表
  - 一键审核通过功能

- [x] **管理员内容无需审核**
  - 管理员创建的分区和内容直接发布

- **实现细节：**
  - Admin 管理面板页面
  - 两个标签页: "待审核分区" 和 "待审核帖子"
  - 显示待审核项目列表
  - 提供审核通过按钮

---

## 技术栈

### 后端 (Backend)
- **框架:** Node.js + Express.js
- **数据库:** MongoDB
- **认证:** JWT + bcryptjs
- **文件上传:** Multer
- **其他:** CORS, dotenv

### 前端 (Frontend)
- **框架:** React 19
- **路由:** React Router v7
- **HTTP 客户端:** Axios
- **样式:** CSS3

### 基础设施
- **数据库容器:** MongoDB (Docker)
- **开发服务器:** Node.js + React dev server
- **端口配置:**
  - 后端 API: 5000
  - 前端应用: 3000
  - MongoDB: 27017

---

## 项目结构

```
---hbbss-treehole-system/
├── server/
│   ├── app.js                 # Express主应用
│   ├── middleware/
│   │   └── auth.js           # JWT认证中间件
│   ├── models/
│   │   ├── User.js           # 用户模型
│   │   ├── Section.js        # 分区模型
│   │   ├── Post.js           # 内容模型
│   │   └── Comment.js        # 评论模型
│   └── routes/
│       ├── auth.js           # 认证路由
│       ├── sections.js       # 分区路由
│       ├── posts.js          # 内容路由
│       └── comments.js       # 评论路由
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Login.js      # 登录组件
│       │   ├── Navbar.js     # 导航栏
│       │   ├── Home.js       # 分区列表
│       │   ├── Section.js    # 分区详情
│       │   ├── Post.js       # 内容详情
│       │   └── Admin.js      # 管理后台
│       ├── App.js            # 主应用
│       └── index.js
├── uploads/                  # 文件上传目录
├── .env                      # 环境变量
├── package.json
└── README.md
```

---

## 已完成功能清单

### 后端 API
- [x] 用户认证 (注册/登录)
- [x] 分区管理 (创建/查询/审核)
- [x] 内容发布 (创建/查询/点赞/审核)
- [x] 评论系统 (发表/查询/点赞)
- [x] 权限验证 (JWT token)
- [x] 审核流程 (管理员审核普通用户内容)

### 前端 UI
- [x] 登录/注册页面
- [x] 导航栏 (含用户信息/管理后台链接)
- [x] 分区列表页
- [x] 分区详情页 (含发布内容表单)
- [x] 内容详情页 (含评论系统)
- [x] 管理后台 (审核面板)
- [x] 响应式设计
- [x] 现代化UI样式

### 数据库
- [x] MongoDB 连接
- [x] 数据模型设计
- [x] 数据验证

---

## 待做事项

- [ ] 添加内容搜索功能
- [ ] 添加内容标签系统
- [ ] 添加用户个人资料页
- [ ] 添加用户关注功能
- [ ] 添加分区订阅功能
- [ ] 优化前端性能 (代码分割、懒加载)
- [ ] 添加图片预览功能
- [ ] 添加消息通知系统
- [ ] 部署到生产环境
- [ ] 添加单元测试
- [ ] 添加 E2E 测试

---

## 启动指南

### 1. 启动 MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. 启动后端服务器
```bash
node server/app.js
# 或使用 nodemon (需先安装)
npm run dev
```

### 3. 启动前端应用
```bash
cd client
npm start
```

### 4. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:5000

---

## 环境变量配置 (.env)

```
MONGO_URI=mongodb://localhost:27017/treehole
JWT_SECRET=your_secret_key_here
PORT=5000
```

---

## API 文档概览

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 分区
- `POST /api/sections` - 创建分区 (需认证)
- `GET /api/sections` - 获取已批准分区
- `GET /api/sections/:id` - 获取分区详情
- `GET /api/sections/admin/all` - 获取所有分区 (管理员)
- `PUT /api/sections/:id/approve` - 审批分区 (管理员)

### 内容
- `POST /api/posts` - 发布内容 (需认证)
- `GET /api/posts` - 获取所有内容 (管理员)
- `GET /api/posts/section/:sectionId` - 获取分区内容
- `GET /api/posts/:id` - 获取内容详情
- `POST /api/posts/:id/like` - 点赞内容 (需认证)
- `PUT /api/posts/:id/approve` - 审批内容 (管理员)

### 评论
- `POST /api/comments` - 发表评论 (需认证)
- `GET /api/comments/post/:postId` - 获取评论
- `POST /api/comments/:id/like` - 点赞评论 (需认证)

---

## 测试账号

### 管理员账号 (可选自建)
- username: admin
- password: Admin@123
- role: admin

### 普通用户账号 (可选自建)
- username: user
- password: User@123
- role: user

---

## 更新日志

### v1.0.0 (2026-03-23)
- ✅ 初始项目搭建
- ✅ 完成所有核心功能
- ✅ 构建完整的前端UI
- ✅ 实现管理员审核系统
