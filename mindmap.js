/**
 * 成熟美学思维导图渲染引擎
 * 低饱和度 × 液态流动 × 主题色彩动态
 */

class MindMapRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true // 提升性能
        });

        // 像素级渲染优化
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.nodes = [];
        this.particles = [];
        this.animationId = null;

        // 当前主题色系
        this.currentTheme = this.getThemeForQuestion('default');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 使用 rect 的值作为中心点
        const rect = this.canvas.getBoundingClientRect();
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;

        // 相机系统 - 分形式跟随
        this.camera = {
            x: 0,           // 相机位置
            y: 0,
            targetX: 0,     // 目标位置
            targetY: 0,
            zoom: 1,        // 缩放级别
            targetZoom: 1,  // 目标缩放
            focusNode: null // 当前聚焦的节点
        };

        // 拖拽状态
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCameraX = 0;
        this.dragStartCameraY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // 动画参数
        this.time = 0;
        this.clickCallback = null;

        // 背景星尘
        this.stardust = [];
        this.initStardust();

        // 初始化拖拽控制
        this.initDragControls();
    }

    /**
     * 初始化拖拽控制
     */
    initDragControls() {
        // 鼠标拖拽
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartCameraX = this.camera.targetX;
            this.dragStartCameraY = this.camera.targetY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;

                // 根据缩放级别调整拖拽灵敏度
                this.camera.targetX -= deltaX / this.camera.zoom;
                this.camera.targetY -= deltaY / this.camera.zoom;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            const dragDistance = Math.sqrt(
                Math.pow(e.clientX - this.dragStartX, 2) +
                Math.pow(e.clientY - this.dragStartY, 2)
            );

            // 如果拖拽距离小于5px，视为点击
            if (dragDistance < 5) {
                this.handleClick(e);
            }

            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // 触摸拖拽
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
                this.dragStartCameraX = this.camera.targetX;
                this.dragStartCameraY = this.camera.targetY;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                e.preventDefault();
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;

                this.camera.targetX -= deltaX / this.camera.zoom;
                this.camera.targetY -= deltaY / this.camera.zoom;

                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const dragDistance = Math.sqrt(
                    Math.pow(e.changedTouches[0].clientX - this.dragStartX, 2) +
                    Math.pow(e.changedTouches[0].clientY - this.dragStartY, 2)
                );

                if (dragDistance < 5) {
                    this.handleClick(e.changedTouches[0]);
                }
            }

            this.isDragging = false;
        });

        // 鼠标滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.5, Math.min(3, this.camera.targetZoom * zoomFactor));

            // 计算鼠标位置在世界坐标中的点
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.centerX) / this.camera.zoom + this.camera.x;
            const worldY = (mouseY - this.centerY) / this.camera.zoom + this.camera.y;

            // 调整相机位置，使缩放中心在鼠标位置
            this.camera.targetX = worldX - (mouseX - this.centerX) / newZoom;
            this.camera.targetY = worldY - (mouseY - this.centerY) / newZoom;
            this.camera.targetZoom = newZoom;
        }, { passive: false });

        // 默认鼠标样式
        this.canvas.style.cursor = 'grab';
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // 设置实际大小（考虑设备像素比）
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // 设置显示大小
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // 缩放上下文以匹配设备像素比
        this.ctx.scale(dpr, dpr);

        // 重新应用渲染优化
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
    }

    /**
     * 根据问题关键词分析主题类型并返回色系
     */
    getThemeForQuestion(question) {
        const lowerQ = question.toLowerCase();

        // 哲学/思考类 - 深蓝紫
        if (lowerQ.match(/为什么|哲学|思考|意义|本质|存在|真理/)) {
            return {
                name: 'philosophy',
                primary: 'rgba(88, 94, 118, 0.4)',
                secondary: 'rgba(78, 84, 112, 0.3)',
                accent: 'rgba(98, 104, 138, 0.5)',
                particle: 'rgba(150, 156, 180, 0.6)',
                particleDim: 'rgba(120, 126, 160, 0.4)'
            };
        }

        // 情感/关系类 - 深紫红
        if (lowerQ.match(/情感|关系|爱|孤独|友谊|亲密|感受/)) {
            return {
                name: 'emotion',
                primary: 'rgba(98, 84, 98, 0.4)',
                secondary: 'rgba(88, 78, 92, 0.3)',
                accent: 'rgba(108, 94, 108, 0.5)',
                particle: 'rgba(168, 152, 172, 0.6)',
                particleDim: 'rgba(138, 126, 148, 0.4)'
            };
        }

        // 科学/理性类 - 深蓝灰
        if (lowerQ.match(/科学|理性|逻辑|分析|研究|系统/)) {
            return {
                name: 'science',
                primary: 'rgba(84, 94, 102, 0.4)',
                secondary: 'rgba(74, 84, 92, 0.3)',
                accent: 'rgba(94, 104, 112, 0.5)',
                particle: 'rgba(152, 164, 176, 0.6)',
                particleDim: 'rgba(126, 138, 152, 0.4)'
            };
        }

        // 艺术/创意类 - 深紫灰
        if (lowerQ.match(/艺术|创意|创造|美|想象|设计/)) {
            return {
                name: 'creative',
                primary: 'rgba(92, 86, 102, 0.4)',
                secondary: 'rgba(82, 78, 92, 0.3)',
                accent: 'rgba(102, 96, 112, 0.5)',
                particle: 'rgba(162, 154, 176, 0.6)',
                particleDim: 'rgba(132, 126, 152, 0.4)'
            };
        }

        // 默认 - 中性灰蓝
        return {
            name: 'default',
            primary: 'rgba(88, 92, 102, 0.4)',
            secondary: 'rgba(78, 82, 92, 0.3)',
            accent: 'rgba(98, 102, 112, 0.5)',
            particle: 'rgba(180, 184, 198, 0.6)',
            particleDim: 'rgba(150, 154, 168, 0.4)'
        };
    }

    /**
     * 更新页面主题色
     */
    updatePageTheme(theme) {
        document.documentElement.style.setProperty('--theme-primary', theme.primary);
        document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
        document.documentElement.style.setProperty('--theme-accent', theme.accent);
        document.documentElement.style.setProperty('--particle-light', theme.particle);
        document.documentElement.style.setProperty('--particle-dim', theme.particleDim);
    }

    /**
     * 初始化背景星尘
     */
    initStardust() {
        const count = 80;
        for (let i = 0; i < count; i++) {
            this.stardust.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.2 + 0.3,
                speed: Math.random() * 0.2 + 0.05,
                alpha: Math.random() * 0.2 + 0.05
            });
        }
    }

    /**
     * 设置思维导图数据
     */
    setData(data, question = '') {
        this.nodes = [];
        this.particles = [];

        // 重置相机
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        this.camera.zoom = 1;
        this.camera.targetZoom = 1;
        this.camera.focusNode = null;

        if (!data) return;

        // 根据问题更新主题色
        this.currentTheme = this.getThemeForQuestion(question || data.text);
        this.updatePageTheme(this.currentTheme);

        // 创建中心节点
        const centerNode = {
            text: data.text,
            x: this.centerX,
            y: this.centerY,
            targetX: this.centerX,
            targetY: this.centerY,
            radius: 0,
            targetRadius: 10, // 不用于渲染，仅用于内部计算
            level: 0,
            children: data.children || [],
            expanded: false,
            alpha: 0,
            rotation: 0
        };

        this.nodes.push(centerNode);

        // 开局只显示一个节点，不自动展开
        // 用户需要点击中心节点才会展开子节点
        this.focusOnNode(centerNode);

        if (!this.animationId) {
            this.animate();
        }
    }

    /**
     * 展开节点 - 树状结构，避免文字重叠
     */
    expandNode(node) {
        if (node.expanded || !node.children || node.children.length === 0) {
            return;
        }

        node.expanded = true;
        const childCount = node.children.length;

        // 树状布局参数 - 增大间距避免重叠
        let baseDistance = 160; // 增加距离（之前120）
        let verticalSpacing = 100;

        // 根节点特殊处理：第一层子节点放射分布
        if (node.level === 0) {
            baseDistance = 220; // 增加根节点子节点距离（之前180）
            const angleStep = (Math.PI * 2) / childCount;

            node.children.forEach((childData, index) => {
                const angle = angleStep * index - Math.PI / 2;
                const targetX = node.x + Math.cos(angle) * baseDistance;
                const targetY = node.y + Math.sin(angle) * baseDistance;

                const childNode = {
                    text: childData.text,
                    x: node.x,
                    y: node.y,
                    targetX: targetX,
                    targetY: targetY,
                    radius: 0,
                    targetRadius: 10,
                    level: node.level + 1,
                    parent: node,
                    children: childData.children || [],
                    expanded: false,
                    alpha: 0,
                    rotation: Math.random() * Math.PI * 2,
                    branchAngle: angle
                };

                this.nodes.push(childNode);
                this.createLiquidParticles(node, childNode);
            });
        } else {
            // 非根节点：树状分支布局，扇形角度更大
            let parentAngle;
            if (node.parent) {
                parentAngle = Math.atan2(node.y - node.parent.y, node.x - node.parent.x);
            } else {
                parentAngle = node.branchAngle || 0;
            }

            // 子节点在父节点方向的扇形区域内展开（加大角度避免重叠）
            const spreadAngle = Math.PI / 2.2; // 扩大到约80度（之前60度）
            const startAngle = parentAngle - spreadAngle / 2;

            node.children.forEach((childData, index) => {
                let angle;
                if (childCount === 1) {
                    angle = parentAngle;
                } else {
                    // 均匀分布在扇形区域内
                    angle = startAngle + (spreadAngle / (childCount - 1)) * index;
                }

                // 根据文字长度动态调整距离
                const textLength = childData.text.length;
                const dynamicDistance = baseDistance + Math.min(textLength * 0.3, 40);

                const targetX = node.x + Math.cos(angle) * dynamicDistance;
                const targetY = node.y + Math.sin(angle) * dynamicDistance;

                const childNode = {
                    text: childData.text,
                    x: node.x,
                    y: node.y,
                    targetX: targetX,
                    targetY: targetY,
                    radius: 0,
                    targetRadius: 10,
                    level: node.level + 1,
                    parent: node,
                    children: childData.children || [],
                    expanded: false,
                    alpha: 0,
                    rotation: Math.random() * Math.PI * 2,
                    branchAngle: angle
                };

                this.nodes.push(childNode);
                this.createLiquidParticles(node, childNode);
            });
        }

        // 相机跟随到当前节点并放大
        this.focusOnNode(node);
    }

    /**
     * 相机聚焦到节点 - 精确版
     */
    focusOnNode(node) {
        // 计算基于层级的缩放
        const zoomLevel = 1 + node.level * 0.15;

        // 将节点精确移动到屏幕中心
        this.camera.targetX = node.x;
        this.camera.targetY = node.y;
        this.camera.targetZoom = Math.min(zoomLevel, 2.5);
        this.camera.focusNode = node;
    }

    /**
     * 创建液态粒子 - 星辰爆炸，简约
     */
    createLiquidParticles(from, to) {
        const particleCount = 6; // 更少的粒子，更简约
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                from,
                to,
                progress: Math.random(),
                speed: 0.004 + Math.random() * 0.006, // 更快的速度
                size: 0.5 + Math.random() * 0.6, // 更小更细腻
                type: Math.random() > 0.5 ? 'light' : 'dim',
                oscillation: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * 动画循环 - 灵动果冻感
     */
    animate() {
        this.time += 0.006;

        // 快速清除，更灵动（星辰爆炸效果）
        this.ctx.fillStyle = 'rgba(14, 15, 20, 0.35)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新相机 - 平滑跟随
        this.updateCamera();

        // 保存原始状态
        this.ctx.save();

        // 应用相机变换
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 绘制内容
        this.drawStardust();
        this.updateParticles();
        this.drawParticles();
        this.updateNodes();
        this.drawNodes();

        // 恢复状态
        this.ctx.restore();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 更新相机 - 灵动跟随
     */
    updateCamera() {
        // 更快的响应速度，更灵动
        const easing = this.isDragging ? 0.25 : 0.08;

        this.camera.x += (this.camera.targetX - this.camera.x) * easing;
        this.camera.y += (this.camera.targetY - this.camera.y) * easing;
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * easing;
    }

    /**
     * 绘制星尘
     */
    drawStardust() {
        this.stardust.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }

            const twinkle = Math.sin(this.time * 1.5 + star.x) * 0.4 + 0.6;
            this.ctx.fillStyle = `rgba(235, 237, 242, ${star.alpha * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * 更新节点 - 果冻弹性，快速尘埃聚合
     */
    updateNodes() {
        this.nodes.forEach(node => {
            // 更快的缓动，果冻弹性效果
            const easing = 0.12;
            node.x += (node.targetX - node.x) * easing;
            node.y += (node.targetY - node.y) * easing;
            node.radius += (node.targetRadius - node.radius) * easing;

            if (node.alpha < 1) {
                node.alpha += 0.05; // 更快出现，快速聚合
            }

            node.rotation += 0.005;
        });
    }

    /**
     * 根据层级获取颜色方案 - 苹果级高级配色
     */
    getColorForLevel(level) {
        const colors = [
            // 第0层（中心）- 高级灰白
            {
                text: 'rgba(235, 237, 242, 0.98)',
                glow: 'rgba(235, 237, 242, 0.15)',
                shadow: 'rgba(235, 237, 242, 0.08)'
            },
            // 第1层 - 清冷灰蓝
            {
                text: 'rgba(162, 174, 192, 0.95)',
                glow: 'rgba(162, 174, 192, 0.12)',
                shadow: 'rgba(162, 174, 192, 0.06)'
            },
            // 第2层 - 优雅灰紫
            {
                text: 'rgba(178, 170, 195, 0.95)',
                glow: 'rgba(178, 170, 195, 0.12)',
                shadow: 'rgba(178, 170, 195, 0.06)'
            },
            // 第3层 - 柔和灰粉
            {
                text: 'rgba(198, 178, 188, 0.95)',
                glow: 'rgba(198, 178, 188, 0.12)',
                shadow: 'rgba(198, 178, 188, 0.06)'
            },
            // 第4层 - 清新灰绿
            {
                text: 'rgba(170, 190, 182, 0.95)',
                glow: 'rgba(170, 190, 182, 0.12)',
                shadow: 'rgba(170, 190, 182, 0.06)'
            },
            // 第5层 - 温暖灰米
            {
                text: 'rgba(195, 188, 175, 0.95)',
                glow: 'rgba(195, 188, 175, 0.12)',
                shadow: 'rgba(195, 188, 175, 0.06)'
            },
            // 第6层+ - 中性高级灰
            {
                text: 'rgba(180, 182, 185, 0.95)',
                glow: 'rgba(180, 182, 185, 0.12)',
                shadow: 'rgba(180, 182, 185, 0.06)'
            }
        ];

        return colors[Math.min(level, colors.length - 1)];
    }

    /**
     * 绘制节点 - 苹果级像素风文字，微弱光晕，支持长文本
     */
    drawNodes() {
        this.nodes.forEach(node => {
            if (node.alpha < 0.05) return;

            this.ctx.save();

            // 获取层级颜色
            const colorScheme = this.getColorForLevel(node.level);

            // 文字大小根据缩放和层级自适应
            const baseFontSize = Math.max(10, 14 - node.level * 0.4);
            const fontSize = baseFontSize / Math.max(this.camera.zoom, 1);

            // 苹果风格字体：SF Pro + 抗锯齿优化
            this.ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            let text = node.text;
            // 根据字符类型智能截断：中文40字，英文80字符
            const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
            const maxLength = chineseCount > 20 ? 50 : 80;

            if (text.length > maxLength) {
                text = text.substring(0, maxLength) + '...';
            }

            const textX = node.x;
            const textY = node.y;

            // 尘埃组合效果：快速聚合
            const dustProgress = Math.min(node.alpha * 2, 1);
            const scatterAmount = (1 - dustProgress) * 2;

            // 1. 极微弱的外层光晕（几乎不可见）
            this.ctx.globalAlpha = node.alpha * 0.08;
            this.ctx.fillStyle = colorScheme.glow;
            this.ctx.shadowColor = colorScheme.glow;
            this.ctx.shadowBlur = 8 / this.camera.zoom;
            this.ctx.fillText(text, textX + scatterAmount, textY);

            // 2. 主文字（清晰锐利，像素级精致）
            this.ctx.globalAlpha = node.alpha;
            this.ctx.fillStyle = colorScheme.text;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            // 像素级渲染：启用亚像素抗锯齿
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';

            this.ctx.fillText(text, textX, textY);

            this.ctx.restore();
        });
    }

    /**
     * 更新粒子 - 快速灵动
     */
    updateParticles() {
        this.particles.forEach(particle => {
            particle.progress += particle.speed;
            particle.oscillation += 0.025; // 更快的波动

            if (particle.progress > 1) {
                particle.progress = 0;
            }
        });
    }

    /**
     * 绘制粒子 - 层级高级灰
     */
    drawParticles() {
        this.particles.forEach(particle => {
            const from = particle.from;
            const to = particle.to;

            if (!from || !to || Math.min(from.alpha, to.alpha) < 0.1) return;

            // 使用目标节点的层级颜色
            const colorScheme = this.getColorForLevel(to.level);

            // 贝塞尔曲线
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const controlOffset = 25;
            const angle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;
            const controlX = midX + Math.cos(angle) * controlOffset;
            const controlY = midY + Math.sin(angle) * controlOffset;

            const t = particle.progress;
            const x = Math.pow(1 - t, 2) * from.x +
                     2 * (1 - t) * t * controlX +
                     Math.pow(t, 2) * to.x;
            const y = Math.pow(1 - t, 2) * from.y +
                     2 * (1 - t) * t * controlY +
                     Math.pow(t, 2) * to.y;

            const oscillation = Math.sin(particle.oscillation) * 0.8;
            const baseAlpha = Math.min(from.alpha, to.alpha) * 0.25; // 更低调
            const fadeInOut = Math.sin(particle.progress * Math.PI);
            const alpha = baseAlpha * fadeInOut;

            // 使用文字颜色作为粒子颜色
            const color = colorScheme.text;

            // 微小光晕
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, particle.size * 1.2);

            // 提取颜色并应用透明度
            const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            const colorRgba = colorMatch
                ? `rgba(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]}, ${alpha})`
                : `rgba(180, 182, 185, ${alpha})`;

            gradient.addColorStop(0, colorRgba);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x + oscillation, y, particle.size * 1.2, 0, Math.PI * 2);
            this.ctx.fill();

            // 核心点
            this.ctx.fillStyle = colorRgba;
            this.ctx.beginPath();
            this.ctx.arc(x + oscillation, y, particle.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * 清除
     */
    clear() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.nodes = [];
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 处理点击事件（从拖拽检测中调用）
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX || e.pageX) - rect.left;
        const canvasY = (e.clientY || e.pageY) - rect.top;

        // 将屏幕坐标转换为世界坐标
        const worldX = (canvasX - this.centerX) / this.camera.zoom + this.camera.x;
        const worldY = (canvasY - this.centerY) / this.camera.zoom + this.camera.y;

        // 查找点击的节点（基于文字范围）
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];

            // 估算文字范围
            const baseFontSize = Math.max(12, 16 - node.level);
            const fontSize = baseFontSize / Math.max(this.camera.zoom, 1);
            const textWidth = node.text.length * fontSize * 0.6;
            const textHeight = fontSize * 2; // 增加点击区域

            // 检测点击是否在文字范围内
            const inX = Math.abs(worldX - node.x) < textWidth / 2;
            const inY = Math.abs(worldY - node.y) < textHeight / 2;

            if (inX && inY) {
                if (this.clickCallback) {
                    this.clickCallback(node);
                }
                this.expandNode(node);
                break;
            }
        }
    }

    /**
     * 节点点击回调（保留向后兼容）
     */
    onNodeClick(callback) {
        this.clickCallback = callback;
    }
}
