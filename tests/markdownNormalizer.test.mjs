import test from 'node:test'
import assert from 'node:assert/strict'
import {
  htmlToMarkdown,
  normalizeMarkdown
} from '../local-client/src/markdownNormalizer.js'

test('converts common Chinese ordered and unordered list markers', () => {
  const input = `1、第一项
（1）子项
（2）第二个子项
2) 第二项

• 要点一
● 要点二`
  const result = normalizeMarkdown(input)

  assert.equal(result.markdown, `1. 第一项
   1. 子项
   2. 第二个子项
2. 第二项

- 要点一
- 要点二`)
  assert.equal(result.changes.orderedLists, 4)
  assert.equal(result.changes.unorderedLists, 2)
})

test('detects conservative Chinese chapter headings and merges copied hard wraps', () => {
  const input = `一、项目背景
这是从其他平台复制后产生硬换行的
正文内容。`
  const result = normalizeMarkdown(input)

  assert.equal(result.markdown, `## 一、项目背景

这是从其他平台复制后产生硬换行的正文内容。`)
  assert.equal(result.changes.headings, 1)
  assert.equal(result.changes.paragraphsMerged, 1)
})

test('normalizes full-width list numbers and quote markers', () => {
  const input = `１．第一项
２．第二项

＞引用内容`
  const result = normalizeMarkdown(input)

  assert.equal(result.markdown, `1. 第一项
2. 第二项

> 引用内容`)
  assert.equal(result.changes.orderedLists, 2)
  assert.equal(result.changes.quotes, 1)
})

test('preserves front matter, fenced code, tables, images, and manual pagination', () => {
  const input = `---
title: 测试
---

\`\`\`text
1、代码中的内容
\`\`\`

| 列一 | 列二 |
| --- | --- |
| 1、原值 | 数据 |

![图片](./image.png)

---

1、正文列表`
  const result = normalizeMarkdown(input)

  assert.match(result.markdown, /^---\ntitle: 测试\n---/)
  assert.match(result.markdown, /```text\n1、代码中的内容\n```/)
  assert.match(result.markdown, /\| 1、原值 \| 数据 \|/)
  assert.match(result.markdown, /!\[图片\]\(\.\/image\.png\)/)
  assert.match(result.markdown, /---\n\n1\. 正文列表$/)
})

test('converts rich HTML to GFM locally', () => {
  const result = htmlToMarkdown('<h2>核心能力</h2><ol><li>自动分页</li><li><strong>批量导出</strong></li></ol>')
  assert.equal(result, `## 核心能力

1. 自动分页
2. **批量导出**`)
})

test('is idempotent when normalization is repeated', () => {
  const input = `一、项目背景
正文第一行
正文第二行

1、第一项
2、第二项`
  const first = normalizeMarkdown(input).markdown
  const second = normalizeMarkdown(first).markdown
  const third = normalizeMarkdown(second).markdown

  assert.equal(second, first)
  assert.equal(third, first)
})
