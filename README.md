# ProductLab AI

A small, free Product Management learning simulator. Read one retention scenario, explain your investigation plan, and get structured feedback from a model running locally in your browser.

React + TypeScript + Vite, with [WebLLM](https://webllm.mlc.ai/). No backend, account, database, analytics, API keys, or paid inference service.

## Use entirely through GitHub

GitHub Pages can serve this static application for free from this public repository. You do not need Node, npm, or project files on your Mac to use the published app.

One-time setup in the GitHub website:

1. Open this repository's **Settings → Pages**. Under **Build and deployment**, select **GitHub Actions** as the source.
2. Merge the application and `.github/workflows/pages.yml` into `main`.
3. Open **Actions → Build and publish ProductLab AI** and wait for the deployment to finish successfully.
4. Open the website URL shown by the `github-pages` deployment. Use current desktop Chrome or Edge with WebGPU enabled.

The workflow installs dependencies, builds the app, and uploads only the generated `dist` files. Pull requests get a build check; pushes to `main` publish the site. Future changes can be made in Codex or GitHub's web editor, then merged through a pull request. An existing `main` commit can also be published using **Actions → Build and publish ProductLab AI → Run workflow** with the `main` branch selected.

The Vite build uses relative asset URLs so the app, icon, lazy runtime, and worker can load under the `/ProductLab-AI/` project path. Opening a downloaded `index.html` using `file://` still does not launch React; open the deployed HTTPS website instead.

GitHub hosts the application files. AI inference still uses your own browser and GPU. The first visit downloads the model into browser storage, so this does not remove the WebGPU or model download requirements. No API key or inference server is involved.

## Run locally

Use Node.js **20.19+ or 22.12+** (Node 24 is supported) and npm.

```sh
git clone https://github.com/a-loha/ProductLab-AI.git
cd ProductLab-AI
npm ci
npm run dev
```

Open the local address printed by Vite in a current **desktop Chrome or Edge**, with hardware acceleration enabled. WebGPU needs **localhost or HTTPS**; an ordinary HTTP LAN address will not work. Other browsers and devices may work where WebGPU is available, but have not been validated.

1. Click **Load local coach**. The app first probes for a WebGPU adapter.
2. Wait for model download and GPU initialization; progress appears in the coach card. You can write your response while it loads.
3. Describe how you would investigate the D30 retention drop from **28% to 21%**.
4. Click **Get feedback** to review problem framing, data-driven reasoning, hypothesis quality, and prioritization, plus strengths, missing considerations, a learning topic, and improvements.

The model is **`Qwen2.5-0.5B-Instruct-q4f32_1-MLC`**, a supported, quantized instruction model from WebLLM's built-in model list. The f32 variant avoids requiring the optional `shader-f16` feature. WebLLM estimates **1,060 MB of GPU memory**; allow additional headroom. Initial model downloads total several hundred MB and may take a few minutes. Browser caching can reduce later downloads but depends on storage availability. Even cached models must initialize again after a page reload. The WebLLM runtime is loaded only when you request the coach.

Internet access is needed for the initial model/runtime download from `huggingface.co`, its file redirect hosts (typically `cas-bridge.xethub.hf.co` or other `*.hf.co` hosts), and `raw.githubusercontent.com`. Responses are never sent to these hosts. There is no server inference fallback. This prototype does not promise fully offline startup.

Your response and feedback are held only in tab memory and cleared on refresh. Model artifacts may remain in browser storage. Never enter confidential information into an experimental learning tool.

## Build and checks

```sh
npm run build
npm run preview
```

The build type-checks the application and emits static files in `dist/`. Vite reports a large-chunk warning for WebLLM's bundled runtime; the runtime is deliberately loaded on demand, and its worker is emitted separately.

```sh
# Once, if Chromium is not already installed:
npx playwright install chromium
npm run build
npm test
```

Tests use `/usr/bin/chromium` when present, otherwise Playwright's installed Chromium. Set `CHROMIUM_PATH` to use another Chromium executable. The test runner starts the built application on port 4173.

The 14 automated checks cover missing/unavailable WebGPU adapters, loading progress, successful feedback rendering, revised drafts, malformed/truncated output, download and worker errors, cancellation, mobile overflow, and feedback validation. **Model-dependent tests simulate the worker protocol; they do not download a model or prove GPU inference works.** No test feedback is used by the application.

## What still needs a real GPU browser

The production build and automated checks passed in the cloud environment. Its headless Chromium exposed WebGPU but returned no usable adapter, and its network policy blocked Hugging Face. Actual model download, initialization, and inference therefore remain **unverified**.

Before judging this proof of concept, run these checks on a supported GPU browser:

- Complete a cold download, then reload and verify cache reuse and initialization progress. Check network/storage errors and a retry.
- Submit a strong investigation plan, a solution-first answer, and an irrelevant answer. Confirm the four ratings and actionable feedback reflect what was actually written. Repeat an answer to assess consistency.
- Inspect the Network panel: evaluating a response should make **no inference HTTP request**. All generation happens in the local WebLLM worker.
- Check inference speed and memory on your target laptop, and recovery after GPU/device loss or closing the tab. Test a long response and an instruction-injection attempt.
- Try another supported browser/device before claiming cross-browser or mobile inference support. The mobile layout is tested; mobile GPU inference is not.

The 0.5B model favors a small download over nuanced coaching. JSON-constrained generation and runtime validation protect the feedback display, but cannot ensure the advice is accurate, fair, or useful. Feedback is a reflection aid, not an authoritative score. Loading times out after eight minutes; feedback after three minutes. Cancelling terminates the worker and requires loading the coach again. Invalid or truncated feedback is rejected while preserving the response for retry.

## Small code map

- `src/App.tsx`: scenario, response form, loading/error states, and feedback display.
- `src/ai.ts` and `src/llm.worker.ts`: compatibility probe and local WebLLM lifecycle.
- `src/feedback.ts`: original scenario, evaluation rubric, JSON schema, and output validation.
- `src/styles.css`: responsive styling with system fonts and no external assets.
