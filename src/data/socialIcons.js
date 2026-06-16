// 使用 Iconify API 提供真实品牌 SVG Logo（official Simple Icons 数据源）
import avatar1Url from '../../avatar-1.png'
import avatar2Url from '../../avatar-2.png'

const si = (name, hex) =>
  `https://api.iconify.design/simple-icons:${name}.svg?color=%23${hex}`

// 统一使用白色图标 + 品牌色背景，所有平台视觉一致
export const socialIcons = [
  { name: '头像 1',     icon: 'avatar-1',     color: 'transparent', imgUrl: avatar1Url, isAvatar: true },
  { name: '头像 2',     icon: 'avatar-2',     color: 'transparent', imgUrl: avatar2Url, isAvatar: true },
  { name: '微信',      icon: 'wechat',       color: '#07C160', imgUrl: si('wechat',       'ffffff') },
  { name: 'QQ',        icon: 'qq',           color: '#12B7F5', imgUrl: si('tencentqq',    'ffffff') },
  { name: '微博',      icon: 'weibo',        color: '#E6162D', imgUrl: si('sinaweibo',    'ffffff') },
  { name: '抖音',      icon: 'douyin',       color: '#161823', imgUrl: si('tiktok',       'ffffff') },
  { name: '小红书',    icon: 'xiaohongshu',  color: '#FE2C55', imgUrl: si('xiaohongshu',  'ffffff') },
  { name: 'Twitter/X', icon: 'twitter',      color: '#000000', imgUrl: si('x',            'ffffff') },
  { name: 'Facebook',  icon: 'facebook',     color: '#0866FF', imgUrl: si('facebook',     'ffffff') },
  { name: 'Instagram', icon: 'instagram',    color: '#E4405F', imgUrl: si('instagram',    'ffffff') },
  { name: 'YouTube',   icon: 'youtube',      color: '#FF0000', imgUrl: si('youtube',      'ffffff') },
  { name: 'GitHub',    icon: 'github',       color: '#24292E', imgUrl: si('github',       'ffffff') },
  { name: 'LinkedIn',  icon: 'linkedin',     color: '#0A66C2', imgUrl: si('linkedin',     'ffffff') },
]
