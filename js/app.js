/**
 * 图床工具 - 核心逻辑
 * 基于 GitHub API + jsDelivr CDN
 */

// 配置存储键
const CONFIG_KEY = 'image-hosting-config';
const HISTORY_KEY = 'image-hosting-history';

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const historyList = document.getElementById('historyList');
const toast = document.getElementById('toast');
const configBody = document.getElementById('configBody');
const configToggle = document.getElementById('configToggle');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadHistory();
    initUploadEvents();
});

/**
 * 加载配置
 */
function loadConfig() {
    const config = getConfig();
    if (config) {
        document.getElementById('githubToken').value = config.token || '';
        document.getElementById('repoOwner').value = config.owner || '';
        document.getElementById('repoName').value = config.repo || 'weiruan-image';
        document.getElementById('branch').value = config.branch || 'main';
        document.getElementById('path').value = config.path || 'images';

        // 如果没有配置，展开配置面板
        if (!config.token || !config.owner) {
            configBody.classList.add('show');
            configToggle.classList.add('rotated');
        }
    } else {
        configBody.classList.add('show');
        configToggle.classList.add('rotated');
    }
}

/**
 * 获取配置
 */
function getConfig() {
    const configStr = localStorage.getItem(CONFIG_KEY);
    return configStr ? JSON.parse(configStr) : null;
}

/**
 * 保存配置
 */
function saveConfig() {
    const config = {
        token: document.getElementById('githubToken').value.trim(),
        owner: document.getElementById('repoOwner').value.trim(),
        repo: document.getElementById('repoName').value.trim() || 'weiruan-image',
        branch: document.getElementById('branch').value.trim() || 'main',
        path: document.getElementById('path').value.trim() || 'images'
    };

    if (!config.token || !config.owner) {
        showToast('请填写 GitHub Token 和用户名', 'error');
        return;
    }

    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    showToast('配置已保存', 'success');

    // 收起配置面板
    configBody.classList.remove('show');
    configToggle.classList.remove('rotated');
}

/**
 * 切换配置面板
 */
function toggleConfig() {
    configBody.classList.toggle('show');
    configToggle.classList.toggle('rotated');
}

/**
 * 初始化上传事件
 */
function initUploadEvents() {
    // 点击上传
    uploadArea.addEventListener('click', () => fileInput.click());

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // 粘贴上传
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                handleFiles([file]);
                break;
            }
        }
    });
}

/**
 * 处理文件
 */
async function handleFiles(files) {
    const config = getConfig();
    if (!config || !config.token || !config.owner) {
        showToast('请先配置 GitHub Token 和用户名', 'error');
        toggleConfig();
        return;
    }

    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            showToast('只支持图片文件', 'error');
            continue;
        }

        await uploadFile(file, config);
    }
}

/**
 * 上传文件到 GitHub
 */
async function uploadFile(file, config) {
    showProgress(true);
    updateProgress(0, '准备上传...');

    try {
        // 读取文件为 Base64
        updateProgress(20, '读取文件...');
        const base64 = await fileToBase64(file);

        // 生成文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomStr}.${ext}`;
        const filePath = `${config.path}/${fileName}`;

        updateProgress(40, '上传到 GitHub...');

        // 调用 GitHub API
        const response = await fetch(
            `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload image: ${fileName}`,
                    content: base64,
                    branch: config.branch
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '上传失败');
        }

        updateProgress(80, '生成链接...');

        const result = await response.json();

        // 生成各种链接
        const links = generateLinks(config, filePath, fileName);

        updateProgress(100, '上传成功!');

        // 显示结果
        showResult(links);

        // 保存历史
        saveHistory({
            name: fileName,
            path: filePath,
            links: links,
            time: new Date().toLocaleString()
        });

        showToast('上传成功!', 'success');

    } catch (error) {
        console.error('上传失败:', error);
        showToast(`上传失败: ${error.message}`, 'error');
    } finally {
        setTimeout(() => showProgress(false), 1000);
    }
}

/**
 * 文件转 Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 生成各种链接
 */
function generateLinks(config, filePath, fileName) {
    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filePath}`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${filePath}`;
    const githubUrl = `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`;

    return {
        markdown: `![${fileName}](${cdnUrl})`,
        html: `<img src="${cdnUrl}" alt="${fileName}">`,
        direct: rawUrl,
        cdn: cdnUrl,
        github: githubUrl
    };
}

/**
 * 显示/隐藏进度
 */
function showProgress(show) {
    uploadProgress.style.display = show ? 'block' : 'none';
    uploadArea.style.display = show ? 'none' : 'block';
}

/**
 * 更新进度
 */
function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
}

/**
 * 显示结果
 */
function showResult(links) {
    resultSection.style.display = 'block';
    document.getElementById('markdownLink').value = links.markdown;
    document.getElementById('htmlLink').value = links.html;
    document.getElementById('directLink').value = links.direct;
    document.getElementById('cdnLink').value = links.cdn;
    document.getElementById('previewImage').src = links.cdn;

    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 复制链接
 */
function copyLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');

    // 使用现代 API
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        // 回退到 execCommand
        showToast('已复制到剪贴板', 'success');
    });
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

/**
 * 加载历史记录
 */
function loadHistory() {
    const history = getHistory();
    renderHistory(history);
}

/**
 * 获取历史记录
 */
function getHistory() {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
}

/**
 * 保存历史记录
 */
function saveHistory(item) {
    const history = getHistory();
    history.unshift(item);

    // 只保留最近 50 条
    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory(history);
}

/**
 * 渲染历史记录
 */
function renderHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">暂无上传记录</p>';
        return;
    }

    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <img src="${item.links.cdn}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖼️</text></svg>'">
            <div class="history-info">
                <div class="history-name">${item.name}</div>
                <div class="history-time">${item.time}</div>
            </div>
            <div class="history-actions">
                <button class="btn btn-copy" onclick="copyHistoryLink(${index}, 'markdown')">MD</button>
                <button class="btn btn-copy" onclick="copyHistoryLink(${index}, 'cdn')">链接</button>
            </div>
        </div>
    `).join('');
}

/**
 * 复制历史记录链接
 */
function copyHistoryLink(index, type) {
    const history = getHistory();
    const item = history[index];
    if (item) {
        const link = item.links[type];
        navigator.clipboard.writeText(link).then(() => {
            showToast('已复制到剪贴板', 'success');
        });
    }
}

/**
 * 清空历史记录
 */
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗?')) {
        localStorage.removeItem(HISTORY_KEY);
        loadHistory();
        showToast('历史记录已清空', 'success');
    }
}
