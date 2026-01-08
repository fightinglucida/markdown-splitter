const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

createApp({
    setup() {
        if (typeof marked !== 'undefined' && marked && typeof marked.setOptions === 'function') {
            marked.setOptions({
                gfm: true,
                breaks: false,
                headerIds: false,
                mangle: false
            });
        }
        const leftTab = ref('content');
        const markdownInput = ref(`# 探索林书卡片

这是一款专为自媒体内容创作者设计的卡片生成工具。

## 核心优势
- **固定画布**：严格遵循比例，不随内容伸缩，适配各大平台
- **三列布局**：沉浸式编辑体验，左侧修改右侧实时预览
- **自动分页**：长文智能切割，多页卡片风格高度统一

### 快速开始
1. 在左侧输入您的 Markdown 文本
2. 在右侧“模板”栏切换主题
3. 点击右上角“导出”按钮，一键打包下载

---
这是第二页的内容，演示自动分页效果。您可以继续在这里书写您的干货内容。`);

        const config = ref({
            // Content
            title: '探索林书卡片',
            coverImage: '', // DataURL, only used by modern theme page 1
            
            // Author Badge
            showAuthor: true,
            authorNickname: '林书',
            authorUsername: '@LinshuTech',
            authorAvatar: '', // DataURL or empty
            socialIcon: '', // Selected social media icon
            
            // Time & Page
            showTime: false,
            timeFormat: 'YYYY-MM-DD',
            showPageNumber: true,
            pageNumberFormat: 'number', // 1 / n
            
            // Watermark
            showWatermark: true,
            watermarkText: '林书卡片',

            // Style
            ratio: '1:1',
            theme: 'modern',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 48,
            borderRadius: 24,
            fontFamily: 'Inter',
            textAlign: 'left'
        });

        // 主题数据 - JSON 字符串内联作为 file:// 回退，优先从 themes/*.json 覆盖
        const builtInThemes = JSON.parse(String.raw`{
    "dark": {
        "name": "深邃黑",
        "preview": {
            "description": "神秘优雅，适合科技和设计",
            "features": [
                "深色背景",
                "半透明",
                "高对比"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": true,
                "fontSize": "1.8rem",
                "fontFamily": "Inter",
                "fontWeight": "bold",
                "color": "#f8fafc",
                "textAlign": "left",
                "marginBottom": "2rem"
            },
            "content": {
                "show": true,
                "editable": true,
                "fontSize": "18px",
                "fontFamily": "Inter",
                "color": "#f8fafc",
                "textAlign": "left",
                "lineHeight": "1.7",
                "maxCharsPerLine": 22,
                "backgroundColor": "rgba(0,0,0,0.6)",
                "backdropFilter": "blur(12px)",
                "padding": "48px",
                "borderRadius": "16px"
            },
            "author": {
                "show": true,
                "editable": true,
                "position": "bottom-left",
                "avatarSize": "40px",
                "nicknameSize": "14px",
                "nicknameColor": "#f8fafc",
                "usernameSize": "10px",
                "usernameColor": "#94a3b8",
                "allowCustomAvatar": true,
                "allowSocialIcon": true
            },
            "time": {
                "show": false,
                "editable": true,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "10px",
                "color": "#64748b"
            },
            "pageNumber": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "format": "number",
                "fontSize": "10px",
                "color": "#64748b"
            },
            "watermark": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "text": "林书卡片",
                "fontSize": "10px",
                "color": "#64748b",
                "opacity": 0.5
            },
            "canvas": {
                "background": "#1e1e1e",
                "padding": 48,
                "borderRadius": 24,
                "bgType": "dark"
            }
        }
    },
    "elegant": {
        "name": "优雅衬线",
        "preview": {
            "description": "文学正式，适合长文阅读",
            "features": [
                "白底黑字",
                "衬线字体",
                "标题居中"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": true,
                "fontSize": "2rem",
                "fontFamily": "serif",
                "fontWeight": "bold",
                "color": "#2d3436",
                "textAlign": "center",
                "marginBottom": "2.5rem"
            },
            "content": {
                "show": true,
                "editable": true,
                "fontSize": "20px",
                "fontFamily": "serif",
                "color": "#2d3436",
                "textAlign": "left",
                "lineHeight": "1.8",
                "maxCharsPerLine": 20,
                "backgroundColor": "rgba(255,255,255,0.95)",
                "backdropFilter": "blur(8px)",
                "padding": "60px",
                "borderRadius": "8px"
            },
            "author": {
                "show": true,
                "editable": true,
                "position": "bottom-center",
                "avatarSize": "36px",
                "nicknameSize": "13px",
                "nicknameColor": "#2d3436",
                "usernameSize": "10px",
                "usernameColor": "#636e72",
                "allowCustomAvatar": true,
                "allowSocialIcon": false
            },
            "time": {
                "show": true,
                "editable": true,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "9px",
                "color": "#636e72"
            },
            "pageNumber": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "format": "text",
                "fontSize": "9px",
                "color": "#636e72"
            },
            "watermark": {
                "show": false,
                "editable": false,
                "position": "bottom-right",
                "text": "",
                "fontSize": "9px",
                "color": "#636e72",
                "opacity": 0.3
            },
            "canvas": {
                "background": "#ffffff",
                "padding": 60,
                "borderRadius": 0,
                "bgType": "light"
            }
        }
    },
    "modern": {
        "name": "现代简约",
        "preview": {
            "description": "知识库排版：封面图 + 大标题 + 摘要 + 署名",
            "features": [
                "默认3:4",
                "封面图(仅第一页)",
                "无作者/时间"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": true,
                "fontSize": "36px",
                "fontFamily": "'Noto Sans SC', sans-serif",
                "fontWeight": "900",
                "color": "#1a1a1a",
                "textAlign": "left",
                "marginBottom": "20px",
                "letterSpacing": "0.5px",
                "lineHeight": "1.3"
            },
            "content": {
                "show": true,
                "editable": true,
                "fontSize": "15px",
                "fontFamily": "'Noto Sans SC', sans-serif",
                "fontWeight": "400",
                "color": "#2c2c2c",
                "textAlign": "left",
                "lineHeight": "1.7",
                "maxCharsPerLine": 22,
                "backgroundColor": "transparent",
                "backdropFilter": "none",
                "padding": "0",
                "borderRadius": "0",
                "letterSpacing": "0.3px"
            },
            "author": {
                "show": false,
                "editable": false,
                "position": "none",
                "avatarSize": "0",
                "nicknameSize": "0",
                "nicknameColor": "transparent",
                "usernameSize": "0",
                "usernameColor": "transparent",
                "allowCustomAvatar": false,
                "allowSocialIcon": false
            },
            "time": {
                "show": false,
                "editable": false,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "10px",
                "color": "#94a3b8"
            },
            "pageNumber": {
                "show": false,
                "editable": false,
                "position": "bottom-right",
                "format": "number",
                "fontSize": "10px",
                "color": "#94a3b8"
            },
            "watermark": {
                "show": true,
                "editable": true,
                "position": "bottom-center",
                "text": "赚钱就是把时代的杠杆拉满",
                "fontSize": "12px",
                "color": "#3a3a3a",
                "opacity": 1
            },
            "canvas": {
                "ratio": "3:4",
                "background": "linear-gradient(135deg, #f8956f 0%, #ec6d47 100%)",
                "padding": 0,
                "borderRadius": 0,
                "canvasScale": 80,
                "bgType": "light"
            }
        }
    },
    "scholarly": {
        "name": "书香墨韵",
        "preview": {
            "description": "经典阅读体验，适合长文深度阅读",
            "features": [
                "黑白简约",
                "大字号",
                "荧光强调"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": true,
                "fontSize": "26px",
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
                "fontWeight": "800",
                "color": "#1a1a1a",
                "textAlign": "center",
                "marginBottom": "2rem",
                "borderTop": "3px solid #1a1a1a",
                "borderBottom": "3px solid #1a1a1a",
                "padding": "18px 0",
                "letterSpacing": "3px"
            },
            "content": {
                "show": true,
                "editable": true,
                "fontSize": "18px",
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
                "color": "#2a2a2a",
                "textAlign": "justify",
                "lineHeight": "1.95",
                "maxCharsPerLine": 22,
                "backgroundColor": "#f8f8f8",
                "backdropFilter": "none",
                "padding": "48px",
                "borderRadius": "6px"
            },
            "author": {
                "show": true,
                "editable": true,
                "position": "bottom-left",
                "avatarSize": "40px",
                "nicknameSize": "14px",
                "nicknameColor": "#1a1a1a",
                "usernameSize": "10px",
                "usernameColor": "#404040",
                "allowCustomAvatar": true,
                "allowSocialIcon": true
            },
            "time": {
                "show": true,
                "editable": true,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "10px",
                "color": "#888"
            },
            "pageNumber": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "format": "number",
                "fontSize": "10px",
                "color": "#1a1a1a"
            },
            "watermark": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "text": "书香墨韵",
                "fontSize": "10px",
                "color": "#999",
                "opacity": 0.5
            },
            "canvas": {
                "background": "#ffffff",
                "padding": 48,
                "borderRadius": 0,
                "bgType": "light"
            },
            "markdown": {
                "h2": {
                    "fontSize": "20px",
                    "padding": "0.3em 1em",
                    "borderRadius": "30px",
                    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
                },
                "h3": {
                    "fontSize": "18px",
                    "borderLeft": "5px solid #1a1a1a",
                    "paddingLeft": "20px",
                    "background": "linear-gradient(to right, rgba(26, 26, 26, 0.04), transparent 50%)"
                },
                "strong": {
                    "background": "linear-gradient(to bottom, transparent 65%, rgba(255, 235, 59, 0.7) 65%)",
                    "color": "#1a1a1a"
                },
                "blockquote": {
                    "background": "#f8f8f8",
                    "borderLeft": "5px solid #eee",
                    "color": "#888"
                }
            }
        }
    },
    "teaching": {
        "name": "教学卡片",
        "preview": {
            "description": "教学分享专用，头像强化",
            "features": [
                "蓝色渐变",
                "头像突出",
                "水印左下"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": false,
                "fontSize": "2rem",
                "fontFamily": "AlibabaPuHuiTi, 'Noto Sans SC', sans-serif",
                "fontWeight": "bold",
                "color": "#2c3e50",
                "textAlign": "left",
                "marginBottom": "0",
                "backgroundColor": "#e8eaf0",
                "padding": "20px 24px",
                "borderRadius": "16px 16px 0 0"
            },
            "content": {
                "show": true,
                "editable": false,
                "fontSize": "18px",
                "fontFamily": "MapleMono-NF-CN-Light, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
                "fontWeight": "300",
                "color": "#2d3436",
                "textAlign": "left",
                "lineHeight": "1.7",
                "maxCharsPerLine": 26,
                "backgroundColor": "#ffffff",
                "backdropFilter": "none",
                "padding": "32px",
                "borderRadius": "16px",
                "marginTop": "-12px"
            },
            "author": {
                "show": true,
                "editable": true,
                "position": "top-left",
                "avatarSize": "70px",
                "nicknameSize": "0",
                "nicknameColor": "transparent",
                "usernameSize": "0",
                "usernameColor": "transparent",
                "allowCustomAvatar": true,
                "allowSocialIcon": true
            },
            "time": {
                "show": false,
                "editable": false,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "10px",
                "color": "#94a3b8"
            },
            "pageNumber": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "format": "number",
                "fontSize": "11px",
                "color": "#5a6c7d"
            },
            "watermark": {
                "show": true,
                "editable": true,
                "position": "bottom-left",
                "text": "林书卡片",
                "fontSize": "9px",
                "color": "#94a3b8",
                "opacity": 0.5
            },
            "canvas": {
                "ratio": "3:4",
                "outerBackground": "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                "background": "#3C67B0",
                "padding": 36,
                "borderRadius": 32,
                "canvasScale": 80,
                "bgType": "light",
                "backgroundTarget": "inner",
                "innerPadding": 24,
                "innerRadius": 20,
                "footerPadding": 16,
                "footerSpacing": 12
            }
        },
        "layout": {
            "type": "layered",
            "structure": [
                {
                    "layer": "outer",
                    "element": "background",
                    "editable": true,
                    "description": "外层蓝色渐变边框"
                },
                {
                    "layer": "inner",
                    "element": "container",
                    "editable": false,
                    "description": "浅灰色内部容器"
                },
                {
                    "layer": "title",
                    "element": "header",
                    "editable": false,
                    "description": "标题层（浅灰背景+头像+标题）"
                },
                {
                    "layer": "content",
                    "element": "main",
                    "editable": false,
                    "description": "正文层（白色卡片，向上覆盖）"
                },
                {
                    "layer": "footer",
                    "element": "meta",
                    "editable": true,
                    "description": "底部元信息（水印左+页码右）"
                }
            ]
        },
        "permissions": {
            "title": {
                "toggle": false,
                "edit": false,
                "style": false
            },
            "content": {
                "toggle": false,
                "edit": false,
                "style": false
            },
            "author": {
                "toggle": true,
                "uploadAvatar": true,
                "selectIcon": true,
                "showName": false
            },
            "time": {
                "toggle": false,
                "format": false
            },
            "pageNumber": {
                "toggle": true,
                "format": true
            },
            "watermark": {
                "toggle": true,
                "editText": true
            },
            "canvas": {
                "background": true,
                "padding": true,
                "borderRadius": true,
                "ratio": true
            }
        },
        "design": {
            "colorScheme": {
                "primary": "#4a90e2",
                "secondary": "#357abd",
                "background": "#3C67B0",
                "titleBg": "#e8eaf0",
                "contentBg": "#ffffff",
                "text": "#2c3e50",
                "textSecondary": "#5a6c7d",
                "border": "#ffffff"
            },
            "typography": {
                "titleFont": "AlibabaPuHuiTi",
                "contentFont": "MapleMono-Light",
                "titleSize": "2rem",
                "contentSize": "15px",
                "lineHeight": "1.7"
            },
            "spacing": {
                "outerPadding": 36,
                "innerPadding": 24,
                "contentPadding": 32,
                "titlePadding": "20px 24px"
            },
            "effects": {
                "avatarBorder": "3px solid #ffffff",
                "avatarShadow": "0 4px 6px rgba(0,0,0,0.1)",
                "contentShadow": "0 2px 8px rgba(0,0,0,0.08)",
                "contentOverlap": "-12px"
            }
        }
    },
    "vibrant": {
        "name": "缤纷创意",
        "preview": {
            "description": "彩色渐变，适合创意展示",
            "features": [
                "渐变背景",
                "毛玻璃",
                "高饱和"
            ]
        },
        "config": {
            "title": {
                "show": true,
                "editable": true,
                "fontSize": "1.8rem",
                "fontFamily": "Inter",
                "fontWeight": "bold",
                "color": "#ffffff",
                "textAlign": "left",
                "marginBottom": "2rem"
            },
            "content": {
                "show": true,
                "editable": true,
                "fontSize": "18px",
                "fontFamily": "Inter",
                "color": "#ffffff",
                "textAlign": "left",
                "lineHeight": "1.7",
                "maxCharsPerLine": 22,
                "backgroundColor": "rgba(255,255,255,0.15)",
                "backdropFilter": "blur(20px)",
                "padding": "40px",
                "borderRadius": "24px"
            },
            "author": {
                "show": true,
                "editable": true,
                "position": "bottom-left",
                "avatarSize": "40px",
                "nicknameSize": "14px",
                "nicknameColor": "#ffffff",
                "usernameSize": "10px",
                "usernameColor": "rgba(255,255,255,0.7)",
                "allowCustomAvatar": true,
                "allowSocialIcon": true
            },
            "time": {
                "show": false,
                "editable": true,
                "position": "with-author",
                "format": "YYYY-MM-DD",
                "fontSize": "10px",
                "color": "rgba(255,255,255,0.6)"
            },
            "pageNumber": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "format": "number",
                "fontSize": "10px",
                "color": "rgba(255,255,255,0.6)"
            },
            "watermark": {
                "show": true,
                "editable": true,
                "position": "bottom-right",
                "text": "林书卡片",
                "fontSize": "10px",
                "color": "rgba(255,255,255,0.5)",
                "opacity": 0.5
            },
            "canvas": {
                "background": "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
                "padding": 40,
                "borderRadius": 32,
                "bgType": "dark"
            }
        }
    }
}`);
        const themes = ref(builtInThemes);
        const loadExternalThemes = async () => {
            if (window.location.protocol === 'file:') {
                return; // 直接打开本地文件时保持内置配置，避免 fetch 报错
            }
            const themeKeys = Object.keys(themes.value);
            await Promise.all(themeKeys.map(async (key) => {
                try {
                    const response = await fetch(`./themes/${key}.json`, { cache: 'no-cache' });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const data = await response.json();
                    if (data?.config) {
                        themes.value[key] = data;
                    }
                } catch (error) {
                    console.warn(`主题 ${key} 加载失败，将使用内置配置`, error);
                }
            }));
        };

        // Social icons using inline SVG paths
        const socialIcons = [
            { name: '微信', icon: 'wechat', color: '#09B83E', path: 'M8.5 5c-2.5 0-4.5 1.5-4.5 3.5 0 1.2 0.8 2.3 2 2.9l-0.5 1.6 1.8-0.9c0.4 0.1 0.8 0.2 1.2 0.2 2.5 0 4.5-1.5 4.5-3.5S11 5 8.5 5zm-1 4.8c-0.3 0-0.5-0.2-0.5-0.5s0.2-0.5 0.5-0.5 0.5 0.2 0.5 0.5-0.2 0.5-0.5 0.5zm2 0c-0.3 0-0.5-0.2-0.5-0.5s0.2-0.5 0.5-0.5 0.5 0.2 0.5 0.5-0.2 0.5-0.5 0.5z' },
            { name: 'QQ', icon: 'qq', color: '#12B7F5', path: 'M12 2c-3.3 0-6 2.7-6 6 0 0.8 0.2 1.6 0.5 2.3-1.5 0.5-2.5 1.5-2.5 2.7 0 0.8 0.5 1.5 1.3 2 -0.1 0.3-0.2 0.7-0.2 1 0 1.1 0.9 2 2 2 0.5 0 1-0.2 1.4-0.5 0.5 0.1 1 0.2 1.5 0.2s1-0.1 1.5-0.2c0.4 0.3 0.9 0.5 1.4 0.5 1.1 0 2-0.9 2-2 0-0.3-0.1-0.7-0.2-1 0.8-0.5 1.3-1.2 1.3-2 0-1.2-1-2.2-2.5-2.7 0.3-0.7 0.5-1.5 0.5-2.3 0-3.3-2.7-6-6-6z' },
            { name: '微博', icon: 'weibo', color: '#E6162D', path: 'M14.5 8c0.8 0 1.5-0.7 1.5-1.5S15.3 5 14.5 5 13 5.7 13 6.5 13.7 8 14.5 8zm-4 8c-3 0-5.5-1.8-5.5-4s2.5-4 5.5-4 5.5 1.8 5.5 4-2.5 4-5.5 4zm0-6c-1.9 0-3.5 0.9-3.5 2s1.6 2 3.5 2 3.5-0.9 3.5-2-1.6-2-3.5-2z' },
            { name: '抖音', icon: 'douyin', color: '#000000', path: 'M19 8v6c0 1.1-0.9 2-2 2h-2v2h-2v-2H9v2H7v-2H5c-1.1 0-2-0.9-2-2V8c0-1.1 0.9-2 2-2h2V4h2v2h4V4h2v2h2c1.1 0 2 0.9 2 2zm-2 0H5v6h12V8z' },
            { name: '快手', icon: 'kuaishou', color: '#FF6600', path: 'M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5zm0 3.2l6 3.4v4.4c0 3.7-2.5 7.2-6 8.2-3.5-1-6-4.5-6-8.2V8.6l6-3.4z' },
            { name: '小红书', icon: 'xiaohongshu', color: '#FF2442', path: 'M20 4H4c-1.1 0-2 0.9-2 2v12c0 1.1 0.9 2 2 2h16c1.1 0 2-0.9 2-2V6c0-1.1-0.9-2-2-2zm-9 13H9v-7h2v7zm4 0h-2v-7h2v7zm4 0h-2V9h2v8z' },
            { name: 'Twitter', icon: 'twitter', color: '#1DA1F2', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
            { name: 'Facebook', icon: 'facebook', color: '#1877F2', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
            { name: 'Instagram', icon: 'instagram', color: '#E4405F', path: 'M16 2H8C4.7 2 2 4.7 2 8v8c0 3.3 2.7 6 6 6h8c3.3 0 6-2.7 6-6V8c0-3.3-2.7-6-6-6zm-4 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm6-9c-0.6 0-1-0.4-1-1s0.4-1 1-1 1 0.4 1 1-0.4 1-1 1z' },
            { name: 'YouTube', icon: 'youtube', color: '#FF0000', path: 'M23 9.7s-0.2-1.7-1-2.4c-0.9-1-2-1-2.4-1C16.4 6 12 6 12 6s-4.4 0-7.6 0.3c-0.5 0-1.5 0-2.4 1-0.7 0.7-1 2.4-1 2.4S1 11.7 1 13.7v2c0 2 0.4 3.9 0.4 3.9s0.2 1.7 1 2.4c0.9 1 2.1 0.9 2.6 1 1.9 0.2 7 0.3 7 0.3s4.4 0 7.6-0.3c0.5 0 1.5 0 2.4-1 0.7-0.7 1-2.4 1-2.4s0.4-1.9 0.4-3.9v-2c0-2-0.4-3.9-0.4-3.9zM10 15.5v-6l6 3-6 3z' },
            { name: 'GitHub', icon: 'github', color: '#181717', path: 'M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5 0.5 0.1 0.7-0.2 0.7-0.5v-1.7c-2.8 0.6-3.4-1.3-3.4-1.3-0.5-1.1-1.1-1.4-1.1-1.4-0.9-0.6 0.1-0.6 0.1-0.6 1 0.1 1.5 1 1.5 1 0.9 1.5 2.3 1.1 2.9 0.8 0.1-0.6 0.3-1.1 0.6-1.3-2.2-0.3-4.6-1.1-4.6-4.9 0-1.1 0.4-2 1-2.7-0.1-0.2-0.4-1.2 0.1-2.5 0 0 0.8-0.3 2.7 1 0.8-0.2 1.7-0.3 2.5-0.3s1.7 0.1 2.5 0.3c1.9-1.3 2.7-1 2.7-1 0.5 1.3 0.2 2.3 0.1 2.5 0.6 0.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9 0.4 0.3 0.7 0.9 0.7 1.9v2.8c0 0.3 0.2 0.6 0.7 0.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z' },
            { name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2', path: 'M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z' },
            { name: 'TikTok', icon: 'tiktok', color: '#000000', path: 'M19 8v6c0 1.1-0.9 2-2 2h-2v2h-2v-2H9v2H7v-2H5c-1.1 0-2-0.9-2-2V8c0-1.1 0.9-2 2-2h2V4h2v2h4V4h2v2h2c1.1 0 2 0.9 2 2zm-2 0H5v6h12V8z' }
        ];

        const handleAvatarUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Crop to square using canvas
                    const img = new Image();
                    img.onload = () => {
                        const size = Math.min(img.width, img.height);
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(
                            img,
                            (img.width - size) / 2,
                            (img.height - size) / 2,
                            size,
                            size,
                            0,
                            0,
                            size,
                            size
                        );
                        const dataUrl = canvas.toDataURL('image/png');
                        config.value.authorAvatar = dataUrl;
                        config.value.socialIcon = ''; // Clear social icon when uploading custom avatar
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const handleCoverUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                config.value.coverImage = e.target.result;
            };
            reader.readAsDataURL(file);
            // allow selecting same file again
            event.target.value = '';
        };

        const clearCoverImage = () => {
            config.value.coverImage = '';
        };

        const selectSocialIcon = (icon) => {
            config.value.socialIcon = icon;
            config.value.authorAvatar = ''; // Clear custom avatar when selecting social icon
        };

        const currentTime = computed(() => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            
            if (config.value.timeFormat === 'YYYY-MM-DD') {
                return `${y}-${m}-${d}`;
            } else {
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                return `${y}-${m}-${d} ${hh}:${mm}`;
            }
        });

        const getPageNumber = (index, total) => {
            if (config.value.pageNumberFormat === 'number') {
                return `${index + 1} / ${total}`;
            } else {
                return `Page ${index + 1}`;
            }
        };

        const isExporting = ref(false);
        const canvasScale = ref(80);

        // 计算列数：根据画布比例和缩放比例
        const columnCount = computed(() => {
            const verticalRatios = ['1:1', '2:3', '3:4', '9:16'];
            const isVertical = verticalRatios.includes(config.value.ratio);
            
            if (!isVertical) {
                return 1; // 横屏卡片始终单列
            }
            
            const scale = canvasScale.value;
            if (scale >= 70) {
                return 1; // 70%-100%：单列
            } else if (scale >= 40) {
                return 2; // 40%-69%：双列
            } else {
                return 3; // 30%-39%：三列
            }
        });

        const ratios = {
            '1:1': { label: '1:1', width: 800, height: 800, maxLines: 10, cssRatio: '1/1' },
            '2:3': { label: '2:3', width: 600, height: 900, maxLines: 18, cssRatio: '2/3' },
            '3:4': { label: '3:4', width: 600, height: 800, maxLines: 15, cssRatio: '3/4' },
            '9:16': { label: '9:16', width: 562, height: 1000, maxLines: 28, cssRatio: '9/16' },
            '3:2': { label: '3:2', width: 900, height: 600, maxLines: 8, cssRatio: '3/2' },
            '4:3': { label: '4:3', width: 800, height: 600, maxLines: 8, cssRatio: '4/3' },
            '16:9': { label: '16:9', width: 1000, height: 562, maxLines: 7, cssRatio: '16/9' },
            '21:9': { label: '21:9', width: 1050, height: 450, maxLines: 6, cssRatio: '21/9' }
        };

        const fonts = [
            { label: 'Inter (默认)', value: 'Inter' },
            { label: 'Alibaba PuHuiTi', value: 'AlibabaPuHuiTi' },
            { label: 'Noto Sans SC (中文)', value: 'Noto Sans SC' },
            { label: 'JetBrains Mono (代码)', value: 'JetBrains Mono' },
            { label: 'Maple Mono Light', value: 'MapleMono-Light' },
            { label: 'Serif (衬线)', value: 'serif' }
        ];

        const alignments = [
            { value: 'left', icon: 'align-left' },
            { value: 'center', icon: 'align-center' },
            { value: 'right', icon: 'align-right' }
        ];

        const backgrounds = [
            // Row 1 - 紫蓝渐变系
            { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
            { value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
            { value: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' },
            { value: 'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)' },
            { value: 'linear-gradient(-20deg, #b721ff 0%, #21d4fd 100%)' },
            { value: 'linear-gradient(to top, #1e3c72 0%, #2a5298 100%)' },
            
            // Row 2 - 青绿渐变系
            { value: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)' },
            { value: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
            { value: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
            { value: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)' },
            { value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
            { value: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)' },
            { value: 'linear-gradient(to right, #0ba360 0%, #3cba92 100%)' },
            
            // Row 3 - 暖色渐变系
            { value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
            { value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
            { value: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)' },
            { value: 'linear-gradient(to right, #ff758c 0%, #ff7eb3 100%)' },
            { value: 'linear-gradient(to top, #ff0844 0%, #ffb199 100%)' },
            { value: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)' },
            { value: 'linear-gradient(to right, #ed6ea0 0%, #ec8c69 100%)' },
            
            // Row 4 - 深色系
            { value: 'linear-gradient(to top, #09203f 0%, #537895 100%)' },
            { value: '#0f172a' },
            { value: '#1e293b' },
            { value: '#475569' },
            { value: '#000000' },
            { value: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
            { value: 'linear-gradient(to right, #232526 0%, #414345 100%)' },
            
            // Row 5 - 浅色和纯色系
            { value: '#ffffff' },
            { value: '#f8fafc' },
            { value: '#e2e8f0' },
            { value: '#94a3b8' },
            { value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
            { value: 'linear-gradient(to right, #e0eafc 0%, #cfdef3 100%)' },
            { value: 'transparent' }
        ];

        // 应用主题配置 - 完整覆盖所有配置项
        const applyTheme = (key) => {
            const theme = themes.value[key];
            if (!theme) return;
            
            config.value.theme = key;
            
            // 应用主题的所有配置到 config
            const themeConfig = theme.config;
            
            // 画布配置
            if (themeConfig.canvas.ratio) {
                config.value.ratio = themeConfig.canvas.ratio;
            }
            config.value.background = themeConfig.canvas.background;
            config.value.padding = themeConfig.canvas.padding;
            config.value.borderRadius = themeConfig.canvas.borderRadius;
            config.value.bgType = themeConfig.canvas.bgType;
            if (themeConfig.canvas.canvasScale) {
                canvasScale.value = themeConfig.canvas.canvasScale;
            }
            
            // 标题和内容配置
            config.value.fontSize = themeConfig.content.fontSize;
            config.value.fontFamily = themeConfig.content.fontFamily;
            config.value.color = themeConfig.content.color;
            config.value.textAlign = themeConfig.content.textAlign;
            
            // 作者、时间、页码、水印的显示状态
            config.value.showAuthor = themeConfig.author.show;
            config.value.showTime = themeConfig.time.show;
            config.value.showPageNumber = themeConfig.pageNumber.show;
            config.value.showWatermark = themeConfig.watermark.show;
            
            // 时间和页码格式
            config.value.timeFormat = themeConfig.time.format;
            config.value.pageNumberFormat = themeConfig.pageNumber.format;
            config.value.watermarkText = themeConfig.watermark.text;
        };
        
        // 当前主题配置 - 用于控制控件显示
        const currentThemeConfig = computed(() => {
            return themes.value[config.value.theme]?.config || (themes.value['modern']?.config || {});
        });

        const cardChunks = ref(['']);

        const cardStyle = computed(() => {
            const ratio = ratios[config.value.ratio];
            const scale = canvasScale.value / 100;
            return {
                width: `${ratio.width}px`,
                height: `${ratio.height}px`,
                color: config.value.color,
                borderRadius: `${config.value.borderRadius}px`,
                transform: `scale(${scale})`,
                transition: 'all 0.3s ease',
                flexShrink: 0
            };
        });

        const contentStyle = computed(() => {
            const themeContent = currentThemeConfig.value.content;
            const style = {
                fontSize: themeContent.fontSize,
                fontFamily: themeContent.fontFamily || 'inherit',
                fontWeight: themeContent.fontWeight || 'normal',
                textAlign: themeContent.textAlign || 'left',
                lineHeight: themeContent.lineHeight,
                backgroundColor: themeContent.backgroundColor,
                backdropFilter: themeContent.backdropFilter,
                padding: themeContent.padding,
                borderRadius: themeContent.borderRadius,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.1)'
            };
            if (config.value.theme === 'teaching') {
                const primary = (currentThemeConfig.value.design && currentThemeConfig.value.design.colorScheme && currentThemeConfig.value.design.colorScheme.primary) || '#2c3e50';
                style['--md-primary-color'] = primary;
            }
            return style;
        });

        const outerBackground = computed(() => {
            const canvasConfig = currentThemeConfig.value.canvas || {};
            if (canvasConfig.backgroundTarget === 'inner') {
                return canvasConfig.outerBackground || config.value.background;
            }
            return config.value.background;
        });

        const innerBackground = computed(() => {
            const canvasConfig = currentThemeConfig.value.canvas || {};
            if (canvasConfig.backgroundTarget === 'inner') {
                return config.value.background;
            }
            return canvasConfig.innerBackground || 'transparent';
        });

        const layeredLayout = computed(() => {
            const canvasConfig = currentThemeConfig.value.canvas || {};
            const innerPadding = canvasConfig.innerPadding ?? config.value.padding;
            const footerPadding = canvasConfig.footerPadding ?? innerPadding;
            const footerSpacing = canvasConfig.footerSpacing ?? 24;
            return { innerPadding, footerPadding, footerSpacing };
        });

        const renderMarkdown = (text) => marked.parse(text);

        let paginationToken = 0;
        let appMounted = false;
        let measurementCard = null;
        let measurementTarget = null;

        const teardownMeasurementCard = () => {
            if (measurementCard && measurementCard.parentNode) {
                measurementCard.parentNode.removeChild(measurementCard);
            }
            measurementCard = null;
            measurementTarget = null;
        };

        const buildMeasurementTarget = (selector, mutateCard) => {
            const sourceCard = document.querySelector('.card-fixed-container');
            if (!sourceCard) return null;
            teardownMeasurementCard();
            measurementCard = sourceCard.cloneNode(true);
            measurementCard.style.position = 'absolute';
            measurementCard.style.visibility = 'hidden';
            measurementCard.style.pointerEvents = 'none';
            measurementCard.style.left = '-99999px';
            measurementCard.style.top = '0';
            measurementCard.style.transform = 'none';
            measurementCard.style.margin = '0';
            measurementCard.style.zIndex = '-1';
            measurementCard.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
            document.body.appendChild(measurementCard);
            if (typeof mutateCard === 'function') {
                mutateCard(measurementCard);
            }
            measurementTarget = measurementCard.querySelector(selector);
            if (measurementTarget && selector.includes('markdown-body')) {
                measurementTarget.classList.toggle('teaching-markdown', config.value.theme === 'teaching');
            }
            return measurementTarget;
        };

        const preparePaginationMetrics = (selector, mutateCard) => {
            const liveTarget = document.querySelector(`.card-fixed-container ${selector}`);
            if (!liveTarget) return null;
            const tester = buildMeasurementTarget(selector, mutateCard);
            if (!tester) return null;
            tester.innerHTML = '&nbsp;';
            tester.style.width = `${liveTarget.clientWidth}px`;
            const pageHeight = tester.clientHeight;
            return { tester, pageHeight, liveTarget };
        };

        const parseLineHeightPx = (computedLineHeight, computedFontSize) => {
            const lh = String(computedLineHeight || '').trim();
            if (lh.endsWith('px')) return Number.parseFloat(lh);
            const fs = String(computedFontSize || '').trim();
            const fontSizePx = fs.endsWith('px') ? Number.parseFloat(fs) : 16;
            const numeric = Number.parseFloat(lh);
            if (Number.isFinite(numeric)) return numeric * fontSizePx;
            const themeLineHeight = Number.parseFloat(currentThemeConfig.value?.content?.lineHeight);
            if (Number.isFinite(themeLineHeight)) return themeLineHeight * fontSizePx;
            return 1.7 * fontSizePx;
        };

        const splitByManualBreaks = (text) => {
            const lines = text.split('\n');
            const sections = [];
            let current = [];
            lines.forEach((line) => {
                if (line.trim() === '---') {
                    sections.push(current.join('\n'));
                    current = [];
                } else {
                    current.push(line);
                }
            });
            sections.push(current.join('\n'));
            if (sections.length === 0) return [''];
            return sections;
        };

        const splitSectionByHeight = (section, tester, limit) => {
            const lines = section.split('\n');
            const chunks = [];
            let start = 0;

            const fits = (text) => {
                tester.innerHTML = renderMarkdown(text && text.trim().length ? text : '&nbsp;');
                return tester.scrollHeight <= limit;
            };

            while (start < lines.length) {
                let low = 1;
                let high = lines.length - start;
                let best = 0;

                while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    const candidate = lines.slice(start, start + mid).join('\n');
                    if (fits(candidate)) {
                        best = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }

                if (best === 0) {
                    best = 1;
                }

                chunks.push(lines.slice(start, start + best).join('\n'));
                start += best;
            }

            return chunks.length ? chunks : [''];
        };

        const takeFirstChunkByHeight = (section, tester, limit) => {
            const lines = section.split('\n');
            const fits = (text) => {
                tester.innerHTML = renderMarkdown(text && text.trim().length ? text : '&nbsp;');
                return tester.scrollHeight <= limit;
            };
            let low = 1;
            let high = lines.length;
            let best = 0;
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const candidate = lines.slice(0, mid).join('\n');
                if (fits(candidate)) {
                    best = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            if (best === 0) best = 1;
            const first = lines.slice(0, best).join('\n');
            const rest = lines.slice(best).join('\n');
            return { first, rest };
        };

        const paginateModernKnowledge = async (rawText, token) => {
            await nextTick();
            if (token !== paginationToken) return;

            // 1) Page 1: use current layout (cover + title) but restrict body to max 3 text lines.
            const firstMetrics = preparePaginationMetrics('.modern-knowledge__desc', null);
            if (!firstMetrics) {
                cardChunks.value = [rawText];
                teardownMeasurementCard();
                return;
            }

            const { tester: firstTester, pageHeight: firstLimit } = firstMetrics;

            const sections = splitByManualBreaks(rawText);
            const result = [];

            // Find first non-empty section to feed page 1.
            let firstSectionIndex = -1;
            for (let i = 0; i < sections.length; i++) {
                if (sections[i] && sections[i].trim()) {
                    firstSectionIndex = i;
                    break;
                }
            }

            let remainingSections = sections;
            if (firstSectionIndex === -1) {
                // All empty: keep behavior consistent
                result.push('');
                teardownMeasurementCard();
                if (token !== paginationToken) return;
                cardChunks.value = result;
                return;
            }

            // Preserve any leading manual breaks as empty pages
            for (let i = 0; i < firstSectionIndex; i++) {
                result.push('');
            }

            const { first: firstChunk, rest: firstRest } = takeFirstChunkByHeight(
                sections[firstSectionIndex],
                firstTester,
                firstLimit
            );
            result.push(firstChunk);

            // Build remaining sections list (rest of first section + remaining sections)
            remainingSections = [];
            if (firstRest && firstRest.trim()) {
                remainingSections.push(firstRest);
            }
            if (firstSectionIndex + 1 < sections.length) {
                remainingSections.push(...sections.slice(firstSectionIndex + 1));
            }

            // Page 1 measurement can be torn down now.
            teardownMeasurementCard();

            // 2) Page 2+: layout without cover/title, paginate by available height.
            const restMetrics = preparePaginationMetrics('.modern-knowledge__desc', (card) => {
                const title = card.querySelector('.modern-knowledge__title');
                if (title) title.style.display = 'none';
                const image = card.querySelector('.modern-knowledge__image');
                if (image) image.style.display = 'none';
                const desc = card.querySelector('.modern-knowledge__desc');
                if (desc) {
                    desc.style.height = 'auto';
                    desc.style.flex = '1 1 auto';
                }
            });
            if (!restMetrics) {
                // Fallback: at least keep first page split.
                if (token !== paginationToken) return;
                cardChunks.value = result.length ? result : [''];
                return;
            }

            const { tester: restTester, pageHeight: restHeight } = restMetrics;
            try {
                remainingSections.forEach((section) => {
                    if (!section.trim()) {
                        result.push('');
                        return;
                    }
                    const pieces = splitSectionByHeight(section, restTester, restHeight);
                    if (pieces.length) result.push(...pieces);
                });
            } finally {
                teardownMeasurementCard();
            }

            if (token !== paginationToken) return;
            cardChunks.value = result.length ? result : [''];
        };

        const paginateContent = async () => {
            if (!appMounted) return;
            const token = ++paginationToken;
            const rawText = markdownInput.value || '';
            const hasContent = rawText.trim().length > 0;
            if (!hasContent) {
                cardChunks.value = [''];
                teardownMeasurementCard();
                return;
            }

            if (config.value.theme === 'modern') {
                await paginateModernKnowledge(rawText, token);
                return;
            }

            await nextTick();
            if (token !== paginationToken) return;
            const paginationMetrics = preparePaginationMetrics('.markdown-body', null);
            if (!paginationMetrics) {
                cardChunks.value = [rawText];
                teardownMeasurementCard();
                return;
            }
            const { tester, pageHeight } = paginationMetrics;

            const sections = splitByManualBreaks(rawText);
            const result = [];
            try {
                sections.forEach((section) => {
                    if (!section.trim()) {
                        result.push('');
                        return;
                    }
                    const pieces = splitSectionByHeight(section, tester, pageHeight);
                    if (pieces.length) {
                        result.push(...pieces);
                    }
                });
            } finally {
                teardownMeasurementCard();
            }
            if (token !== paginationToken) return;
            cardChunks.value = result.length ? result : [''];
        };

        watch(
            [
                () => markdownInput.value,
                () => config.value.ratio,
                () => config.value.fontSize,
                () => config.value.theme,
                () => config.value.padding,
                () => currentThemeConfig.value.content.padding,
                () => currentThemeConfig.value.content.lineHeight
            ],
            () => {
                paginateContent();
            }
        );

        const withExportScale100 = async (node, capture) => {
            const originalTransform = node.style.transform;
            const originalTransition = node.style.transition;
            try {
                // 预览可缩放，但导出必须按 100% 计算（否则会把缩放后的“空白区”一起导出成透明）
                // 同时禁用 transition，避免截图时还在动画过渡中。
                node.style.transition = 'none';
                node.style.transform = 'scale(1)';
                // 强制浏览器应用样式
                void node.offsetHeight;
                await new Promise(requestAnimationFrame);
                await new Promise(requestAnimationFrame);
                return await capture();
            } finally {
                node.style.transform = originalTransform;
                node.style.transition = originalTransition;
            }
        };

        const captureCardPngBlob = async (node) => {
            return await withExportScale100(node, () =>
                htmlToImage.toBlob(node, {
                    quality: 1,
                    pixelRatio: 2
                })
            );
        };

        const downloadSingleCard = async (index) => {
            const node = document.getElementById(`card-${index}`);
            if (!node) return;
            try {
                const blob = await captureCardPngBlob(node);
                if (!blob) return;
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `card-${index + 1}.png`;
                link.href = objectUrl;
                link.click();
                URL.revokeObjectURL(objectUrl);
            } catch (error) {
                console.error('导出失败', error);
            }
        };

        const exportAllAsZip = async () => {
            isExporting.value = true;
            const zip = new JSZip();
            try {
                for (let i = 0; i < cardChunks.value.length; i++) {
                    const node = document.getElementById(`card-${i}`);
                    if (!node) continue;

                    const blob = await captureCardPngBlob(node);
                    if (!blob) continue;
                    zip.file(`card-${i + 1}.png`, blob);
                }
                // PNG 本身已压缩，ZIP 再压缩只会更慢
                const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
                saveAs(content, "linshu_cards.zip");
            } catch (error) {
                console.error('批量导出失败', error);
            } finally {
                isExporting.value = false;
            }
        };

        // Lucide icons removed from dynamic areas to avoid insertBefore errors; no icon recreation needed
        onMounted(async () => {
            await loadExternalThemes();
            if (themes.value[config.value.theme]) {
                applyTheme(config.value.theme);
            }
            appMounted = true;
            await paginateContent();
        });
        watch([cardChunks, leftTab], () => {});

        return {
            leftTab, markdownInput, config, ratios, themes, backgrounds,
            cardChunks, cardStyle, contentStyle, isExporting, canvasScale, columnCount,
            currentThemeConfig, outerBackground, innerBackground, layeredLayout,
            renderMarkdown, downloadSingleCard, exportAllAsZip, applyTheme, fonts, alignments,
            handleAvatarUpload, handleCoverUpload, clearCoverImage,
            currentTime, getPageNumber, socialIcons, selectSocialIcon
        };
    }
}).mount('#app');
