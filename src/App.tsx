import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { checkCompatibility, LocalCoach, MAX_RESPONSE_LENGTH, MIN_RESPONSE_LENGTH } from './ai'
import type { Compatibility } from './ai'
import { criteria, InvalidFeedbackError } from './feedback'
import type { Feedback } from './feedback'

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'
type IconName = 'arrow' | 'spark' | 'shield' | 'chip' | 'check' | 'leaf' | 'down' | 'book' | 'alert'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" /></>,
    shield: <><path d="m12 3 8 3v6c0 4-4 7.5-8 9-4-1.5-8-5-8-9V6l8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    chip: <><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /><rect x="10" y="10" width="4" height="4" rx="1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    leaf: <><path d="M20 4c-9-1-16 3-16 9a7 7 0 0 0 7 7c6 0 10-7 9-16Z" /><path d="m4 20 10-10m-5 5v-5m0 5h5" /></>,
    down: <path d="m5 7 14 10m-7 0h7v-7" />,
    book: <><path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Zm0 0v14" /></>,
    alert: <><path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function errorMessage(error: unknown) {
  // WebLLM's worker protocol can reject with a string instead of an Error.
  if (typeof error === 'string') return error.slice(0, 400)
  return error instanceof Error ? error.message.slice(0, 400) : 'An unexpected local AI error occurred. Please try loading the model again.'
}

function FeedbackPanel({ feedback, changed }: { feedback: Feedback; changed: boolean }) {
  return <section className="card feedback-card" aria-labelledby="feedback-title">
    <div className="section-label"><span className="step-number">03</span> REFLECT & REFINE <span className="tag green">Generated on your device</span></div>
    <h2 id="feedback-title" tabIndex={-1}>A fresh perspective on your thinking.</h2>
    <p className="muted">Use this as a starting point for reflection. A small AI model can miss nuance or make mistakes.</p>
    {changed && <p className="notice">You’ve edited your response. Get feedback again to review your latest thinking.</p>}
    <div className="criterion-results">
      {criteria.map(({ key, title }) => {
        const item = feedback.criteria[key]
        return <div className="criterion-result" key={key}>
          <div className="result-heading"><h3>{title}</h3><span className={`rating ${item.rating === 'Strong' ? 'strong' : item.rating === 'Developing' ? 'developing' : 'needs-attention'}`}>{item.rating}</span></div>
          <p>{item.evidence}</p>
        </div>
      })}
    </div>
    <div className="feedback-columns">
      <div><h3><span className="mini-icon positive"><Icon name="check" size={17} /></span> Strengths</h3><ul>{feedback.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
      <div><h3><span className="mini-icon amber"><Icon name="alert" size={17} /></span> Mistakes & missing considerations</h3><ul>{feedback.gaps.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
    </div>
    <div className="learning-topic"><Icon name="book" /><div><span className="eyebrow">RECOMMENDED LEARNING TOPIC</span><p>{feedback.learningTopic}</p></div></div>
    <h3>Suggestions for improvement</h3>
    <ol className="improvements">{feedback.improvements.map((item, i) => <li key={i}>{item}</li>)}</ol>
  </section>
}

export default function App() {
  const [compatibility, setCompatibility] = useState<Compatibility | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [progress, setProgress] = useState({ value: 0, text: 'Preparing your local coach…' })
  const [modelError, setModelError] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [result, setResult] = useState<{ feedback: Feedback; response: string } | null>(null)
  const coach = useRef<LocalCoach | null>(null)
  const feedbackRegion = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    void checkCompatibility().then((result) => { if (active) setCompatibility(result) })
    return () => {
      active = false
      coach.current?.dispose()
      coach.current = null
    }
  }, [])

  async function loadModel() {
    if (!compatibility?.supported || modelStatus === 'loading' || modelStatus === 'ready') return
    const client = new LocalCoach()
    coach.current = client
    setModelStatus('loading')
    setModelError(null)
    setEvaluationError(null)
    setProgress({ value: 0, text: 'Preparing your local coach…' })
    try {
      await client.load((report) => {
        if (coach.current !== client) return
        const value = Number.isFinite(report.progress) ? Math.max(0, Math.min(100, Math.round(report.progress * 100))) : 0
        setProgress({ value, text: report.text })
      })
      if (coach.current === client) setModelStatus('ready')
    } catch (error) {
      if (coach.current !== client) return
      client.dispose()
      coach.current = null
      setModelStatus('error')
      setModelError(errorMessage(error))
    }
  }

  function stopModel() {
    coach.current?.dispose()
    coach.current = null
    setModelStatus('idle')
    setEvaluating(false)
    setEvaluationError(null)
  }

  async function evaluate(event: FormEvent) {
    event.preventDefault()
    const client = coach.current
    const submitted = response.trim()
    if (!client || modelStatus !== 'ready' || evaluating || submitted.length < MIN_RESPONSE_LENGTH || submitted.length > MAX_RESPONSE_LENGTH) return
    setEvaluating(true)
    setEvaluationError(null)
    // A previous result should never look like feedback for this pending submission.
    setResult(null)
    try {
      const feedback = await client.evaluate(submitted)
      if (coach.current !== client) return
      setResult({ feedback, response: submitted })
      window.setTimeout(() => {
        feedbackRegion.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
        feedbackRegion.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } catch (error) {
      if (coach.current !== client) return
      setEvaluationError(errorMessage(error))
      if (!(error instanceof InvalidFeedbackError)) {
        client.dispose()
        coach.current = null
        setModelStatus('error')
        setModelError('The local AI session stopped. Reload the model to try again; your response has been kept.')
      }
    } finally {
      if (coach.current === client || coach.current === null) setEvaluating(false)
    }
  }

  const enoughText = response.trim().length >= MIN_RESPONSE_LENGTH
  const canEvaluate = modelStatus === 'ready' && enoughText && !evaluating
  const modelStatusText = modelStatus === 'ready' ? 'Ready on your device' : modelStatus === 'loading' ? 'Setting up local AI' : modelStatus === 'error' ? 'Model needs attention' : compatibility === null ? 'Checking your browser' : compatibility.supported ? 'WebGPU available' : 'WebGPU unavailable'

  return <>
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="./" aria-label="ProductLab AI home"><span className="brand-mark">P<span /></span><span>ProductLab<span className="brand-ai">AI</span></span></a>
        <span className="header-divider" /><span className="header-caption">A little practice. Better product decisions.</span>
        <span className="prototype"><span /> EARLY EXPERIMENT</span>
      </div>
    </header>

    <main className="page-shell">
      <section className="intro" aria-labelledby="page-title">
        <div className="eyebrow intro-eyebrow"><span /> THE PRODUCT THINKING LAB</div>
        <h1 id="page-title">Build your judgment.<br /><span>One decision at a time.</span></h1>
        <p>A real product problem. Your next move. A little AI perspective.<br className="desktop-break" /> Practice the thinking behind good product management.</p>
        <div className="intro-meta"><span><Icon name="shield" size={16} /> Private by design</span><span className="meta-dot">·</span><span>Free to practice</span><span className="meta-dot">·</span><span>No account needed</span></div>
      </section>

      <div className="workspace-layout">
        <div className="exercise-column">
          <section className="card scenario-card" aria-labelledby="scenario-title">
            <div className="section-label"><span className="step-number">01</span> EXPLORE THE SCENARIO <span className="tag">RETENTION</span></div>
            <div className="scenario-heading"><div className="app-icon"><Icon name="leaf" size={24} /></div><div><span className="scenario-company">MORROW · WELLNESS APP</span><h2 id="scenario-title">A healthy app. A retention problem.</h2></div></div>
            <p>You’re the Product Manager at Morrow, a subscription app for guided meditation and movement. Something has changed: fewer new users are coming back.</p>

            <div className="retention-chart" role="img" aria-label="Day 30 user retention decreased from 28 percent in the previous cohort to 21 percent in the latest cohort, a drop of 7 percentage points or 25 percent relative.">
              <div className="chart-title">DAY 30 USER RETENTION <span>Fully matured signup cohorts</span></div>
              <div className="chart-content"><div className="chart-bars">
                <div className="chart-column"><strong>28<span>%</span></strong><div className="bar previous" /><span className="bar-label">Previous cohort</span></div>
                <span className="chart-arrow"><Icon name="down" size={24} /></span>
                <div className="chart-column"><strong>21<span>%</span></strong><div className="bar current" /><span className="bar-label">Latest cohort</span></div>
              </div><div className="chart-callout"><span className="decline"><Icon name="down" size={16} /> 7 pp</span><p>A 25% relative decline.<br />A signal to investigate.</p></div></div>
            </div>
            <p className="definition"><strong>What D30 means:</strong> the percentage of new users active on day 30 after signup. It measures user retention, rather than subscription renewal.</p>
            <blockquote><span className="quote-label">A MESSAGE FROM YOUR CEO</span>“Fewer people are sticking around. Should we launch a win-back campaign this week?”</blockquote>
            <div className="task"><h3>Your move</h3><p>How would you investigate the drop? Explain what you’d check, your leading hypotheses, and the actions you’d prioritize before deciding on a solution.</p></div>
            <div className="unknowns"><span className="info-mark">i</span><p>You don’t yet have sample sizes, segment breakdowns, tracking checks, or a history of recent changes. Make your assumptions explicit.</p></div>
          </section>

          <section className="card response-card" aria-labelledby="response-title">
            <div className="section-label"><span className="step-number">02</span> MAKE YOUR CALL</div>
            <h2 id="response-title">Walk us through your thinking.</h2>
            <p className="muted">There’s no single perfect answer. Show the reasoning behind your next steps.</p>
            <form onSubmit={evaluate}>
              <label className="sr-only" htmlFor="response">Your investigation plan</label>
              <textarea id="response" value={response} onChange={(event) => setResponse(event.target.value)} maxLength={MAX_RESPONSE_LENGTH} readOnly={evaluating} rows={9} placeholder="What would you check first, and why? Which hypotheses would you explore? What would you do next?" aria-describedby="response-help response-count" />
              <div className="textarea-footer"><span id="response-help">A few thoughtful paragraphs are plenty. At least {MIN_RESPONSE_LENGTH} characters.</span><span id="response-count">{response.length.toLocaleString()} / {MAX_RESPONSE_LENGTH.toLocaleString()}</span></div>
              {evaluationError && <div className="error-box" role="alert"><Icon name="alert" /><div><strong>Feedback couldn’t be completed</strong><p>{evaluationError}</p></div></div>}
              <div className="submit-row"><span className="submit-note"><Icon name="shield" size={16} /> Your response stays in this tab.</span><button className="button primary" type="submit" disabled={!canEvaluate}>{evaluating ? <><span className="spinner" /> Thinking locally…</> : <>Get feedback <Icon name="arrow" size={18} /></>}</button></div>
              <p className="form-status" role="status">{evaluating ? 'Your GPU is generating feedback. This can take a minute or two; keep this tab open.' : modelStatus !== 'ready' ? 'Load the local coach to get feedback. You can write your response first.' : !enoughText ? 'Your local coach is ready when your response is.' : 'Ready for a fresh perspective?'} {evaluating && <button className="text-button" type="button" onClick={stopModel}>Stop feedback</button>}</p>
            </form>
          </section>
          <div ref={feedbackRegion} className="feedback-region">{result && <FeedbackPanel feedback={result.feedback} changed={response.trim() !== result.response} />}</div>
        </div>

        <aside className="sidebar" aria-label="Local AI coach and evaluation guide">
          <section className="coach-card" aria-labelledby="coach-title">
            <div className="coach-icon"><Icon name="spark" size={24} /></div>
            <div className="eyebrow">A THINKING PARTNER, ON YOUR DEVICE</div>
            <h2 id="coach-title">Meet your local coach.</h2>
            <p>A small AI model gives you a second perspective on your decision. It runs entirely in your browser.</p>
            <div className={`compatibility-status ${compatibility?.supported ? 'available' : ''}`} role="status"><span className={`status-dot ${modelStatus === 'loading' || compatibility === null ? 'pulse' : ''}`} />{modelStatusText}</div>
            <div className="model-spec"><Icon name="chip" size={19} /><div><strong>Qwen 2.5 · 0.5B Instruct</strong><span>4-bit model · WebLLM · WebGPU</span></div></div>
            <p className="download-note">First use downloads several hundred MB of model files. Allow about 1.1 GB of free GPU memory. Downloads are cached when browser storage permits.</p>
            {modelStatus === 'loading' && <div className="loading-state">
              <div className="progress-label"><span>Downloading & initializing</span><strong>{progress.value}%</strong></div>
              <progress value={progress.value} max={100} aria-label="Model initialization progress" />
              <p className="progress-text" role="status">{progress.text}</p>
              <button type="button" className="text-button" onClick={stopModel}>Cancel loading</button>
            </div>}
            {modelStatus === 'error' && <div className="error-box model-error" role="alert"><div><strong>Couldn’t prepare local AI</strong><p>Check your connection, available GPU memory, and browser storage. A current desktop Chrome or Edge usually works best.</p><details><summary>Error details</summary><p>{modelError}</p></details></div></div>}
            {modelStatus === 'ready' ? <div className="ready-message"><Icon name="check" size={18} /> Ready. Let’s see how you think.</div> : modelStatus !== 'loading' && <button type="button" className="button primary load-button" onClick={() => void loadModel()} disabled={!compatibility?.supported}><Icon name="spark" size={17} />{modelStatus === 'error' ? 'Retry loading model' : 'Load local coach'}<Icon name="arrow" size={18} /></button>}
            {compatibility && !compatibility.supported && <p className="compatibility-help" role="alert">{compatibility.message}</p>}
            <div className="coach-footer"><Icon name="shield" size={14} /> No API keys. No inference fees.</div>
          </section>

          <section className="rubric-card" aria-labelledby="rubric-title"><div className="eyebrow">WHAT YOU’LL PRACTICE</div><h2 id="rubric-title">The thinking behind the answer.</h2><p>Your coach looks at four dimensions:</p><ol>{criteria.map(({ key, title, detail }, index) => <li key={key}><span className="rubric-number">0{index + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol></section>
          <div className="privacy-note"><Icon name="shield" size={20} /><p><strong>Your thinking stays yours.</strong><br />Your response and feedback stay in memory and are cleared on refresh. Only model files are fetched from public hosts; your answer is never sent to a server.</p></div>
        </aside>
      </div>
      <footer className="site-footer"><span>ProductLab AI <span className="footer-dot">/</span> A small experiment in learning by doing.</span><span>Built for curiosity.</span></footer>
    </main>
  </>
}
