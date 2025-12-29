# 睡眠助手 - 睡眠评估与分析系统

一个帮助用户了解自己睡眠问题的网站，提供科学的睡眠评估和个性化分析报告。

## 功能特点

- ✅ 12题科学睡眠评估
- ✅ 4种睡眠类型分析（节律紊乱型、高唤醒型、情绪负担型、恢复不足型）
- ✅ 完整个性化报告（7个章节）
- ✅ 两种支付方案可选：
  - 方案1：手动密码解锁（完全免费，适合快速上线）
  - 方案2：自动支付系统（需要支付平台，完全自动化）
- ✅ 移动端适配

## 技术栈

- 前端：HTML、CSS、JavaScript
- 后端：Vercel 云函数（Serverless）
- 数据库：Vercel KV (Redis)
- 支付：虎皮椒/PayJS 等第三方支付

## 快速开始

### 选择你的支付方案

#### 🆓 方案1：手动密码解锁（推荐新手）
**优点：** 完全免费，立刻上线，无需任何第三方平台
**缺点：** 需要手动给用户发密码

详细设置步骤请查看：[MANUAL_PAYMENT_SETUP.md](MANUAL_PAYMENT_SETUP.md)

**快速步骤：**
1. 准备收款码和微信二维码图片
2. 放到 `images/` 文件夹
3. 修改 `result.html` 中的图片路径
4. 生成密码（访问 `admin-password.html`）
5. 把密码添加到 `unlock-report.html`
6. 完成！

---

#### ⚡ 方案2：自动支付系统（推荐有收入后）
**优点：** 完全自动化，用户付款立刻解锁
**缺点：** 需要支付平台（虎皮椒118元）和Vercel KV数据库

详细部署步骤请查看：[DEPLOYMENT.md](DEPLOYMENT.md)

**快速步骤：**
1. 注册虎皮椒账号
2. 获取 appid 和 secret
3. 在Vercel配置环境变量
4. 添加Vercel KV数据库
5. 部署完成！

---

### 通用步骤

#### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/sleep-helper-website.git
cd sleep-helper-website
```

#### 2. 本地预览（可选）
直接用浏览器打开 `index.html` 即可预览

或安装依赖运行：
```bash
npm install
npm run dev
```

#### 3. 部署到Vercel
- 上传代码到GitHub
- 在Vercel导入项目
- 自动部署完成
- 获得免费域名：`你的项目.vercel.app`

## 项目结构

```
sleep-helper-website/
├── api/                    # Vercel云函数（后端API）
│   ├── create-order.js     # 创建支付订单
│   ├── payment-callback.js # 支付回调处理
│   └── check-payment.js    # 检查支付状态
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── main.js            # 主逻辑
│   ├── assessment.js      # 评估问卷
│   ├── result.js          # 结果页面
│   ├── report.js          # 完整报告
│   └── payment.js         # 支付功能
├── index.html             # 首页
├── assessment.html        # 评估页面
├── result.html            # 结果页面
├── report.html            # 完整报告页面
├── personalized-plan.html # 购买说明页
├── vercel.json            # Vercel配置
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 环境变量配置

在Vercel项目设置中添加以下环境变量：

```
PAYMENT_APPID=你的支付平台appid
PAYMENT_SECRET=你的支付平台密钥
```

## 成本说明

- **免费部分**
  - Vercel托管：免费
  - Vercel KV数据库：免费额度
  - GitHub：免费

- **收费部分**
  - 支付手续费：约3-5%
  - 用户支付¥9.9，你实际收到约¥9.4-9.6

## 许可证

MIT License

## 作者

睡眠助手项目

---

## 更多信息

- 详细部署教程：[DEPLOYMENT.md](DEPLOYMENT.md)
- 问题反馈：[GitHub Issues](https://github.com/你的用户名/sleep-helper-website/issues)
