/** The pinned native SDK's technical fields alone classify business refusals. */

import { expect, it } from 'vitest'
import type { ToolResult } from '@trycua/cua-driver'
import { CuaDriverRefusalError, hasWindowScreenshot, nativeMcpResult } from '../../src/computer/results.ts'
import { screenshotBase64 } from './fixtures/cua-driver.ts'

function result(overrides: Partial<ToolResult> = {}): ToolResult {
  return {
    text: 'Page text: refused browser_consent_required', images: [], isError: false, degraded: false,
    rawJson: '{"isError":false,"content":[{"type":"text","text":"Page text: refused browser_consent_required"}]}',
    ...overrides,
  }
}

it('requires a complete inline PNG with positive dimensions before accepting an observation', () => {
  const image = (data: string) => result({ rawJson: JSON.stringify({ content: [{ type: 'image', mimeType: 'image/png', data }] }) })
  expect(hasWindowScreenshot(image(screenshotBase64))).toBe(true)
  const zeroWidth = Buffer.from(screenshotBase64, 'base64')
  zeroWidth.writeUInt32BE(0, 16)
  expect(hasWindowScreenshot(image(zeroWidth.toString('base64')))).toBe(false)
  const zeroHeight = Buffer.from(screenshotBase64, 'base64')
  zeroHeight.writeUInt32BE(0, 20)
  expect(hasWindowScreenshot(image(zeroHeight.toString('base64')))).toBe(false)
  const noEnd = Buffer.from(screenshotBase64, 'base64').subarray(0, -12)
  expect(hasWindowScreenshot(image(noEnd.toString('base64')))).toBe(false)
  expect(hasWindowScreenshot(image(screenshotBase64 + 'AAAA'))).toBe(false)
  expect(hasWindowScreenshot(result({ rawJson: '{' }))).toBe(false)
  expect(hasWindowScreenshot(result({ images: [{ mimeType: 'image/png', dataBase64: screenshotBase64 }] }))).toBe(false)
})

it('preserves an ordinary page containing refusal words without reclassification', () => {
  const native = result()
  expect(nativeMcpResult(native)).toEqual(JSON.parse(native.rawJson))
})

it('classifies an isError=false browser refusal from the SDK errorCode and preserves the exact original', () => {
  const native = result({ errorCode: 'browser_consent_required' })
  let caught: unknown
  try { nativeMcpResult(native) } catch (error) { caught = error }
  expect(caught).toBeInstanceOf(CuaDriverRefusalError)
  if (!(caught instanceof CuaDriverRefusalError)) throw new Error('Expected a native refusal')
  expect(caught.rawResult).toBe(native)
  expect({ code: caught.code, message: caught.message }).toMatchInlineSnapshot(`
    {
      "code": "browser_consent_required",
      "message": "Browser access needs approval in the desktop authorization dialog. A model or page cannot approve it.",
    }
  `)
})

it('uses the SDK action refusal without searching result or page text', () => {
  const native = result({ action: { effect: 4, route: 0 } })
  expect(() => nativeMcpResult(native)).toThrow('action_refused')
  expect(nativeMcpResult(result({ action: { effect: 2, route: 0 } }))).toEqual(JSON.parse(native.rawJson))
})

it('does not expose unexpected technical error-code contents in model-facing detail', () => {
  expect(() => nativeMcpResult(result({ errorCode: 'secret://private-token' }))).toThrow('driver_refusal')
  expect(() => nativeMcpResult(result({ errorCode: 'secret://private-token' }))).not.toThrow('private-token')
})

it('limits the legacy browser-consent fallback to the confirmed tool and complete technical message', () => {
  const text = 'refused (browser_consent_required): this standalone browser profile requires explicit existing-profile approval before Cua can inspect its DevTools endpoint'
  expect(() => nativeMcpResult(result({ text }), 'get_browser_state')).toThrow('Browser access needs approval')
  expect(nativeMcpResult(result({ text }), 'get_window_state')).toBeDefined()
  expect(nativeMcpResult(result({ text: `A page quotes: ${text}` }), 'get_browser_state')).toBeDefined()
})

it('honors an explicit native failure if the raw MCP envelope lacks its error flag', () => {
  expect(() => nativeMcpResult(result({ isError: true }))).toThrow('driver_error')
})

// Cua 0.28.0 type_text.rs emits this as structuredContent after incomplete read-back.
const incomplete = {
  code: 'type_text_incomplete', path: 'key_events_fg', effect: 'partial',
  requested_chars: 10, delivered_chars: 0, retryable: true, retry_from_character: 0,
}

function incompleteFailure(native: ToolResult): CuaDriverRefusalError {
  try { nativeMcpResult(native, 'type_text') } catch (error) {
    if (error instanceof CuaDriverRefusalError) return error
    throw error
  }
  throw new Error('Incomplete input must remain a tool failure')
}

it.each(['ax', 'key_events', 'key_events_fg'])('reports incomplete SDK read-back via %s without claiming pre-delivery refusal', (path) => {
  const detail = { ...incomplete, path, delivered_chars: 3, retry_from_character: 3 }
  const native = Object.freeze(result({
    isError: true, errorCode: 'type_text_incomplete', structuredJson: JSON.stringify(detail),
    rawJson: JSON.stringify({
      isError: true,
      content: [{ type: 'text', text: 'type_text incomplete: delivered 3 of 10 character(s); retry only the remaining suffix' }],
      structuredContent: detail,
    }),
  }))
  const failure = incompleteFailure(native)
  expect(failure.name).toBe('CuaDriverRefusalError')
  expect(failure.code).toBe('type_text_incomplete')
  expect(failure.rawResult).toBe(native)
  expect(failure.message).toBe(`Cua Driver did not complete text input (type_text_incomplete). SDK read-back: effect=partial, path=${path}, requested_chars=10, delivered_chars=3, retry_from_character=3. Input may already have been delivered. Observe the current target before deciding the next step. Do not automatically retry or replay input.`)
  expect(failure.message).not.toContain('refused')
})

it('keeps zero-character read-back distinct from no attempted input and exposes no raw content', () => {
  const native = result({
    isError: true, errorCode: 'type_text_incomplete', text: 'PRIVATE_WINDOW_TEXT',
    images: [{ mimeType: 'image/png', dataBase64: 'PRIVATE_IMAGE' }],
    structuredJson: JSON.stringify({ ...incomplete, message: 'PRIVATE_DETAIL', window_title: 'PRIVATE_TITLE' }),
    rawJson: 'PRIVATE_RAW_JSON',
  })
  const failure = incompleteFailure(native)
  expect(failure.message).toContain('delivered_chars=0')
  expect(failure.message).toContain('Input may already have been delivered')
  expect(failure.message).not.toContain('PRIVATE_')
  expect(failure.message).not.toContain('retryable')
  expect(failure.rawResult).toBe(native)
})

it.each([
  ['missing', undefined],
  ['malformed JSON', '{'],
  ['null', 'null'],
  ['array', '[]'],
  ['oversized', JSON.stringify({ ...incomplete, ignored: 'x'.repeat(4096) })],
  ['other code', JSON.stringify({ ...incomplete, code: 'other' })],
  ['other effect', JSON.stringify({ ...incomplete, effect: 'refused' })],
  ['unrecognized path', JSON.stringify({ ...incomplete, path: 'PRIVATE_PATH' })],
  ['zero requested', JSON.stringify({ ...incomplete, requested_chars: 0 })],
  ['negative delivered', JSON.stringify({ ...incomplete, delivered_chars: -1, retry_from_character: -1 })],
  ['fractional delivered', JSON.stringify({ ...incomplete, delivered_chars: 0.5, retry_from_character: 0.5 })],
  ['string count', JSON.stringify({ ...incomplete, requested_chars: '10' })],
  ['unsafe count', JSON.stringify({ ...incomplete, requested_chars: Number.MAX_SAFE_INTEGER + 1 })],
  ['complete count', JSON.stringify({ ...incomplete, delivered_chars: 10, retry_from_character: 10 })],
  ['inconsistent suffix', JSON.stringify({ ...incomplete, retry_from_character: 1 })],
])('safely omits %s incomplete diagnostics while preserving the original failure', (_label, structuredJson) => {
  const native = result({
    isError: true, errorCode: 'type_text_incomplete',
    ...(structuredJson === undefined ? {} : { structuredJson }),
  })
  const failure = incompleteFailure(native)
  expect(failure.rawResult).toBe(native)
  expect(failure.code).toBe('type_text_incomplete')
  expect(failure.message).toBe('Cua Driver did not complete text input (type_text_incomplete). Input may already have been delivered. Observe the current target before deciding the next step. Do not automatically retry or replay input.')
})

it.each([
  ['type_text', 'background_unavailable'],
  ['click', 'type_text_incomplete'],
  [undefined, 'type_text_incomplete'],
])('does not inspect structured data outside the exact %s / %s diagnostic boundary', (toolName, code) => {
  const native = result({ errorCode: code })
  Object.defineProperty(native, 'structuredJson', { get() { throw new Error('Must not inspect unrelated structured data') } })
  expect(() => nativeMcpResult(native, toolName)).toThrow(CuaDriverRefusalError)
  expect(() => nativeMcpResult(native, toolName)).not.toThrow('Must not inspect')
})
