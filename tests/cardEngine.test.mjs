import test from 'node:test'
import assert from 'node:assert/strict'

import { formatTimestamp, formatWeekday, splitMarkdown } from '../local-client/src/cardEngine.js'

test('formats the sticky-note date with an English month abbreviation', () => {
  const date = new Date(2026, 8, 2, 9, 30)
  assert.equal(formatTimestamp({ timeFormat: 'MMM DD YYYY' }, date), 'SEP 02 2026')
})

test('formats the blue-note weekday from the current date', () => {
  const date = new Date(2026, 8, 2, 9, 30)
  assert.equal(formatWeekday(date), 'Wednesday')
})

test('can preserve the first Markdown heading for body-only templates', () => {
  const sections = splitMarkdown('# 正文标题\n\n正文内容', { preserveTitleHeading: true })
  assert.equal(sections[0][0].text, '# 正文标题')
  assert.equal(sections[0][1].text, '正文内容')
})

test('keeps the existing title-stripping behavior for other templates', () => {
  const sections = splitMarkdown('# 文章标题\n\n正文内容')
  assert.equal(sections[0].length, 1)
  assert.equal(sections[0][0].text, '正文内容')
})
