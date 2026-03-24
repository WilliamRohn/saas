// 全局变量声明
let state = 'wait'; // wait, pending, resolved, reject
// 初始化Authorization（从URL获取token）
let Authorization = new URLSearchParams(location.search).get('token');

// 初始化DOM元素引用
let statusBadge = document.getElementById('statusBadge');
let statusText = document.getElementById('statusText');
let lastCheckTime = document.getElementById('lastCheckTime');
let todayCheckCount = document.getElementById('todayCheckCount');
let checkNum = document.getElementById('checkNum');
let reportedNum = document.getElementById('reportedNum');
let mainImage = document.getElementById('mainImage');
let checkBtn = document.getElementById('checkBtn');
let repairBtn = document.getElementById('repairBtn');
let messageContainer = document.getElementById('messageContainer');

// 初始化动画元素
let star1 = document.getElementById('star1');
let star2 = document.getElementById('star2');
let star3 = document.getElementById('star3');
let star4 = document.getElementById('star4');
let star5 = document.getElementById('star5');
let spark = document.getElementById('spark');
let link1 = document.getElementById('link1');
let link2 = document.getElementById('link2');

// 初始化状态图片
let img2Wait = document.getElementById('img2Wait');
let img2Pending = document.getElementById('img2Pending');
let img2Reject = document.getElementById('img2Reject');

// 绑定事件监听器
checkBtn.addEventListener('click', () => startSpeedTest());
repairBtn.addEventListener('click', () => goRepair());

// 获取上次检测成功的数据
let storedData = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : ""
updateData(storedData);

// 格式化时间显示
function formatLastCheckTime(timeString) {
    if (!timeString) return '--';
    const check = new Date(timeString);
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);          // 0 点
    const checkDay = new Date(check);
    checkDay.setHours(0, 0, 0, 0);       // 0 点
  
    const diffDays = (today - checkDay) / (24 * 3600* 1000); // 精确天数差
  
    const hm = `${String(check.getHours()).padStart(2, '0')}:${String(check.getMinutes()).padStart(2, '0')}:${String(check.getSeconds()).padStart(2, '0')}`;
    const ymd = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
  
    if (diffDays === 0) return `今天 ${hm}`;
    if (diffDays === 1) return `昨天 ${hm}`;
    if (diffDays === 2) return `前天 ${hm}`;
    return ymd;
  }

// 更新状态标识
function updateStatusBadge() {
    if (['wait', 'resolved'].includes(state)) {
        statusText.textContent = '网络通畅';
        statusBadge.className = 'status-badge resolved';
    } else if (state == 'pending') {
        statusText.textContent = '检测中...';
        statusBadge.className = 'status-badge pending';
    } else if (state == 'reject') {
        statusText.textContent = '网络异常';
        statusBadge.className = 'status-badge reject';
    }
}

// 更新按钮状态
function updateButtons() {
    // 检测按钮
    if (state === 'pending') {
        checkBtn.disabled = true;
        checkBtn.textContent = '检测中...';
    } else {
        checkBtn.disabled = false;
        checkBtn.textContent = '立即检测';
    }

    // 报修按钮
    if (state === 'reject') {
        repairBtn.classList.remove('hidden');
    } else {
        repairBtn.classList.add('hidden');
    }
}

// 更新图片
function updateImages() {
    // 主图片
    if (state === 'wait') {
        mainImage.src = 'assets/section_1_wait.png';
    } else {
        mainImage.src = 'assets/section_1_pending.png';
    }

    // 状态图片
    img2Wait.classList.toggle('hidden', !['wait', 'resolved'].includes(state));
    img2Pending.classList.toggle('hidden', state !== 'pending');
    img2Reject.classList.toggle('hidden', state !== 'reject');
}

// 更新动画
function updateAnimations() {
    let arr = [star1, star2, star3, star4, star5];

    // 星星动画
    if (state === 'pending') {
        arr.forEach(el => el.classList.remove("hidden"));
    } else {
        arr.forEach(el => el.classList.add("hidden"));
    }

    // 火花和连接断开动画
    if (state === 'reject') {
        spark.classList.add('active');
        link1.classList.add('active');
        link2.classList.add('active');
    } else {
        spark.classList.remove('active');
        link1.classList.remove('active');
        link2.classList.remove('active');
    }
}

function updateData(data) {
    lastCheckTime.textContent = formatLastCheckTime(data.lastCheckTime);
    todayCheckCount.textContent = data.smoothDays;
    checkNum.textContent = data.checkNum;
    reportedNum.textContent = data.reportedNum;

    localStorage.setItem('data', JSON.stringify(data));
}

// http请求封装
var http = {
    get: async function (url) {
        const response = await fetch(url, {
            headers: { Authorization },
        });
        const result = await response.json();
        return result;
    },
    post: async function (url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization,
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return result;
    }
}

// 开始网络检测
async function startSpeedTest() {
    state = 'pending';
    updateImages();
    updateAnimations();
    updateButtons();
    updateStatusBadge();
    let { data, code, msg } = await http.post("https://www.19980926.xyz/netcheck/test", {
        appname: "netcheck"
    })

    if (code == 200 && data.checkStatus == "NORMAL") {
        state = 'resolved';
        showMessage('检测成功: 网络通畅', 'success');
        updateData(data);
    } else {
        state = 'reject';
        showMessage(msg, 'error');
    }
    updateImages();
    updateAnimations();
    updateButtons();
    updateStatusBadge();
}

// 报修功能
async function goRepair() {
    let { code } = await http.get("https://www.19980926.xyz/netcheck/repair")
    if (code == 200) {
        showMessage('报修成功', 'success');
        reportedNum.textContent = Number(reportedNum.textContent) + 1
    } else {
        showMessage('报修失败', 'error');
    }
}

/**
 * 显示消息提示框
 * @param {string} text - 要显示的消息文本内容
 * @param {string} type - 消息类型，可选值: 'info'(信息)、'success'(成功)、'error'(错误)，默认为 'info'
 * @description 在页面中动态创建一个消息提示框，显示指定的文本和样式，2秒后自动消失
 */
function showMessage(text, type = 'info') {
    if (messageContainer.children.length > 0) {
        messageContainer.removeChild(messageContainer.children[0]);
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    messageContainer.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 2000);
}
