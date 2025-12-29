# 睡眠助手网站 - 部署说明

## 一、准备工作

### 1. 注册账号

需要注册以下服务：

1. **Vercel账号**（免费）
   - 访问：https://vercel.com
   - 用GitHub账号登录

2. **支付平台账号**（选择一个）
   - 虎皮椒：https://www.xunhupay.com （推荐，个人可用）
   - PayJS：https://payjs.cn
   - 易支付：根据具体服务商

### 2. 配置支付平台

以虎皮椒为例：

1. 注册并实名认证
2. 绑定收款账号（微信/支付宝）
3. 获取以下信息：
   - `appid`（应用ID）
   - `appsecret`（应用密钥）
4. 记下这些信息，后面要用

---

## 二、部署到Vercel

### 方法1：通过GitHub（推荐）

1. **上传代码到GitHub**
   ```bash
   cd D:\sleep-helper-website
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/sleep-helper-website.git
   git push -u origin main
   ```

2. **在Vercel导入项目**
   - 登录 https://vercel.com
   - 点击"New Project"
   - 选择"Import Git Repository"
   - 选择你刚才创建的GitHub仓库
   - 点击"Import"

3. **配置环境变量**
   - 在Vercel项目设置中，找到"Environment Variables"
   - 添加以下变量：
     ```
     PAYMENT_APPID = 你的虎皮椒appid
     PAYMENT_SECRET = 你的虎皮椒appsecret
     ```
   - 点击"Save"

4. **添加Vercel KV数据库**
   - 在Vercel项目中，点击"Storage"标签
   - 点击"Create Database"
   - 选择"KV (Redis)"
   - 点击"Continue"
   - 数据库名称：sleep-helper-db
   - 区域选择：Hong Kong（香港，距离近）
   - 点击"Create"

5. **重新部署**
   - 点击"Deployments"
   - 点击最新的部署右侧的三个点
   - 选择"Redeploy"
   - 完成！

### 方法2：通过Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd D:\sleep-helper-website
   vercel
   ```

4. **设置环境变量**
   ```bash
   vercel env add PAYMENT_APPID
   vercel env add PAYMENT_SECRET
   ```

5. **添加KV数据库**（在Vercel网站后台操作，见方法1步骤4）

6. **生产部署**
   ```bash
   vercel --prod
   ```

---

## 三、配置支付回调

部署成功后，你会得到一个网址，比如：`https://sleep-helper-website.vercel.app`

### 1. 设置支付回调地址

在虎皮椒后台：
- 找到"应用设置"
- 设置"异步通知地址"为：
  ```
  https://你的网址.vercel.app/api/payment-callback
  ```
- 保存

### 2. 测试支付流程

1. 访问你的网站
2. 完成睡眠评估
3. 点击"立即购买完整报告"
4. 扫码支付
5. 支付成功后应该自动跳转到报告页面

---

## 四、常见问题

### Q1: 支付后没有跳转？
**检查：**
1. Vercel KV数据库是否正确添加
2. 环境变量是否正确配置
3. 支付平台回调地址是否正确
4. 查看Vercel的Logs（日志）看是否有错误

### Q2: API调用失败？
**检查：**
1. 确保所有API文件都在 `api/` 目录下
2. 确保文件名正确：
   - `api/create-order.js`
   - `api/payment-callback.js`
   - `api/check-payment.js`

### Q3: 数据库连接失败？
**检查：**
1. Vercel KV是否已创建
2. 在项目设置的Storage标签中，KV数据库是否已关联
3. 重新部署项目

### Q4: 想换其他支付平台？
**操作：**
1. 修改 `api/create-order.js` 中的 `createPaymentUrl` 函数
2. 参考新平台的API文档修改签名算法
3. 修改 `api/payment-callback.js` 中的回调验证逻辑

---

## 五、本地开发测试

如果你想在本地测试：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **创建 `.env` 文件**
   ```
   PAYMENT_APPID=你的appid
   PAYMENT_SECRET=你的secret
   ```

3. **运行本地开发服务器**
   ```bash
   npm run dev
   ```

4. **访问**
   ```
   http://localhost:3000
   ```

**注意：** 本地测试时，支付回调无法接收（需要公网地址）。你可以：
- 先部署到Vercel测试支付功能
- 或使用内网穿透工具（如ngrok）

---

## 六、成本说明

### 免费部分
- Vercel托管：免费
- Vercel KV数据库：免费额度（足够个人项目使用）
- GitHub：免费

### 收费部分
- 支付手续费：3-5%（以虎皮椒为例）
  - 用户支付 ¥9.9
  - 你实际收到约 ¥9.4-9.6
  - 手续费 ¥0.3-0.5

---

## 七、后续优化建议

### 1. 添加邮件通知
用户支付成功后发送报告链接到邮箱

### 2. 添加优惠码功能
可以给特定用户发放优惠码

### 3. 数据统计
在Vercel添加Analytics查看访问量

### 4. 备份数据
定期导出Vercel KV中的订单数据

---

## 需要帮助？

如果遇到问题：
1. 查看Vercel的部署日志（Deployments → Logs）
2. 查看函数日志（Functions → 选择具体函数 → Logs）
3. 检查浏览器控制台是否有JavaScript错误

祝你部署顺利！🎉
