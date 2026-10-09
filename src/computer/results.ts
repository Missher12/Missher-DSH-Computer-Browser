/** Structured failure projection for the pinned Cua Driver SDK. @module */

import { HarnessError } from '@deepseek-ai/dsh-llm'
import type { ToolResult } from '@trycua/cua-driver'

/** Provider error retaining the SDK result for direct same-process callers. */
export class CuaDriverRefusalError extends HarnessError {
  /**
   * @param code - SDK failure code or the fallback action-refused identity.
   * @param rawResult - original SDK envelope, never copied to durable metadata.
   * @param toolName - exact upstream tool name, required for tool-specific diagnostics.
   */
  constructor(code: string, readonly rawResult: ToolResult, toolName?: string) {
    super(code === 'type_text_incomplete' && toolName === 'type_text'
      ? incompleteTextMessage(rawResult)
      : refusalMessage(code), /^[a-z][a-z0-9_]{0,79}$/u.test(code) ? code : 'driver_refusal')
    this.name = 'CuaDriverRefusalError'
  }
}

/**
 * Preserve successful MCP results and reject explicit SDK failure metadata.
 * Cua 0.28 ActionEffect.Refused is 4. Page text is never searched for errors.
 * @param result - typed result from the pinned native SDK.
 * @param toolName - upstream tool identity for pinned diagnostics and exact-message fallback.
 * @returns the untouched raw MCP result for the existing image/result adapter.
 */
export function nativeMcpResult(result: ToolResult, toolName?: string): unknown {
  if (result.errorCode !== undefined || Number(result.action?.effect) === 4) {
    throw new CuaDriverRefusalError(result.errorCode ?? 'action_refused', result, toolName)
  }
  const raw: unknown = JSON.parse(result.rawJson)
  if (result.isError && (typeof raw !== 'object' || raw === null || !('isError' in raw) || raw.isError !== true)) {
    throw new CuaDriverRefusalError('driver_error', result)
  }
  // Cua 0.28.0 can omit both typed refusal fields for this exact browser denial.
  const consent = 'refused (browser_consent_required): this standalone browser profile requires explicit existing-profile approval before Cua can inspect its DevTools endpoint'
  if (toolName === 'get_browser_state' && result.text === consent) {
    throw new CuaDriverRefusalError('browser_consent_required', result)
  }
  return raw
}

/** Check the actual MCP image payload; paths or typed metadata alone cannot ground input. */
export function hasWindowScreenshot(result: ToolResult): boolean {
  try {
    const raw: unknown = JSON.parse(result.rawJson)
    return isRecord(raw) && raw.isError !== true && Array.isArray(raw.content) && raw.content.some((block: unknown) =>
      isRecord(block) && block.type === 'image' && block.mimeType === 'image/png' && typeof block.data === 'string' && completePng(block.data))
  } catch {
    return false
  }
}

// This validates the PNG container and positive dimensions, not rendered freshness.
// The Host's existing attachment adapter remains responsible for image decoding.
function completePng(base64: string): boolean {
  if (base64.length === 0 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(base64)) return false
  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length < 57 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false
  let offset = 8
  let data = false
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const end = offset + length + 12
    if (end > bytes.length) return false
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (offset === 8 && (type !== 'IHDR' || length !== 13 || bytes.readUInt32BE(offset + 8) === 0 || bytes.readUInt32BE(offset + 12) === 0)) return false
    if (type === 'IDAT' && length > 0) data = true
    if (type === 'IEND') return length === 0 && data && end === bytes.length
    offset = end
  }
  return false
}

function incompleteTextMessage(result: ToolResult): string {
  const message = 'Cua Driver did not complete text input (type_text_incomplete).'
  const guidance = 'Input may already have been delivered. Observe the current target before deciding the next step. Do not automatically retry or replay input.'
  let diagnostic = ''
  // Only this pinned technical object is inspected; never expose raw text or images.
  const encoded = result.structuredJson
  if (typeof encoded === 'string' && encoded.length <= 4096) {
    try {
      const detail: unknown = JSON.parse(encoded)
      if (isRecord(detail) && detail.code === 'type_text_incomplete' && detail.effect === 'partial'
        && (detail.path === 'ax' || detail.path === 'key_events' || detail.path === 'key_events_fg')
        && isCount(detail.requested_chars) && detail.requested_chars > 0
        && isCount(detail.delivered_chars) && detail.delivered_chars < detail.requested_chars
        && detail.retry_from_character === detail.delivered_chars) {
        diagnostic = ` SDK read-back: effect=partial, path=${detail.path}, requested_chars=${detail.requested_chars}, delivered_chars=${detail.delivered_chars}, retry_from_character=${detail.delivered_chars}.`
      }
    } catch {
      // Malformed diagnostics must not replace the original native failure.
    }
  }
  return `${message}${diagnostic} ${guidance}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function refusalMessage(code: string): string {
  switch (code) {
    case 'browser_consent_required':
      return 'Browser access needs approval in the desktop authorization dialog. A model or page cannot approve it.'
    case 'browser_consent_denied':
    case 'authorization_denied':
      return 'Browser access was denied. Do not retry or switch to foreground control without user authorization.'
    case 'facility_unavailable':
      return 'This desktop facility is unavailable. Use an available observation method; do not assume input was delivered.'
    case 'background_unavailable':
      return 'Background input is unavailable for this target. This refusal does not authorize foreground input.'
    default:
      return `Cua Driver refused the operation (${/^[a-z][a-z0-9_]{0,79}$/u.test(code) ? code : 'driver_refusal'}). Observe the current target before deciding the next step.`
  }
}
