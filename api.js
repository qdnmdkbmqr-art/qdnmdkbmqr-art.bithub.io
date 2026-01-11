/**
 * AI API 调用模块
 * 使用 Claude API 生成思维导图分支
 */

class AIThinkingEngine {
    constructor() {
        this.apiKey = localStorage.getItem('anthropic_api_key') || '';
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    }

    /**
     * 设置 API Key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('anthropic_api_key', key);
    }

    /**
     * 检查是否已配置 API Key
     */
    hasApiKey() {
        return this.apiKey && this.apiKey.length > 0;
    }

    /**
     * 生成思维导图
     * @param {string} question - 核心问题
     * @returns {Promise<Object>} - 思维导图数据结构
     */
    async generateMindMap(question) {
        // 如果没有 API Key，直接使用离线模式
        if (!this.hasApiKey()) {
            console.log('使用离线演示模式');
            return this.getDemoMindMap(question);
        }

        const prompt = `你的身份：
一本会自己生长的「灵感本」，不是老师、不是百科，而是思维野生动物园。

【核心原则】
- 目标不是给答案，而是制造可继续思考的东西
- 不复述，不总结，像在翻译一种隐约的想法
- 每个节点≤40字（中文），适合做思维导图节点
- 每一条都是"入口"，不是结论

【话题】：${question}

【必须用6个维度理解输入】
生成5-7个第一层节点，从以下维度切入（随机选择，不必全用）：
🧠 人性/潜意识 — 本能、欲望、恐惧、自我欺骗
🏛 历史/人类学 — 过去如何塑造现在、文明的隐喻
🔬 科学/技术 — 机制、数据、反直觉的发现
💰 商业/社会结构 — 利益链、系统、阶层、游戏规则
🎭 文学/艺术 — 隐喻、象征、叙事、审美
🧃 日常/荒诞现实 — 生活中的bug、小事的大意义

【内容要求】
必须包含：
- 具体数据："减少67%"、"1997年"、"平均18分钟"
- 冷知识：不要百科语气，像"你可能不知道，但这事挺邪门的"
- 意外连接：把话题强行连到看似无关的事物
- 反常识视角：不主流、不讨好、能让人停顿3秒

【语言气质】
- 不鸡汤、不工具味、不教训人
- 有点文学，有点冷，有点好玩
- 允许模糊和开放结尾
- 像笔记，不像教材

【示例】
话题："为什么人们会拖延？"
{
  "text": "为什么人们会拖延？",
  "children": [
    {
      "text": "🧠 大脑以为明天的你是陌生人",
      "children": [
        {"text": "fMRI显示：想象未来自己时，大脑区域和想陌生人一样", "children": []},
        {"text": "时间折扣率33%/年，像给未来打7折", "children": []},
        {"text": "前额叶25岁才成熟，之前都在用爬行脑决策", "children": []},
        {"text": "松鼠的折扣率5%，比人类更有远见", "children": []}
      ]
    },
    {
      "text": "🏛 农业社会的Bug在现代失效",
      "children": [
        {"text": "种地需要等3个月，拖延=饿死", "children": []},
        {"text": "工业革命前，90%工作有明确deadline", "children": []},
        {"text": "现代知识工作：无限延期+无形惩罚", "children": []},
        {"text": "我们是第一代能拖延还能活的人类", "children": []}
      ]
    },
    {
      "text": "💰 拖延是理性选择的伪装",
      "children": [
        {"text": "任务价值不明确=大脑拒绝投资", "children": []},
        {"text": "以色列法官饭前假释率0%，饭后65%", "children": []},
        {"text": "意志力像手机电量，每小时衰减15%", "children": []},
        {"text": "拖延者不是懒，是在等确定性", "children": []}
      ]
    },
    {
      "text": "🎭 完美主义是对失败的惧场",
      "children": [
        {"text": "不开始=不会输，精神胜利法", "children": []},
        {"text": "完美主义者拖延率高218%（加拿大2019）", "children": []},
        {"text": "海明威：先写狗屎初稿，再修成杰作", "children": []},
        {"text": "艺术家的秘密：产量>质量", "children": []}
      ]
    },
    {
      "text": "🧃 手机是21世纪的鸦片",
      "children": [
        {"text": "平均每11分钟被打断1次", "children": []},
        {"text": "重新专注需23分钟，但8分钟后又被打断", "children": []},
        {"text": "App设计师偷师赌场心理学", "children": []},
        {"text": "多巴胺刷新频率：老虎机15秒，抖音3秒", "children": []}
      ]
    },
    {
      "text": "🔬 意外连接：拖延和爵士乐即兴",
      "children": [
        {"text": "都是在不确定性中寻找最佳时机", "children": []},
        {"text": "Miles Davis：沉默也是音乐的一部分", "children": []},
        {"text": "拖延也许是潜意识在等灵感", "children": []},
        {"text": "但灵感不会主动来，这是陷阱", "children": []}
      ]
    }
  ]
}

现在为【${question}】生成思维导图。

记住：
- 5-7个第一层节点，从6个维度随机切入
- 每个节点≤40字
- 必须有数据、年份、冷知识
- 不鸡汤、不说教、有点冷有点野
- 制造思考的入口，不给标准答案

输出JSON：
{
  "text": "话题原文",
  "children": [带维度emoji的节点]
}`;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 2000,
                    temperature: 0.8, // 增加随机性（默认1.0，降低到0.8保持质量）
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API 调用失败: ${response.status}`);
            }

            const data = await response.json();
            const content = data.content[0].text;

            // 提取 JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法解析 AI 返回的内容');
            }

            const mindMapData = JSON.parse(jsonMatch[0]);
            return mindMapData;

        } catch (error) {
            console.error('AI 生成失败，切换到离线演示模式:', error);
            // 网络失败时自动使用离线模式
            return this.getDemoMindMap(question);
        }
    }

    /**
     * 为节点生成子分支
     * @param {string} nodeText - 节点文本
     * @param {string} context - 上下文（整个问题链）
     * @returns {Promise<Array>} - 子分支数组
     */
    async expandNode(nodeText, context = '') {
        // 如果没有 API Key，使用离线扩展
        if (!this.hasApiKey()) {
            return this.getDemoNodeExpansion(nodeText);
        }

        const prompt = `你是「灵感本」，但必须严格围绕母节点展开，不能偏离。

【母节点】：${nodeText}
${context ? `【原话题】：${context}` : ''}

【核心规则 - 必须遵守】
子节点必须是母节点的：
- 原因/机制："为什么会这样？"
- 证据/数据："有什么支撑？"
- 案例/现象："在哪里能看到？"
- 影响/结果："导致了什么？"
- 延伸/细节："展开说说"

【严禁】
- 不能跳到无关话题
- 不能为了意外而意外
- 不能生成与母节点无关的内容
- 每个子节点必须能回答："这和母节点有什么关系？"

【内容要求】
- 3-6个子节点，每个≤40字
- 包含具体数据："67%"、"1997年"、"18分钟"
- 有冷知识，但必须相关
- 语言有点文学、有点冷、不说教

【示例1 - 正确】
母节点："🧠 大脑以为明天的你是陌生人"
子节点（每个都是母节点的展开）：
[
  {"text": "fMRI显示：想象未来自己时，大脑区域和想陌生人一样", "children": []},
  {"text": "时间折扣率33%/年，给未来打7折", "children": []},
  {"text": "前额叶25岁才成熟，之前用爬行脑决策", "children": []},
  {"text": "松鼠折扣率5%，比人类有远见", "children": []},
  {"text": "所以健身卡、存钱计划总在骗未来的陌生人", "children": []}
]

【示例2 - 正确】
母节点："意志力每小时衰减15%，像手机电量条"
子节点（每个都在解释"为什么像手机电量"）：
[
  {"text": "早晨意志力100%，下午只剩30%", "children": []},
  {"text": "每次决策消耗2%葡萄糖", "children": []},
  {"text": "以色列法官：饭前假释率0%，饭后65%", "children": []},
  {"text": "大脑能量储备有限，用完就得充电（睡觉）", "children": []},
  {"text": "所以重要决策要放早上做", "children": []}
]

【示例3 - 错误示范】
母节点："意志力每小时衰减15%"
❌ 错误的子节点（偏离主题）：
- "爱因斯坦每天穿同样的衣服" （无关）
- "古希腊哲学家的时间观" （偏题）
- "量子力学的不确定性原理" （瞎扯）

现在为【${nodeText}】生成子节点。

记住：
- 每个子节点必须是母节点的直接展开
- 3-6个，每个≤40字
- 有数据、有料、不偏离
- 语言有点冷有点野，但逻辑清晰

输出JSON数组：
[{"text": "...", "children": []}, ...]`;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1000,
                    temperature: 0.8, // 增加随机性和多样性
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API 调用失败: ${response.status}`);
            }

            const data = await response.json();
            const content = data.content[0].text;

            // 提取 JSON 数组
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return this.getDemoNodeExpansion(nodeText);
            }

            return JSON.parse(jsonMatch[0]);

        } catch (error) {
            console.error('节点展开失败，使用离线模式:', error);
            return this.getDemoNodeExpansion(nodeText);
        }
    }

    /**
     * 离线模式的节点扩展 - 实质性知识展开
     */
    getDemoNodeExpansion(nodeText) {
        // 根据节点内容提供具体的知识展开，而非框架词
        const knowledgeTemplates = [
            [
                { text: "这是心理学中的认知偏差", children: [] },
                { text: "大脑的默认模式网络在起作用", children: [] },
                { text: "神经科学研究发现前额叶活跃度降低", children: [] },
                { text: "行为经济学称之为现状偏见", children: [] }
            ],
            [
                { text: "进化心理学的视角：基因的生存策略", children: [] },
                { text: "社会学研究：群体行为的影响", children: [] },
                { text: "斯坦福监狱实验揭示了类似现象", children: [] },
                { text: "文化差异：东亚vs西方的不同表现", children: [] }
            ],
            [
                { text: "神经递质多巴胺和血清素的作用", children: [] },
                { text: "压力激素皮质醇水平升高3倍", children: [] },
                { text: "海马体负责记忆编码", children: [] },
                { text: "杏仁核触发情绪反应", children: [] }
            ],
            [
                { text: "历史上1929年大萧条时也出现过", children: [] },
                { text: "日本泡沫经济破裂后的20年", children: [] },
                { text: "北欧模式：瑞典的全民福利实验", children: [] },
                { text: "中国改革开放后的路径选择", children: [] }
            ],
            [
                { text: "麻省理工学院的追踪研究", children: [] },
                { text: "《自然》杂志2020年发表的论文", children: [] },
                { text: "诺贝尔经济学奖得主丹尼尔·卡尼曼的研究", children: [] },
                { text: "哈佛大学75年追踪调查的结论", children: [] }
            ]
        ];

        // 随机返回一个模板
        return knowledgeTemplates[Math.floor(Math.random() * knowledgeTemplates.length)];
    }

    /**
     * 获取随机话题（具体、有立场、涵盖多领域）
     */
    async getRandomQuestion() {
        const topics = [
            // 科技与社会
            "AI大模型是否会取代大部分白领工作？",
            "社交媒体算法推荐正在制造信息茧房",
            "996工作制应该被法律明令禁止吗？",
            "电动车是否真的比燃油车更环保？",
            "ChatGPT等AI工具是提高生产力还是降低思考能力？",
            "短视频正在摧毁年轻人的专注力",
            "远程办公是未来趋势还是效率陷阱？",

            // 教育与成长
            "高考制度是相对公平还是阶层固化的工具？",
            "内卷化竞争对社会发展是利是弊？",
            "职业教育和学术教育应该平等对待吗？",
            "家长是否应该限制孩子使用电子设备？",
            "考研热背后反映了什么社会问题？",

            // 经济与职场
            "年轻人躺平是理性选择还是逃避现实？",
            "共享经济是创新还是资本对劳动力的新剥削？",
            "房价高企的根本原因是什么？",
            "副业刚需时代，全职工作还有价值吗？",
            "消费主义如何操控我们的欲望？",

            // 文化与价值观
            "传统文化复兴是真需求还是商业包装？",
            "网络暴力的根源是匿名性还是人性？",
            "佛系青年是智慧还是消极？",
            "原生家庭对一个人的影响有多大？",
            "精英教育和平民教育的鸿沟在哪里？",

            // 健康与生活
            "过度医疗在中国有多严重？",
            "健身文化是健康意识觉醒还是身材焦虑营销？",
            "抑郁症为何在年轻群体中高发？",
            "外卖和快餐如何改变了中国人的饮食习惯？",

            // 环境与可持续发展
            "碳中和目标能否真正实现？",
            "垃圾分类在中国为什么难以推行？",
            "新能源汽车的普及会带来哪些新问题？",

            // 社会现象
            "低生育率背后的深层原因是什么？",
            "网红经济是泡沫还是新业态？",
            "相亲市场为何如此功利化？",
            "大城市的年轻人为什么越来越晚婚？",
            "老龄化社会中国准备好了吗？",

            // 国际与政治
            "中美科技竞争的本质是什么？",
            "全球化是在倒退还是在重构？",
            "气候变化是科学问题还是政治问题？",

            // 哲学与思考
            "为什么越努力越焦虑？",
            "社交媒体时代，隐私还存在吗？",
            "人工智能会产生意识吗？",
            "自由意志是幻觉吗？",
            "技术进步是否让人更幸福？"
        ];

        return topics[Math.floor(Math.random() * topics.length)];
    }

    /**
     * 离线演示模式 - 实质性回答的思维导图数据
     */
    getDemoMindMap(question) {
        const demoData = {
            "为什么人们会拖延？": {
                text: "为什么人们会拖延？",
                children: [
                    {
                        text: "大脑优先即时奖励而非长期利益",
                        children: [
                            { text: "边缘系统主导决策", children: [] },
                            { text: "未来的自己感觉像陌生人", children: [] },
                            { text: "时间折扣效应：未来价值被打折", children: [] }
                        ]
                    },
                    {
                        text: "害怕失败所以逃避开始",
                        children: [
                            { text: "完美主义作祟", children: [] },
                            { text: "自我价值感与表现绑定", children: [] },
                            { text: "心理防御机制", children: [] }
                        ]
                    },
                    {
                        text: "任务太大不知从何下手",
                        children: [
                            { text: "缺乏明确的第一步", children: [] },
                            { text: "目标模糊导致焦虑", children: [] }
                        ]
                    },
                    {
                        text: "意志力是有限资源",
                        children: [
                            { text: "决策疲劳消耗意志力", children: [] },
                            { text: "自控力在一天中递减", children: [] }
                        ]
                    },
                    {
                        text: "环境充满诱惑和干扰",
                        children: [
                            { text: "手机通知随时打断", children: [] },
                            { text: "低阻力活动更吸引人", children: [] }
                        ]
                    }
                ]
            },
            "如何定义成功？": {
                text: "如何定义成功？",
                children: [
                    {
                        text: "成功是主观的自我实现",
                        children: [
                            { text: "每个人的价值观不同", children: [] },
                            { text: "外界标准未必适合自己", children: [] },
                            { text: "内心的满足感更重要", children: [] }
                        ]
                    },
                    {
                        text: "社会层面的成功标志",
                        children: [
                            { text: "财富与地位", children: [] },
                            { text: "影响力与认可", children: [] },
                            { text: "但这些会随时代变化", children: [] }
                        ]
                    },
                    {
                        text: "成功可能是一种过程而非终点",
                        children: [
                            { text: "持续成长比到达目标重要", children: [] },
                            { text: "享受过程本身", children: [] }
                        ]
                    },
                    {
                        text: "关系质量也是成功的一部分",
                        children: [
                            { text: "深度连接的质量", children: [] },
                            { text: "对他人的积极影响", children: [] }
                        ]
                    },
                    {
                        text: "反思：成功的定义会改变吗？",
                        children: [
                            { text: "年轻时vs年老时", children: [] },
                            { text: "经历重大事件后", children: [] }
                        ]
                    }
                ]
            },
            "什么是真正的自由？": {
                text: "什么是真正的自由？",
                children: [
                    {
                        text: "消极自由：免于外界干涉",
                        children: [
                            { text: "不被他人强迫", children: [] },
                            { text: "有选择的权利", children: [] }
                        ]
                    },
                    {
                        text: "积极自由：自我主宰的能力",
                        children: [
                            { text: "不被欲望控制", children: [] },
                            { text: "理性决策的能力", children: [] },
                            { text: "摆脱恐惧与焦虑", children: [] }
                        ]
                    },
                    {
                        text: "经济自由是基础",
                        children: [
                            { text: "财务独立", children: [] },
                            { text: "时间的自主权", children: [] }
                        ]
                    },
                    {
                        text: "悖论：绝对自由导致选择瘫痪",
                        children: [
                            { text: "约束创造自由", children: [] },
                            { text: "框架让选择变得可能", children: [] }
                        ]
                    },
                    {
                        text: "真正自由的人不需要追求自由",
                        children: [
                            { text: "接纳现实本身就是自由", children: [] },
                            { text: "内心的自由更重要", children: [] }
                        ]
                    }
                ]
            }
        };

        // 返回对应的数据，或随机一个
        if (demoData[question]) {
            return demoData[question];
        }

        // 如果问题不在预设中，返回针对具体话题的实质性回答
        // 根据问题关键词匹配返回

        if (question.includes('AI') || question.includes('人工智能')) {
            return {
                text: question,
                children: [
                    { text: "AI会取代重复性、规则性强的工作", children: [
                        { text: "数据分析、文案撰写、客服等", children: [] },
                        { text: "但创意、情感、决策仍需人类", children: [] }
                    ]},
                    { text: "技术性失业与新岗位创造并存", children: [
                        { text: "历史上每次技术革命都如此", children: [] },
                        { text: "关键是转型速度能否跟上", children: [] }
                    ]},
                    { text: "教育体系需要根本性变革", children: [
                        { text: "从知识记忆转向创造力培养", children: [] },
                        { text: "终身学习成为必需", children: [] }
                    ]},
                    { text: "社会保障体系面临挑战", children: [
                        { text: "全民基本收入的讨论", children: [] },
                        { text: "工作意义的重新定义", children: [] }
                    ]}
                ]
            };
        }

        if (question.includes('躺平') || question.includes('内卷')) {
            return {
                text: question,
                children: [
                    { text: "是对过度竞争的理性反抗", children: [
                        { text: "996、学历通胀、房价高企", children: [] },
                        { text: "努力与回报严重不成正比", children: [] }
                    ]},
                    { text: "反映阶层流动渠道收窄", children: [
                        { text: "教育、户口、资源高度集中", children: [] },
                        { text: "普通人上升空间被压缩", children: [] }
                    ]},
                    { text: "消费主义陷阱的觉醒", children: [
                        { text: "拒绝被欲望绑架", children: [] },
                        { text: "追求简单生活的自由", children: [] }
                    ]},
                    { text: "但长期躺平也有代价", children: [
                        { text: "技能退化、社会参与度降低", children: [] },
                        { text: "需要在奋斗与躺平间找平衡", children: [] }
                    ]}
                ]
            };
        }

        if (question.includes('高考') || question.includes('教育')) {
            return {
                text: question,
                children: [
                    { text: "相对公平但不完美", children: [
                        { text: "至少给了农村孩子改变命运的机会", children: [] },
                        { text: "但城乡教育资源差距巨大", children: [] }
                    ]},
                    { text: "唯分数论扼杀创造力", children: [
                        { text: "应试教育忽视个性发展", children: [] },
                        { text: "学生成为做题机器", children: [] }
                    ]},
                    { text: "中产阶级通过学区房绕过竞争", children: [
                        { text: "教育投入成为新的阶层壁垒", children: [] },
                        { text: "补课产业加剧教育不公", children: [] }
                    ]},
                    { text: "改革方向：多元评价体系", children: [
                        { text: "但如何防止权力寻租是难题", children: [] },
                        { text: "素质教育在中国水土不服？", children: [] }
                    ]}
                ]
            };
        }

        // 默认通用回答
        return {
            text: question,
            children: [
                {
                    text: "这个话题涉及多方利益博弈",
                    children: [
                        { text: "政府、企业、个人立场不同", children: [] },
                        { text: "短期利益vs长期发展的矛盾", children: [] }
                    ]
                },
                {
                    text: "表面现象背后的深层原因",
                    children: [
                        { text: "经济结构、文化传统、制度设计", children: [] },
                        { text: "全球化背景下的本土困境", children: [] }
                    ]
                },
                {
                    text: "国际经验可以借鉴但不能照搬",
                    children: [
                        { text: "发达国家的教训", children: [] },
                        { text: "中国特色与普遍规律", children: [] }
                    ]
                },
                {
                    text: "普通人如何应对？",
                    children: [
                        { text: "理解大势、调整预期", children: [] },
                        { text: "在变局中寻找个人机会", children: [] }
                    ]
                }
            ]
        };
    }
}
