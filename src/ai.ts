import type { InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm'
import { evaluationPrompt, feedbackSchema, InvalidFeedbackError, parseFeedback } from './feedback'

// Supported by WebLLM's prebuiltAppConfig. f32 avoids requiring shader-f16 support.
export const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC'
export const MAX_RESPONSE_LENGTH = 3000
export const MIN_RESPONSE_LENGTH = 40

export type Compatibility = { supported: boolean; message: string }

export async function checkCompatibility(): Promise<Compatibility> {
  if (!window.isSecureContext) {
    return { supported: false, message: 'WebGPU needs a secure context. Open the app on localhost or serve it over HTTPS.' }
  }
  // Keep WebGPU types local: only the adapter probe is needed before WebLLM takes over.
  const gpu = (navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown | null> }
  }).gpu
  if (!gpu) {
    return { supported: false, message: 'WebGPU is not available. Try a current desktop Chrome or Edge with hardware acceleration enabled. You can still practice the scenario below.' }
  }
  try {
    const adapter = await gpu.requestAdapter()
    return adapter
      ? { supported: true, message: 'WebGPU adapter found. Model loading will check whether your GPU has enough memory.' }
      : { supported: false, message: 'No usable WebGPU adapter was found. Enable hardware acceleration, update your graphics driver, or try another device.' }
  } catch {
    return { supported: false, message: 'The browser could not access your GPU. Check hardware acceleration and graphics drivers, then reload this page.' }
  }
}

/** One worker, one model, one evaluation at a time. No server or API client. */
export class LocalCoach {
  private worker: Worker | null = null
  private engine: WebWorkerMLCEngine | null = null
  private controller = new AbortController()

  private async guarded<T>(operation: Promise<T>, timeout: number, timeoutMessage: string): Promise<T> {
    let cleanup = () => {}
    const failure = new Promise<never>((_, reject) => {
      const fail = () => reject(new Error('The local AI worker stopped. Reload the model and try again.'))
      const abort = () => reject(new DOMException('Local model stopped.', 'AbortError'))
      const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeout)
      const worker = this.worker
      worker?.addEventListener('error', fail)
      worker?.addEventListener('messageerror', fail)
      this.controller.signal.addEventListener('abort', abort, { once: true })
      cleanup = () => {
        window.clearTimeout(timer)
        worker?.removeEventListener('error', fail)
        worker?.removeEventListener('messageerror', fail)
        this.controller.signal.removeEventListener('abort', abort)
      }
      if (this.controller.signal.aborted) abort()
    })
    try {
      return await Promise.race([operation, failure])
    } finally {
      cleanup()
    }
  }

  async load(onProgress: (report: InitProgressReport) => void) {
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
    if (this.controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    this.worker = new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' })
    this.engine = await this.guarded(
      CreateWebWorkerMLCEngine(this.worker, MODEL_ID, { initProgressCallback: onProgress, logLevel: 'WARN' }),
      8 * 60_000,
      'Model loading took too long. Check your connection, browser storage, and GPU memory, then try again.',
    )
  }

  async evaluate(response: string) {
    if (!this.engine) throw new Error('Load the local model before requesting feedback.')
    const completion = await this.guarded(this.engine.chat.completions.create({
      messages: [
        { role: 'system', content: evaluationPrompt },
        { role: 'user', content: `Evaluate this learner response:\n<learner_response>\n${response}\n</learner_response>` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object', schema: JSON.stringify(feedbackSchema) },
    }), 3 * 60_000, 'Feedback took too long on this device. Reload the model and try a shorter response.')
    const choice = completion.choices[0]
    if (choice?.finish_reason !== 'stop') throw new InvalidFeedbackError()
    return parseFeedback(choice.message.content)
  }

  dispose() {
    this.controller.abort()
    this.worker?.terminate()
    this.worker = null
    this.engine = null
  }
}
