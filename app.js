/**
 * 主应用逻辑 - 成熟美学版
 * 移除翻页，只保留搜索，节点无限展开
 */

class MindStreamApp {
    constructor() {
        this.renderer = new MindMapRenderer('mindmap-canvas');
        this.ai = new AIThinkingEngine();
        this.currentQuestion = '';
        this.currentData = null;

        this.initUI();
        this.checkApiKey();
    }

    /**
     * 初始化 UI 元素和事件监听
     */
    initUI() {
        // 搜索按钮
        document.getElementById('search-btn').addEventListener('click', () => {
            this.showSearchPanel();
        });

        // 导入按钮
        document.getElementById('import-btn').addEventListener('click', () => {
            this.showImportPanel();
        });

        // 刷新按钮 - 重新生成当前问题
        document.getElementById('refresh-btn').addEventListener('click', () => {
            if (this.currentQuestion) {
                this.loadQuestion(this.currentQuestion);
            } else {
                this.loadRandomQuestion();
            }
        });

        // 搜索提交
        document.getElementById('search-submit').addEventListener('click', () => {
            const input = document.getElementById('search-input');
            if (input.value.trim()) {
                this.loadQuestion(input.value.trim());
                this.hideSearchPanel();
                input.value = '';
            }
        });

        // 搜索取消
        document.getElementById('search-close').addEventListener('click', () => {
            this.hideSearchPanel();
        });

        // 搜索输入框回车
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('search-submit').click();
            }
        });

        // 导入提交
        document.getElementById('import-submit').addEventListener('click', () => {
            const input = document.getElementById('import-input');
            const jsonText = input.value.trim();
            if (jsonText) {
                try {
                    const data = JSON.parse(jsonText);
                    this.loadImportedData(data);
                    this.hideImportPanel();
                    input.value = '';
                } catch (error) {
                    alert('JSON 格式错误，请检查后重试');
                    console.error('导入失败:', error);
                }
            }
        });

        // 导入取消
        document.getElementById('import-close').addEventListener('click', () => {
            this.hideImportPanel();
        });

        // API Key 提交
        document.getElementById('api-key-submit').addEventListener('click', () => {
            const input = document.getElementById('api-key-input');
            const key = input.value.trim();
            if (key) {
                this.ai.setApiKey(key);
                document.getElementById('api-prompt').classList.add('hidden');
                this.loadRandomQuestion();
            }
        });

        // 节点点击事件 - 无限展开
        this.renderer.onNodeClick((node) => {
            console.log('节点点击:', node.text);
            // 节点点击时，使用 AI 生成新分支（即使之前已经展开过）
            this.expandNodeWithAI(node);
        });
    }

    /**
     * 检查 API Key
     */
    checkApiKey() {
        const modal = document.getElementById('api-prompt');

        if (this.ai.hasApiKey()) {
            // 有 API Key，隐藏提示，直接开始
            modal.classList.add('hidden');
            this.loadRandomQuestion();
        } else {
            // 没有 API Key，直接进入离线演示模式
            console.log('启动离线演示模式');
            modal.classList.add('hidden');
            this.loadRandomQuestion();

            // 可选：在工具栏添加一个 API 设置按钮（未来可用）
        }
    }

    /**
     * 加载随机问题
     */
    async loadRandomQuestion() {
        const question = await this.ai.getRandomQuestion();
        await this.loadQuestion(question);
    }

    /**
     * 加载指定问题
     */
    async loadQuestion(question) {
        this.currentQuestion = question;
        this.updateQuestionCard(question);
        this.updateIndicator('思考中...');

        try {
            const data = await this.ai.generateMindMap(question);
            this.currentData = data;

            // 传递问题给渲染引擎，实现主题色动态变化
            this.renderer.setData(data, question);
            this.updateIndicator('展开探索');

        } catch (error) {
            console.error('加载问题失败:', error);
            this.updateQuestionCard('生成失败，请重试');
        }
    }

    /**
     * 使用 AI 展开节点 - 允许无限展开
     */
    async expandNodeWithAI(node) {
        // 即使节点已经有子节点，也允许再次展开（无限深度）
        console.log('展开节点:', node.text, '当前层级:', node.level);

        try {
            // 每次点击都生成新的分支
            const children = await this.ai.expandNode(node.text, this.currentQuestion);

            if (children && children.length > 0) {
                // 清除旧的子节点（如果有）
                node.children = children;
                node.expanded = false; // 重置展开状态
                this.renderer.expandNode(node);
            }
        } catch (error) {
            console.error('展开节点失败:', error);
        }
    }

    /**
     * 更新问题卡片
     */
    updateQuestionCard(text) {
        const card = document.querySelector('.question-text');
        card.textContent = text;
    }

    /**
     * 更新指示器
     */
    updateIndicator(text) {
        document.getElementById('question-indicator').textContent = text;
    }

    /**
     * 显示搜索面板
     */
    showSearchPanel() {
        document.getElementById('search-panel').classList.remove('hidden');
        document.getElementById('search-input').focus();
    }

    /**
     * 隐藏搜索面板
     */
    hideSearchPanel() {
        document.getElementById('search-panel').classList.add('hidden');
    }

    /**
     * 显示导入面板
     */
    showImportPanel() {
        document.getElementById('import-panel').classList.remove('hidden');
        document.getElementById('import-input').focus();
    }

    /**
     * 隐藏导入面板
     */
    hideImportPanel() {
        document.getElementById('import-panel').classList.add('hidden');
    }

    /**
     * 加载导入的数据
     */
    loadImportedData(data) {
        if (!data.text) {
            alert('数据格式错误：缺少 text 字段');
            return;
        }

        this.currentQuestion = data.text;
        this.currentData = data;
        this.updateQuestionCard(data.text);
        this.updateIndicator('已导入');

        // 传递问题给渲染引擎
        this.renderer.setData(data, data.text);
    }
}

// 启动应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MindStreamApp();
});
