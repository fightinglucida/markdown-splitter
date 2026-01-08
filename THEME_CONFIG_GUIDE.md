# 主题配置系统说明

## 概述

流光卡片 Pro 现在使用完整的 JSON 配置系统来管理主题。每个主题包含完整的样式和控件配置，实现了高度的可定制性。

## 主题配置结构

每个主题配置包含以下部分：

### 1. 标题配置 (title)
- `show`: 是否显示标题
- `editable`: 用户是否可以编辑标题
- `fontSize`: 字体大小（如 "1.8rem"）
- `fontFamily`: 字体（如 "Inter", "serif"）
- `fontWeight`: 字重（如 "bold"）
- `color`: 颜色（如 "#1e293b"）
- `textAlign`: 对齐方式（"left", "center", "right"）
- `marginBottom`: 底部间距（如 "2rem"）

### 2. 正文内容配置 (content)
- `show`: 是否显示内容
- `editable`: 用户是否可以编辑
- `fontSize`: 字体大小
- `fontFamily`: 字体
- `color`: 文字颜色
- `textAlign`: 对齐方式
- `lineHeight`: 行高（如 "1.7"）
- `maxCharsPerLine`: 每行最大字符数（影响自动分页）
- `backgroundColor`: 内容背景色（支持 rgba）
- `backdropFilter`: 背景滤镜（如 "blur(12px)"）
- `padding`: 内边距（如 "48px"）
- `borderRadius`: 圆角（如 "16px"）

### 3. 作者信息配置 (author)
- `show`: 默认是否显示
- `editable`: 控件是否对用户显示
- `position`: 位置（预留，如 "bottom-left", "bottom-center"）
- `avatarSize`: 头像大小（如 "40px"）
- `nicknameSize`: 昵称字号（如 "14px"）
- `nicknameColor`: 昵称颜色
- `usernameSize`: 用户名字号（如 "10px"）
- `usernameColor`: 用户名颜色
- `allowCustomAvatar`: 是否允许自定义头像
- `allowSocialIcon`: 是否允许社交图标

### 4. 时间标签配置 (time)
- `show`: 默认是否显示
- `editable`: 控件是否对用户显示
- `position`: 位置（预留）
- `format`: 格式（"YYYY-MM-DD" 或 "datetime"）
- `fontSize`: 字号
- `color`: 颜色

### 5. 页码配置 (pageNumber)
- `show`: 默认是否显示
- `editable`: 控件是否对用户显示
- `position`: 位置（预留）
- `format`: 格式（"number" 为 "1 / n"，"text" 为 "Page n"）
- `fontSize`: 字号
- `color`: 颜色

### 6. 水印配置 (watermark)
- `show`: 默认是否显示
- `editable`: 控件是否对用户显示
- `position`: 位置（预留）
- `text`: 默认水印文字
- `fontSize`: 字号
- `color`: 颜色
- `opacity`: 不透明度（0-1）

### 7. 画布配置 (canvas)
- `background`: 背景（支持纯色、渐变）
- `padding`: 内边距（数字，单位 px）
- `borderRadius`: 圆角（数字，单位 px）
- `bgType`: 背景类型（"light" 或 "dark"，影响默认样式）

## 如何添加新主题

### 方法1：在代码中添加

在 `index.html` 的 `themes` 对象中添加新主题：

```javascript
const themes = {
    // ... 现有主题 ...
    
    'myNewTheme': {
        name: '我的新主题',
        config: {
            // 复制 theme-config-template.json 的内容
            // 修改各项配置
        }
    }
};
```

### 方法2：使用配置模板

1. 复制 `theme-config-template.json` 文件
2. 修改配置项
3. 将配置粘贴到 `themes` 对象中

## 内置主题说明

### 1. 现代简约 (modern)
- 浅色主题，清爽简洁
- 适合商务、教育类内容
- 显示作者、页码、水印

### 2. 深邃黑 (dark)
- 深色主题，神秘优雅
- 适合科技、设计类内容
- 半透明黑色内容背景

### 3. 优雅衬线 (elegant)
- 白底衬线字体
- 适合文学、正式内容
- 标题居中，不显示水印

### 4. 流光溢彩 (vibrant)
- 彩色渐变背景
- 适合创意、艺术类内容
- 毛玻璃效果，高对比度

## 控件可见性控制

- 当 `editable: false` 时，对应的控件在左侧栏中隐藏
- 例如："优雅衬线"主题的水印设置 `editable: false`，用户看不到水印控件

## 注意事项

1. **颜色格式**：支持 hex (#1e293b)、rgb、rgba
2. **尺寸单位**：
   - 字体大小可以用 px、rem、em
   - 内边距、圆角等使用字符串（如 "48px"）
3. **背景**：
   - 纯色：直接写颜色值
   - 渐变：使用 CSS 渐变语法
4. **字体**：确保使用的字体在页面中已加载
5. **自动分页**：`maxCharsPerLine` 影响内容分页计算

## 最佳实践

1. **保持一致性**：同一主题内的颜色、字体应协调
2. **对比度**：确保文字和背景有足够对比度
3. **测试**：在不同比例（1:1, 9:16等）下测试主题效果
4. **命名**：使用有意义的主题名称
5. **备份**：添加新主题前先备份现有配置

## 示例：添加"极简白"主题

```javascript
'minimal': {
    name: '极简白',
    config: {
        title: {
            show: true,
            editable: true,
            fontSize: '2rem',
            fontFamily: 'Inter',
            fontWeight: '600',
            color: '#000000',
            textAlign: 'left',
            marginBottom: '3rem'
        },
        content: {
            show: true,
            editable: true,
            fontSize: '16px',
            fontFamily: 'Inter',
            color: '#000000',
            textAlign: 'left',
            lineHeight: '1.8',
            maxCharsPerLine: 24,
            backgroundColor: 'rgba(255,255,255,1)',
            backdropFilter: 'none',
            padding: '60px',
            borderRadius: '0px'
        },
        author: {
            show: false,
            editable: false,
            position: 'bottom-left',
            avatarSize: '32px',
            nicknameSize: '12px',
            nicknameColor: '#000000',
            usernameSize: '10px',
            usernameColor: '#666666',
            allowCustomAvatar: false,
            allowSocialIcon: false
        },
        time: {
            show: false,
            editable: false,
            position: 'bottom-right',
            format: 'YYYY-MM-DD',
            fontSize: '9px',
            color: '#999999'
        },
        pageNumber: {
            show: true,
            editable: true,
            position: 'bottom-center',
            format: 'text',
            fontSize: '10px',
            color: '#666666'
        },
        watermark: {
            show: false,
            editable: false,
            position: 'bottom-right',
            text: '',
            fontSize: '8px',
            color: '#cccccc',
            opacity: 0.3
        },
        canvas: {
            background: '#ffffff',
            padding: 0,
            borderRadius: 0,
            bgType: 'light'
        }
    }
}
```

这个"极简白"主题特点：
- 纯白背景，无内边距
- 只显示标题、内容和页码
- 隐藏作者、时间、水印的控件
- 极简风格，适合打印
