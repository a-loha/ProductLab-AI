import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { loadWorkspace, saveWorkspace } from "./storage";
import {
  areaNames,
  collectEvidence,
  newMission,
  submitMission,
} from "./mission";
import type { Area, WorkspaceState } from "./mission";
import type { EvidenceId } from "./mission-content";
import type { Session } from "./simulation";
import { PracticeLesson } from "./Practice";
import { Workspace, MissionMetrics } from "./Workspace";
import type { EditDraft } from "./Workspace";
import { Development } from "./Development";
import { CheatSheet } from "./Help";
import { Icon, Pill } from "./ui";

export default function App() {
  const [initial] = useState(loadWorkspace),
    [state, setState] = useState(initial.state);
  const [notice, setNotice] = useState(initial.notice),
    [saved, setSaved] = useState(true),
    [cheatOpen, setCheatOpen] = useState(false),
    [lessonOpen, setLessonOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setSaved(saveWorkspace(state));
  }, [state]);
  useEffect(() => {
    main.current
      ?.querySelector<HTMLElement>("h1")
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [state.page, state.area, lessonOpen]);
  const go = (area: Area) => {
    setLessonOpen(false);
    setState((current) => ({ ...current, page: "workspace", area }));
  };
  const page = (page: WorkspaceState["page"]) => {
    setLessonOpen(false);
    setState((current) => ({ ...current, page }));
  };
  const edit: EditDraft = (recipe) =>
    setState((current) =>
      current.mission.submission
        ? current
        : {
            ...current,
            mission: {
              ...current.mission,
              draft: recipe(current.mission.draft),
            },
          },
    );
  const collect = (id: EvidenceId) =>
    setState((current) => ({
      ...current,
      mission: collectEvidence(current.mission, id),
    }));
  const submit = () =>
    setState((current) => {
      const mission = submitMission(current.mission);
      return {
        ...current,
        mission,
        page: mission.submission ? "development" : current.page,
      };
    });
  const openPractice = () => {
    setState((current) => ({ ...current, page: "playbook" }));
    setLessonOpen(true);
  };
  const updatePractice: Dispatch<SetStateAction<Session>> = (change) =>
    setState((current) => {
      const next =
        typeof change === "function" ? change(current.practice) : change;
      return {
        ...current,
        page: next.view === "simulation" ? "workspace" : current.page,
        practice: {
          ...next,
          view: "learning",
          currentScenario: current.practice.currentScenario,
        },
      };
    });
  function restart() {
    if (
      window.confirm(
        "Restart this workspace mission? This clears its draft, notebook, plan, and Mission Review. Your earlier cycle and optional lesson/transfer history are kept.",
      )
    ) {
      setLessonOpen(false);
      setState((current) => ({
        ...current,
        page: "workspace",
        area: "brief",
        mission: newMission(),
      }));
      setNotice(null);
    }
  }
  const title =
    state.page === "workspace"
      ? state.area === "brief"
        ? "Retention Crisis"
        : areaNames[state.area]
      : state.page === "development"
        ? "My Development"
        : "PM Playbook";
  return (
    <div className="app-layout workspace-app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => go("brief")}
          aria-label="ProductLab mission home"
        >
          <span className="brand-mark">
            P<span />
          </span>
          <span>
            ProductLab<span className="brand-ai">AI</span>
          </span>
        </button>
        <div className="workspace-label">YOUR PRODUCT TEAM</div>
        <div className="workspace-identity">
          <span className="pulse-logo">
            <Icon name="leaf" size={22} />
          </span>
          <div>
            <strong>Pulse</strong>
            <small>Subscription wellness · Mission 01</small>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Product areas">
          {[
            { id: "workspace", label: "Simulation Workspace", icon: "play" },
            { id: "playbook", label: "PM Playbook", icon: "book" },
            { id: "development", label: "My Development", icon: "chart" },
          ].map((item) => (
            <button
              key={item.id}
              aria-current={state.page === item.id ? "page" : undefined}
              onClick={() => page(item.id as WorkspaceState["page"])}
            >
              <Icon name={item.icon as "play"} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-mission">
          <span className="eyebrow">RETENTION CRISIS</span>
          <p>Bring your team an evidence-backed decision.</p>
          <Pill tone={state.mission.submission ? "green" : "purple"}>
            {state.mission.submission ? "Mission committed" : "Workspace open"}
          </Pill>
        </div>
        <div className="sidebar-bottom">
          <span className="eyebrow">PRACTICE THE FULL PM JOB</span>
          <p>
            Investigate. Align. Prioritize.
            <br />
            Create a decision the team can use.
          </p>
          <span className="privacy-label">
            Saved in this browser · No account
          </span>
        </div>
      </aside>
      <div className="main-layout">
        <header className="topbar">
          <div>
            <span>Pulse</span>
            <span className="breadcrumb-divider">/</span>
            <strong>Retention Crisis</strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`save-status ${!saved ? "unsaved" : ""}`}
              role="status"
            >
              <span />
              {saved
                ? "Workspace saved"
                : "This tab only · storage unavailable"}
            </span>
            <button
              className="button secondary cheat-trigger"
              onClick={() => setCheatOpen(true)}
            >
              <Icon name="book" size={16} />
              Cheat Sheet
            </button>
            <button
              className="reset-button"
              onClick={restart}
              aria-label="Restart workspace mission"
            >
              <Icon name="reset" size={15} />
              <span>Restart mission</span>
            </button>
          </div>
        </header>
        <main className="page-shell" ref={main}>
          {notice && (
            <div className="notice" role="status">
              <p>{notice}</p>
              <button
                aria-label="Dismiss storage notice"
                onClick={() => setNotice(null)}
              >
                ×
              </button>
            </div>
          )}
          {!saved && (
            <div className="notice warning" role="alert">
              Browser storage is unavailable. Your work remains usable in this
              tab, but cannot be retained after closing.
            </div>
          )}
          {!(state.page === "playbook" && lessonOpen) && (
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {state.page === "workspace"
                    ? "ONE COHESIVE MISSION · YOUR INVESTIGATION ORDER"
                    : "YOUR PRODUCT PRACTICE"}
                </span>
                <h1 tabIndex={-1}>{title}</h1>
                <p>
                  {state.page === "workspace"
                    ? "Explore the evidence. Make the trade-offs. Give Pulse a focused next step."
                    : state.page === "development"
                      ? "Specific evidence of your thinking, with useful next steps."
                      : "A focused practice shelf. Open what helps your current work."}
                </p>
              </div>
              {state.page === "workspace" && state.area !== "decision" && (
                <button
                  className="button secondary decision-shortcut"
                  onClick={() => go("decision")}
                >
                  Decision Brief{" "}
                  <span>{state.mission.notebook.length} sources</span>
                  <Icon name="arrow" size={16} />
                </button>
              )}
            </div>
          )}
          {state.page === "workspace" && (
            <>
              <MissionMetrics mission={state.mission} />
              <Workspace
                key={state.area}
                area={state.area}
                mission={state.mission}
                edit={edit}
                collect={collect}
                go={go}
                submit={submit}
                review={() => page("development")}
              />
            </>
          )}
          {state.page === "development" && (
            <Development state={state} go={go} practice={openPractice} />
          )}
          {state.page === "playbook" &&
            (lessonOpen ? (
              <>
                <button
                  className="text-button practice-return"
                  onClick={() => setLessonOpen(false)}
                >
                  ← Back to PM Playbook
                </button>
                <PracticeLesson
                  session={state.practice}
                  update={updatePractice}
                />
              </>
            ) : (
              <div className="playbook-grid">
                <section className="card playbook-intro">
                  <span className="eyebrow">
                    USE A REFERENCE, THEN GET BACK TO WORK
                  </span>
                  <h2>A small, useful playbook.</h2>
                  <p>
                    The global Cheat Sheet covers formulas, cohort rules,
                    discovery, testing, and prioritization. It opens alongside
                    any working area without changing your mission.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setCheatOpen(true)}
                  >
                    Open Cheat Sheet <Icon name="book" size={17} />
                  </button>
                </section>
                <section className="card learning-card">
                  <div className="section-heading">
                    <span className="icon-tile lavender">
                      <Icon name="book" />
                    </span>
                    <Pill>Optional · about 5 min</Pill>
                  </div>
                  <span className="eyebrow">
                    VERIFY → LOCALIZE → EXPLAIN → ACT
                  </span>
                  <h2>Diagnosing a Retention Drop</h2>
                  <p>
                    Practice a repeatable diagnostic process, then transfer it
                    to a new D7 onboarding problem. Your previous answers and
                    transfer results are preserved.
                  </p>
                  <button className="button primary" onClick={openPractice}>
                    {Object.keys(state.practice.lesson.answers).length
                      ? "Resume optional practice"
                      : "Open optional practice"}
                    <Icon name="arrow" size={17} />
                  </button>
                </section>
              </div>
            ))}
          <footer className="site-footer">
            <span>
              ProductLab AI <span>/</span> A virtual product workspace.
            </span>
            <span>Fictional business. Explicit rules. Your judgment.</span>
          </footer>
        </main>
      </div>
      <CheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
    </div>
  );
}
