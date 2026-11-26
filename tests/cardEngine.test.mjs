import test from 'node:test'
import assert from 'node:assert/strict'

import { cardMarkdownSections, formatTimestamp, formatWeekday, renderCardTokens, splitManualSections, splitMarkdown, templates } from '../local-client/src/cardEngine.js'

test('includes local time down to seconds on Notes cards', () => {
  const date = new Date(2026, 3, 7, 8, 4, 2)
  assert.equal(formatTimestamp({ timeFormat: templates.appleNotes.time.format }, date), '2026年04月07日 08:04:02')
})

test('preserves separators inside fenced code while splitting explicit page breaks', () => {
  const first = '第一段\n\n~~~~md\n---\n~~~~'
  assert.deepEqual(splitManualSections(first + '\n---\n第二段'), [first + '\n', '第二段'])
})

test('formats the sticky-note date with an English month abbreviation', () => {
  const date = new Date(2026, 8, 2, 9, 30)
  assert.equal(formatTimestamp({ timeFormat: 'MMM DD YYYY' }, date), 'SEP 02 2026')
})

test('formats the blue-note weekday from the current date', () => {
  const date = new Date(2026, 8, 2, 9, 30)
  assert.equal(formatWeekday(date), 'Wednesday')
})

test('can preserve the first Markdown heading for body-only templates', () => {
  const [tokens] = cardMarkdownSections('# 正文标题\n\n正文内容', { preserveTitleHeading: true })
  assert.deepEqual(tokens.map(token => token.type), ['heading', 'html', 'paragraph'])
})

test('keeps the existing title-stripping behavior for other templates', () => {
  const [tokens] = cardMarkdownSections('# 文章标题\n\n正文内容')
  assert.deepEqual(tokens.map(token => token.type), ['html', 'paragraph'])
  assert.equal(tokens[1].text, '正文内容')
})

test('preserves leading, intervening and trailing blank lines, including whitespace-only CRLF lines', () => {
  const [tokens] = cardMarkdownSections('\r\n第一段\r\n \t\r\n\r\n## 小标题\r\n\r\n末段\r\n\r\n')
  const html = renderCardTokens(tokens)
  const gap = 'class="markdown-blank-line"'
  assert.deepEqual(html.split(/<p>|<h2>/).map(part => part.split(gap).length - 1), [1, 2, 1, 1])
})

test('preserves metadata separators and code whitespace without creating extra spacers inside code', () => {
  const [tokens] = cardMarkdownSections('---\ntitle: 标题\n---\n\n~~~text\n一\n\n二\n~~~\n\n正文')
  const html = renderCardTokens(tokens)
  assert.match(html, /<code class="language-text">一\n\n二\n<\/code>/)
  assert.equal(html.split('markdown-blank-line').length - 1, 2)
})

test('measures list items individually and renders loose task-list tokens repeatably', () => {
  const [units] = splitMarkdown('- [x] 一\n\n- [ ] 二')
  assert.equal(units.length, 2)
  const tokens = [units[0].token]
  const html = renderCardTokens(tokens)
  assert.equal(html.match(/type="checkbox"/g).length, 2)
  assert.equal(html.match(/markdown-blank-line/g).length, 1)
  assert.equal(html, renderCardTokens(tokens))
})
