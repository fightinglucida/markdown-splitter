export const builtInThemes = {
  dark: {
    name: '深邃黑',
    preview: {
      description: '神秘优雅，适合科技和设计',
      features: ['深色背景', '毛玻璃', '高对比']
    },
    config: {
      title: {
        show: true, editable: true,
        fontSize: '1.8rem', fontFamily: 'Inter', fontWeight: 'bold',
        color: '#f8fafc', textAlign: 'left', marginBottom: '1.2rem'
      },
      content: {
        show: true, editable: true,
        fontSize: '16px', fontFamily: 'Inter', color: '#f8fafc',
        textAlign: 'left', lineHeight: '1.7', maxCharsPerLine: 22,
        backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
        padding: '28px', borderRadius: '14px'
      },
      author: {
        show: true, editable: true, position: 'bottom-left',
        avatarSize: '40px', nicknameSize: '14px', nicknameColor: '#f8fafc',
        usernameSize: '10px', usernameColor: '#94a3b8',
        allowCustomAvatar: true, allowSocialIcon: true
      },
      time: {
        show: false, editable: true, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '10px', color: '#64748b'
      },
      pageNumber: {
        show: true, editable: true, position: 'bottom-right',
        format: 'number', fontSize: '10px', color: '#64748b'
      },
      watermark: {
        show: true, editable: true, position: 'bottom-right',
        text: '林书知识库', fontSize: '10px', color: '#64748b', opacity: 0.5
      },
      canvas: {
        background: '#1e1e1e', padding: 32, borderRadius: 20, bgType: 'dark'
      }
    }
  },

  elegant: {
    name: '优雅衬线',
    preview: {
      description: '文学正式，适合长文阅读',
      features: ['白底黑字', '衬线字体', '标题居中']
    },
    config: {
      title: {
        show: true, editable: true,
        fontSize: '1.8rem', fontFamily: 'serif', fontWeight: 'bold',
        color: '#2d3436', textAlign: 'center', marginBottom: '1.5rem'
      },
      content: {
        show: true, editable: true,
        fontSize: '17px', fontFamily: 'serif', color: '#2d3436',
        textAlign: 'left', lineHeight: '1.8', maxCharsPerLine: 20,
        backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        padding: '28px', borderRadius: '8px'
      },
      author: {
        show: true, editable: true, position: 'bottom-center',
        avatarSize: '36px', nicknameSize: '13px', nicknameColor: '#2d3436',
        usernameSize: '10px', usernameColor: '#636e72',
        allowCustomAvatar: true, allowSocialIcon: false
      },
      time: {
        show: true, editable: true, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '9px', color: '#636e72'
      },
      pageNumber: {
        show: true, editable: true, position: 'bottom-right',
        format: 'text', fontSize: '9px', color: '#636e72'
      },
      watermark: {
        show: false, editable: false, position: 'bottom-right',
        text: '', fontSize: '9px', color: '#636e72', opacity: 0.3
      },
      canvas: {
        background: '#ffffff', padding: 36, borderRadius: 0, bgType: 'light'
      }
    }
  },

  modern: {
    name: '现代简约',
    preview: {
      description: '知识库排版：封面图 + 大标题 + 摘要 + 署名',
      features: ['默认3:4', '封面图(仅第一页)', '极简排版']
    },
    config: {
      title: {
        show: true, editable: true,
        fontSize: '34px', fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: '900', color: '#1a1a1a', textAlign: 'left',
        marginBottom: '16px', letterSpacing: '0.5px', lineHeight: '1.3'
      },
      content: {
        show: true, editable: true,
        fontSize: '15px', fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: '400', color: '#2c2c2c', textAlign: 'left',
        lineHeight: '1.7', maxCharsPerLine: 22,
        backgroundColor: 'transparent', backdropFilter: 'none',
        padding: '0', borderRadius: '0', letterSpacing: '0.3px'
      },
      author: {
        show: false, editable: false, position: 'none',
        avatarSize: '0', nicknameSize: '0', nicknameColor: 'transparent',
        usernameSize: '0', usernameColor: 'transparent',
        allowCustomAvatar: false, allowSocialIcon: false
      },
      time: {
        show: false, editable: false, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '10px', color: '#94a3b8'
      },
      pageNumber: {
        show: false, editable: false, position: 'bottom-right',
        format: 'number', fontSize: '10px', color: '#94a3b8'
      },
      watermark: {
        show: true, editable: true, position: 'bottom-center',
        text: '赚钱就是把时代的杠杆拉满', fontSize: '12px', color: '#3a3a3a', opacity: 1
      },
      canvas: {
        ratio: '3:4',
        background: 'linear-gradient(135deg, #f8956f 0%, #ec6d47 100%)',
        padding: 0, borderRadius: 0, canvasScale: 80, bgType: 'light'
      }
    }
  },

  scholarly: {
    name: '书香墨韵',
    preview: {
      description: '经典阅读体验，适合深度长文',
      features: ['黑白简约', '大字号', '荧光强调']
    },
    config: {
      title: {
        show: true, editable: true,
        fontSize: '24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        fontWeight: '800', color: '#1a1a1a', textAlign: 'center',
        marginBottom: '1.5rem', borderTop: '3px solid #1a1a1a',
        borderBottom: '3px solid #1a1a1a', padding: '16px 0', letterSpacing: '3px'
      },
      content: {
        show: true, editable: true,
        fontSize: '16px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        color: '#2a2a2a', textAlign: 'justify', lineHeight: '1.95', maxCharsPerLine: 22,
        backgroundColor: '#f8f8f8', backdropFilter: 'none',
        padding: '28px', borderRadius: '6px'
      },
      author: {
        show: true, editable: true, position: 'bottom-left',
        avatarSize: '40px', nicknameSize: '14px', nicknameColor: '#1a1a1a',
        usernameSize: '10px', usernameColor: '#404040',
        allowCustomAvatar: true, allowSocialIcon: true
      },
      time: {
        show: true, editable: true, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '10px', color: '#888'
      },
      pageNumber: {
        show: true, editable: true, position: 'bottom-right',
        format: 'number', fontSize: '10px', color: '#1a1a1a'
      },
      watermark: {
        show: true, editable: true, position: 'bottom-right',
        text: '书香墨韵', fontSize: '10px', color: '#999', opacity: 0.5
      },
      canvas: {
        background: '#ffffff', padding: 32, borderRadius: 0, bgType: 'light'
      },
      markdown: {
        h2: { fontSize: '18px', padding: '0.3em 1em', borderRadius: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
        h3: { fontSize: '16px', borderLeft: '5px solid #1a1a1a', paddingLeft: '16px', background: 'linear-gradient(to right, rgba(26,26,26,0.04), transparent 50%)' },
        strong: { background: 'linear-gradient(to bottom, transparent 65%, rgba(255,235,59,0.7) 65%)', color: '#1a1a1a' },
        blockquote: { background: '#f8f8f8', borderLeft: '5px solid #eee', color: '#888' }
      }
    }
  },

  teaching: {
    name: '教学卡片',
    preview: {
      description: '教学分享专用，头像强化',
      features: ['蓝色渐变', '头像突出', '水印左下']
    },
    config: {
      title: {
        show: true, editable: false,
        fontSize: '1.8rem', fontFamily: "MapleMono-NF-CN-Light, 'Noto Sans SC', sans-serif",
        fontWeight: 'bold', color: '#2c3e50', textAlign: 'left',
        marginBottom: '0', backgroundColor: '#e8eaf0',
        padding: '18px 22px', borderRadius: '16px 16px 0 0'
      },
      content: {
        show: true, editable: false,
        fontSize: '16px', fontFamily: "MapleMono-NF-CN-Light, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        fontWeight: '300', color: '#2d3436', textAlign: 'left',
        lineHeight: '1.7', maxCharsPerLine: 26,
        backgroundColor: '#ffffff', backdropFilter: 'none',
        padding: '24px', borderRadius: '16px', marginTop: '-10px'
      },
      author: {
        show: true, editable: true, position: 'top-left',
        avatarSize: '64px', nicknameSize: '0', nicknameColor: 'transparent',
        usernameSize: '0', usernameColor: 'transparent',
        allowCustomAvatar: true, allowSocialIcon: true
      },
      time: {
        show: false, editable: false, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '10px', color: '#94a3b8'
      },
      pageNumber: {
        show: true, editable: true, position: 'bottom-right',
        format: 'number', fontSize: '11px', color: '#5a6c7d'
      },
      watermark: {
        show: true, editable: true, position: 'bottom-left',
        text: '林书知识库', fontSize: '9px', color: '#94a3b8', opacity: 0.5
      },
      canvas: {
        ratio: '3:4',
        outerBackground: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
        background: '#3C67B0', padding: 16, borderRadius: 16,
        canvasScale: 80, bgType: 'light',
        backgroundTarget: 'inner', innerPadding: 20, innerRadius: 18,
        footerPadding: 14, footerSpacing: 10
      }
    }
  },

  vibrant: {
    name: '流光溢彩',
    preview: {
      description: '彩色渐变，适合创意展示',
      features: ['渐变背景', '毛玻璃', '高饱和']
    },
    config: {
      title: {
        show: true, editable: true,
        fontSize: '1.8rem', fontFamily: 'Inter', fontWeight: 'bold',
        color: '#ffffff', textAlign: 'left', marginBottom: '1.2rem'
      },
      content: {
        show: true, editable: true,
        fontSize: '16px', fontFamily: 'Inter', color: '#ffffff',
        textAlign: 'left', lineHeight: '1.7', maxCharsPerLine: 22,
        backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)',
        padding: '28px', borderRadius: '20px'
      },
      author: {
        show: true, editable: true, position: 'bottom-left',
        avatarSize: '40px', nicknameSize: '14px', nicknameColor: '#ffffff',
        usernameSize: '10px', usernameColor: 'rgba(255,255,255,0.7)',
        allowCustomAvatar: true, allowSocialIcon: true
      },
      time: {
        show: false, editable: true, position: 'with-author',
        format: 'YYYY-MM-DD', fontSize: '10px', color: 'rgba(255,255,255,0.6)'
      },
      pageNumber: {
        show: true, editable: true, position: 'bottom-right',
        format: 'number', fontSize: '10px', color: 'rgba(255,255,255,0.6)'
      },
      watermark: {
        show: true, editable: true, position: 'bottom-right',
        text: '林书知识库', fontSize: '10px', color: 'rgba(255,255,255,0.5)', opacity: 0.5
      },
      canvas: {
        background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        padding: 32, borderRadius: 28, bgType: 'dark'
      }
    }
  }
}
