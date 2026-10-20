import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { criteria, InvalidFeedbackError, parseFeedback } from '../src/feedback'

// These fixtures exercise the real WebLLM client/worker protocol, not GPU inference.
const feedback = {
  criteria: Object.fromEntries(criteria.map(({ key }) => [key, { rating: 'Developing', evidence: 'You check cohorts before choosing a campaign.' }])),
  strengths: ['You separate investigation from solution selection.'],
  gaps: ['Include a check of instrumentation health.'],
  learningTopic: 'Cohort retention analysis',
  improvements: ['Compare retention by acquisition channel, then test the strongest hypothesis.'],
}
const response = 'I would verify cohort sizes and retention definitions, segment by acquisition channel, and interview churned users before deciding whether to run a campaign.'

type WorkerMode = 'valid' | 'invalid' | 'truncated' | 'load-error' | 'hang-load' | 'runtime-error' | 'crash' | 'hang-eval'

async function prepareCoach(page: Page, mode: WorkerMode = 'valid') {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: { requestAdapter: async () => ({}) } })
  })
  // Intercept ONLY the worker asset. Production application code is unchanged.
  await page.route(/\/assets\/llm\.worker-[^/]+\.js$/, async (route) => {
    await route.fulfill({ contentType: 'application/javascript', body: `
      const mode = ${JSON.stringify(mode)};
      const feedback = ${JSON.stringify(feedback)};
      self.onmessage = ({data: message}) => {
        const reply = (kind, content) => self.postMessage({kind, content, uuid:message.uuid});
        if (message.kind === 'reload') {
          if (!message.content.modelId.includes('Qwen2.5-0.5B-Instruct-q4f32_1-MLC')) throw Error('Unexpected model');
          self.postMessage({kind:'initProgressCallback',uuid:'',content:{progress:0.42,text:'Loading model files (test worker)',timeElapsed:1}});
          if (mode === 'hang-load') return;
          setTimeout(() => mode === 'load-error' ? reply('throw','Model download failed: test network error') : reply('return',null), 450);
        }
        if (message.kind === 'chatCompletionNonStreaming') {
          const request = message.content.request;
          if (request.response_format.type !== 'json_object' || !request.messages[1].content.includes('cohort')) throw Error('Evaluation request is incomplete');
          if (mode === 'crash') throw Error('Test worker crash');
          if (mode === 'hang-eval') return;
          if (mode === 'runtime-error') return reply('throw','GPU device lost (test worker)');
          reply('return', {choices:[{finish_reason:mode === 'truncated' ? 'length' : 'stop',message:{role:'assistant',content:mode === 'invalid' ? '{"strengths":[]}' : JSON.stringify(feedback)}}]});
        }
      };
    ` })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Load local coach' }).click()
}

test('unsupported WebGPU is explained and the scenario remains usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }))
  await page.goto('/')
  await expect(page.getByText('WebGPU is not available.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load local coach' })).toBeDisabled()
  await page.getByLabel('Your investigation plan').fill(response)
  await expect(page.getByRole('button', { name: 'Get feedback' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'A healthy app. A retention problem.' })).toBeVisible()
})

for (const outcome of ['null', 'reject'] as const) {
  test(`adapter ${outcome} produces a useful compatibility message`, async ({ page }) => {
    await page.addInitScript((outcome) => Object.defineProperty(navigator, 'gpu', { value: {
      requestAdapter: async () => { if (outcome === 'reject') throw Error('Not available'); return null },
    } }), outcome)
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText(outcome === 'null' ? 'No usable WebGPU adapter' : 'could not access your GPU')
    await expect(page.getByRole('button', { name: 'Load local coach' })).toBeDisabled()
  })
}

test('loading progress, structured feedback, and revised drafts work through the worker client', async ({ page }) => {
  const outbound: string[] = []
  page.on('request', (request) => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outbound.push(request.url()) })
  await prepareCoach(page)
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '42')
  await expect(page.getByText('Ready. Let’s see how you think.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Get feedback' })).toBeDisabled()
  await page.getByLabel('Your investigation plan').fill(response)
  await page.getByRole('button', { name: 'Get feedback' }).click()
  await expect(page.getByRole('heading', { name: 'A fresh perspective on your thinking.' })).toBeVisible()
  for (const { title } of criteria) await expect(page.locator('.criterion-results').getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(page.getByText(feedback.strengths[0])).toBeVisible()
  await expect(page.getByText(feedback.gaps[0])).toBeVisible()
  await expect(page.getByText(feedback.learningTopic)).toBeVisible()
  await expect(page.getByText(feedback.improvements[0])).toBeVisible()
  await page.getByLabel('Your investigation plan').fill(response + ' I would also review tracking.')
  await expect(page.getByText('You’ve edited your response.', { exact: false })).toBeVisible()
  expect(outbound).toEqual([])
  await page.reload()
  await expect(page.getByLabel('Your investigation plan')).toHaveValue('')
  await expect(page.getByText('A fresh perspective on your thinking.')).toHaveCount(0)
})

for (const mode of ['invalid', 'truncated'] as const) {
  test(`${mode} feedback is rejected without losing the answer`, async ({ page }) => {
    await prepareCoach(page, mode)
    await expect(page.getByText('Ready. Let’s see how you think.')).toBeVisible()
    await page.getByLabel('Your investigation plan').fill(response)
    await page.getByRole('button', { name: 'Get feedback' }).click()
    await expect(page.getByRole('alert')).toContainText('incomplete or invalid feedback')
    await expect(page.getByLabel('Your investigation plan')).toHaveValue(response)
    await expect(page.getByRole('button', { name: 'Get feedback' })).toBeEnabled()
    await expect(page.getByText('A fresh perspective on your thinking.')).toHaveCount(0)
  })
}

test('download errors retain the underlying message and offer retry', async ({ page }) => {
  await prepareCoach(page, 'load-error')
  await expect(page.getByRole('button', { name: 'Retry loading model' })).toBeEnabled()
  await page.getByText('Error details').click()
  await expect(page.getByText('Model download failed: test network error')).toBeVisible()
})

for (const mode of ['runtime-error', 'crash'] as const) {
  test(`${mode} stops the session and preserves the response`, async ({ page }) => {
    await prepareCoach(page, mode)
    await expect(page.getByText('Ready. Let’s see how you think.')).toBeVisible()
    await page.getByLabel('Your investigation plan').fill(response)
    await page.getByRole('button', { name: 'Get feedback' }).click()
    await expect(page.getByRole('button', { name: 'Retry loading model' })).toBeEnabled()
    await expect(page.getByLabel('Your investigation plan')).toHaveValue(response)
    await expect(page.getByRole('button', { name: 'Get feedback' })).toBeDisabled()
  })
}

test('a download can be cancelled', async ({ page }) => {
  await prepareCoach(page, 'hang-load')
  await page.getByRole('button', { name: 'Cancel loading' }).click()
  await expect(page.getByRole('button', { name: 'Load local coach' })).toBeEnabled()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
})

test('feedback can be stopped while retaining the response', async ({ page }) => {
  await prepareCoach(page, 'hang-eval')
  await expect(page.getByText('Ready. Let’s see how you think.')).toBeVisible()
  await page.getByLabel('Your investigation plan').fill(response)
  await page.getByRole('button', { name: 'Get feedback' }).click()
  await page.getByRole('button', { name: 'Stop feedback' }).click()
  await expect(page.getByRole('button', { name: 'Load local coach' })).toBeEnabled()
  await expect(page.getByLabel('Your investigation plan')).toHaveValue(response)
  await expect(page.getByLabel('Your investigation plan')).toBeEditable()
})

test('mobile layout fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Meet your local coach.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('feedback validator accepts valid JSON and a single code fence', () => {
  expect(parseFeedback(JSON.stringify(feedback))).toEqual(feedback)
  expect(parseFeedback('```json\n' + JSON.stringify(feedback) + '\n```')).toEqual(feedback)
})

test('feedback validator rejects malformed, missing, empty, oversized, and invalid fields', () => {
  const invalid = [
    null, '', 'not JSON', JSON.stringify([]), JSON.stringify({ ...feedback, criteria: {} }),
    JSON.stringify({ ...feedback, strengths: [] }), JSON.stringify({ ...feedback, learningTopic: ' ' }),
    JSON.stringify({ ...feedback, gaps: ['a'.repeat(501)] }),
    JSON.stringify({ ...feedback, criteria: { ...feedback.criteria, hypotheses: { rating: 'Perfect', evidence: 'A claim.' } } }),
  ]
  for (const value of invalid) expect(() => parseFeedback(value)).toThrow(InvalidFeedbackError)
})
