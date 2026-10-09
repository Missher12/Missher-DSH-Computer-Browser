/** Real image admission services; the model only declares capabilities and never runs. */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import LocalAttachmentStore from '@deepseek-ai/dsh-attachment-local'
import { LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@deepseek-ai/dsh-llm'

export const imageRoute = { provider: 'native-image-fixture', model: 'vision' }

class ImageModel extends LlmAdapter {
  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model, inputModalities: ['text', 'image'] })
  }

  stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    throw new Error('The native provider fixture must not generate model responses')
  }
}

export async function mountImageAdmission(ctx: Context): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-native-images-'))
  ctx.effect(() => async () => { await rm(root, { recursive: true, force: true }) })
  await ctx.plugin(LocalAttachmentStore, { dshHome: root })
  ctx.llm.registerAdapter([imageRoute.provider], new ImageModel())
}
