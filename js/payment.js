// 支付相关功能

// 生成或获取用户ID
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        // 生成简单的用户指纹（基于浏览器信息）
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// 创建支付订单
async function createPaymentOrder(sleepType) {
    try {
        const userId = getUserId();

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                sleepType
            })
        });

        const data = await response.json();

        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || '创建订单失败');
        }
    } catch (error) {
        console.error('创建订单失败:', error);
        alert('创建订单失败，请稍后重试');
        return null;
    }
}

// 检查用户是否已支付
async function checkPaymentStatus() {
    try {
        const userId = getUserId();

        const response = await fetch(`/api/check-payment?userId=${userId}`);
        const data = await response.json();

        return data.paid || false;
    } catch (error) {
        console.error('检查支付状态失败:', error);
        return false;
    }
}

// 显示支付弹窗
function showPaymentModal(paymentUrl, orderId) {
    // 创建弹窗HTML
    const modalHTML = `
        <div id="paymentModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
             background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; text-align: center;">
                <h2 style="margin-bottom: 20px; color: var(--text-color);">扫码支付 ¥9.9</h2>

                <div id="qrcodeContainer" style="margin: 20px auto; width: 256px; height: 256px;
                     border: 1px solid #E0DED9; border-radius: 8px; padding: 10px;"></div>

                <p style="color: var(--secondary-text); margin: 20px 0;">
                    请使用微信或支付宝扫码支付<br>
                    支付成功后页面将自动跳转
                </p>

                <p style="font-size: 12px; color: #999; margin-bottom: 20px;">
                    订单号: ${orderId}
                </p>

                <button onclick="closePaymentModal()" style="padding: 10px 30px; background: var(--primary-color);
                        color: white; border: none; border-radius: 6px; cursor: pointer;">
                    我已完成支付
                </button>

                <p style="margin-top: 15px;">
                    <a href="javascript:void(0)" onclick="closePaymentModal()"
                       style="color: var(--secondary-text); font-size: 14px; text-decoration: none;">
                        取消
                    </a>
                </p>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 生成二维码（使用第三方库或iframe）
    const qrcodeContainer = document.getElementById('qrcodeContainer');

    // 方法1: 使用iframe嵌入支付页面
    qrcodeContainer.innerHTML = `<iframe src="${paymentUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;

    // 方法2: 如果支付平台提供二维码图片URL，可以直接显示图片
    // qrcodeContainer.innerHTML = `<img src="${paymentUrl}" style="width: 100%; height: 100%;">`;

    // 开始轮询支付状态
    startPaymentPolling(orderId);
}

// 关闭支付弹窗
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
    // 停止轮询
    if (window.paymentPollingInterval) {
        clearInterval(window.paymentPollingInterval);
    }

    // 手动检查一次支付状态
    checkAndRedirect();
}

// 轮询检查支付状态
function startPaymentPolling(orderId) {
    // 每3秒检查一次
    window.paymentPollingInterval = setInterval(async () => {
        const paid = await checkPaymentStatus();
        if (paid) {
            clearInterval(window.paymentPollingInterval);
            closePaymentModal();
            // 跳转到报告页面
            window.location.href = 'report.html';
        }
    }, 3000);

    // 5分钟后停止轮询
    setTimeout(() => {
        if (window.paymentPollingInterval) {
            clearInterval(window.paymentPollingInterval);
        }
    }, 5 * 60 * 1000);
}

// 检查并跳转
async function checkAndRedirect() {
    const paid = await checkPaymentStatus();
    if (paid) {
        window.location.href = 'report.html';
    }
}

// 处理购买按钮点击
async function handleBuyReport(sleepType) {
    // 先检查是否已经购买
    const alreadyPaid = await checkPaymentStatus();
    if (alreadyPaid) {
        window.location.href = 'report.html';
        return;
    }

    // 创建订单
    const orderData = await createPaymentOrder(sleepType);
    if (!orderData) {
        return;
    }

    // 保存订单信息
    localStorage.setItem('currentOrderId', orderData.orderId);

    // 显示支付弹窗
    showPaymentModal(orderData.paymentUrl, orderData.orderId);
}
