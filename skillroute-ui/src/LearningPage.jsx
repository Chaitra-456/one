import { useCallback, useEffect, useMemo, useState } from "react";
import "./LearningPage.css";

const API_BASE = "http://localhost:8081/api";
const FALLBACK_C_TOPICS = [
  { stage: "Basics", topics: ["Introduction, Structure and Setup", "Variables and Constants", "Data Types", "Input and Output"] },
  { stage: "Operators", topics: ["Arithmetic Operators", "Relational and Logical Operators", "Assignment and Increment Operators", "Bitwise and Conditional Operators"] },
  { stage: "Decision Making", topics: ["if and if-else", "Nested if and else-if Ladder", "switch Statement"] },
  { stage: "Loops", topics: ["while Loop", "do-while Loop", "for Loop", "Nested Loops"] },
  { stage: "Functions", topics: ["Function Basics", "Parameters and Return Values", "Recursion"] },
  { stage: "Arrays and Strings", topics: ["One-dimensional Arrays", "Multidimensional Arrays", "Strings"] },
  { stage: "Pointers", topics: ["Pointer Basics", "Pointers and Arrays", "Pointers and Functions"] },
  { stage: "Structures", topics: ["Structures", "Unions and Enumerations"] },
  { stage: "File Handling", topics: ["Reading and Writing Files", "File Modes and Error Handling"] },
  { stage: "Dynamic Memory", topics: ["malloc and calloc", "realloc and free"] },
  { stage: "Problem Solving", topics: ["Debugging", "Practice Problems", "Mini Projects"] },
];
const FALLBACK_RESOURCES = [
  { title: "Programiz C Tutorial", type: "Article", url: "https://www.programiz.com/c-programming" },
  { title: "GeeksforGeeks C Programming", type: "Article", url: "https://www.geeksforgeeks.org/c/c-programming-language/" },
  { title: "Microsoft C documentation", type: "Docs", url: "https://learn.microsoft.com/en-us/cpp/c-language/" },
  { title: "Learn-C interactive tutorial", type: "Practice", url: "https://www.learn-c.org/" },
  { title: "Online C compiler", type: "Practice", url: "https://www.onlinegdb.com/online_c_compiler" },
  { title: "GitHub C repositories", type: "GitHub", url: "https://github.com/topics/c" },
];

const normal = (v) => String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const pick = (obj, keys, fallback = "") => {
  for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null && obj[key] !== "") return obj[key];
  return fallback;
};
const idOf = (obj) => pick(obj, ["id", "stageId", "stage_id", "stepId", "step_id", "resourceId", "resource_id"]);
const titleOf = (obj) => String(pick(obj, ["title", "name", "topicName", "topic_name", "stepName", "step_name", "label"], "Untitled topic"));
const typeOf = (obj) => {
  const raw = normal(pick(obj, ["type", "resourceType", "resource_type", "category", "kind"], "resource"));
  if (/video|youtube|lecture/.test(raw)) return "Video";
  if (/article|blog|tutorial|guide/.test(raw)) return "Article";
  if (/doc|documentation|reference/.test(raw)) return "Docs";
  if (/github|repo|source code/.test(raw)) return "GitHub";
  if (/practice|compiler|exercise|coding/.test(raw)) return "Practice";
  if (/reddit|community|stackoverflow|stack overflow|forum/.test(raw)) return "Community";
  return raw ? raw.replace(/\b\w/g, c => c.toUpperCase()) : "Resource";
};
const urlOf = (obj) => pick(obj, ["url", "link", "resourceUrl", "resource_url", "href", "youtubeUrl", "youtube_url"], "");
const descOf = (obj) => pick(obj, ["description", "summary", "content", "details"], "");
const youtubeId = (url) => {
  if (!url) return "";
  try { const u = new URL(url); if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0]; return u.searchParams.get("v") || u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || ""; } catch { return ""; }
};
const thumbnailOf = (resource) => { const id = youtubeId(urlOf(resource)); return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : pick(resource, ["thumbnail", "thumbnailUrl", "thumbnail_url", "imageUrl", "image_url"], ""); };
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} (${url})`);
  return response.json();
}
function unwrap(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["data", "content", "items", "results", "records"]) if (Array.isArray(value?.[key])) return value[key];
  return [];
}
function resourceCard(resource, compact = false, onWatch = null) {
  const title = titleOf(resource);
  const url = urlOf(resource);
  const type = typeOf(resource);
  const thumb = type === "Video" ? thumbnailOf(resource) : "";
  const isVideo = type === "Video";
  const Tag = isVideo && onWatch ? "button" : "a";
  return (
    <Tag className={`lr-resource ${compact ? "lr-resource-compact" : ""} ${type === "Video" ? "lr-video-resource" : ""}`} href={!isVideo ? (url || undefined) : undefined} type={isVideo && onWatch ? "button" : undefined} target={!isVideo && url ? "_blank" : undefined} rel={!isVideo && url ? "noreferrer" : undefined} key={`${title}-${url}`} onClick={isVideo && onWatch ? () => onWatch(resource) : (!url ? (e) => e.preventDefault() : undefined)}>
      {thumb ? <span className="lr-video-thumb"><img src={thumb} alt={`${title} thumbnail`} loading="lazy" /><i>▶</i></span> : <span className={`lr-type lr-type-${normal(type).replace(/\s+/g, "-")}`}>{type}</span>}
      <span className="lr-resource-copy"><strong>{title}</strong><small>{type === "Video" ? "VIDEO LESSON" : type.toUpperCase()}{!compact && descOf(resource) ? ` · ${descOf(resource)}` : ""}</small></span>
      <span className={`lr-watch-button ${compact ? "lr-watch-compact" : ""}`} aria-hidden="true">{type === "Video" ? "Watch ↗" : "Open ↗"}</span>
    </Tag>
  );
}

export default function LearningPage({ language, languages = [], onSelectLanguage, onBack }) {
  const isChooser = language?.id === "__language_chooser__";
  const [paths, setPaths] = useState([]);
  const [stages, setStages] = useState([]);
  const [stageSteps, setStageSteps] = useState({});
  const [stepResources, setStepResources] = useState({});
  const [pathResources, setPathResources] = useState([]);
  const [activeStageId, setActiveStageId] = useState(null);
  const [activeStepId, setActiveStepId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStages, setExpandedStages] = useState({});
  const [showExploreMore, setShowExploreMore] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");

  const selectedPath = useMemo(() => paths.find(p => normal(titleOf(p)) === normal(language?.name)) || paths.find(p => normal(titleOf(p)).includes(normal(language?.name)) || normal(language?.name).includes(normal(titleOf(p)))) || paths[0] || null, [paths, language]);
  const activeStage = stages.find(s => String(idOf(s)) === String(activeStageId)) || stages[0] || null;
  const steps = activeStage ? (stageSteps[String(idOf(activeStage))] || []) : [];
  const activeStep = steps.find(s => String(idOf(s)) === String(activeStepId)) || steps[0] || null;
  const activeResources = activeStep ? (stepResources[String(idOf(activeStep))] || []) : [];
  const databaseVideos = activeResources.filter(r => typeOf(r) === "Video");
  const videoResources = [
    ...youtubeVideos,
    ...databaseVideos.filter(resource => {
      const existingId = youtubeId(urlOf(resource));
      return !existingId || !youtubeVideos.some(video => youtubeId(urlOf(video)) === existingId);
    })
  ];
  const currentVideo = playingVideo || videoResources[0] || null;
  const nonVideoResources = activeResources;
  const otherResources = pathResources.filter(r => typeOf(r) !== "Video");
  const groupedResources = useMemo(() => {
    const groups = ["Article", "Docs", "GitHub", "Community", "Practice"];
    const result = groups.map(type => ({ type, items: otherResources.filter(r => typeOf(r) === type) })).filter(group => group.items.length);
    const known = new Set(groups);
    const other = otherResources.filter(r => !known.has(typeOf(r)));
    if (other.length) result.push({ type: "Other resources", items: other });
    return result.map(group => ({ ...group, items: group.items.filter((item, index, arr) => arr.findIndex(other => normal(titleOf(other)) === normal(titleOf(item)) && urlOf(other) === urlOf(item)) === index) }));
  }, [otherResources]);
  const fallbackGroups = language?.id === "c" ? FALLBACK_C_TOPICS.filter(group => !["mini projects", "problem solving"].includes(normal(group.stage))) : [{ stage: "Learning Roadmap", topics: language?.topics || [] }];

  const loadTopicResources = useCallback(async (stepId) => {
    if (stepId === undefined || stepId === null) return;
    try {
      const data = unwrap(await getJson(`${API_BASE}/steps/${stepId}/resources`));
      setStepResources(prev => ({ ...prev, [String(stepId)]: data }));
    } catch {
      setStepResources(prev => ({ ...prev, [String(stepId)]: prev[String(stepId)] || [] }));
    }
  }, []);

  useEffect(() => {
    if (isChooser || !language) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const pathsData = unwrap(await getJson(`${API_BASE}/paths?domainId=1`));
        if (cancelled) return;
        setPaths(pathsData);
        const match = pathsData.find(p => normal(titleOf(p)) === normal(language.name)) || pathsData.find(p => normal(titleOf(p)).includes(normal(language.name)) || normal(language.name).includes(normal(titleOf(p))));
        if (!match) throw new Error(`No backend learning path found for ${language.name}.`);
        const pathId = idOf(match);
        const stageData = unwrap(await getJson(`${API_BASE}/paths/${pathId}/stages`));
        if (cancelled) return;
        setStages(stageData);
        const [pathRes] = await Promise.allSettled([getJson(`${API_BASE}/paths/${pathId}/resources`)]);
        if (!cancelled) setPathResources(pathRes.status === "fulfilled" ? unwrap(pathRes.value) : []);
        if (stageData.length) {
          const firstStage = stageData[0];
          const stageId = idOf(firstStage);
          setActiveStageId(stageId); setExpandedStages({ [String(stageId)]: true });
          const stepData = unwrap(await getJson(`${API_BASE}/stages/${stageId}/steps`));
          if (cancelled) return;
          setStageSteps(prev => ({ ...prev, [String(stageId)]: stepData }));
          if (stepData.length) {
            setActiveStepId(idOf(stepData[0]));
            await loadTopicResources(idOf(stepData[0]));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load this learning path from the backend.");
      } finally { if (!cancelled) setLoading(false); }
    }
    setPaths([]); setStages([]); setStageSteps({}); setStepResources({}); setPathResources([]); setActiveStageId(null); setActiveStepId(null);
    load();
    return () => { cancelled = true; };
  }, [language, isChooser, loadTopicResources]);

  async function chooseStage(stage) {
    const stageId = idOf(stage); const key = String(stageId);
    setActiveStageId(stageId); setExpandedStages(prev => ({ ...prev, [key]: !prev[key] }));
    if (!stageSteps[key]) {
      try {
        const data = unwrap(await getJson(`${API_BASE}/stages/${stageId}/steps`));
        setStageSteps(prev => ({ ...prev, [key]: data }));
        if (data.length) { setActiveStepId(idOf(data[0])); loadTopicResources(idOf(data[0])); }
      } catch (e) { setError(e.message || "Could not load topics for this stage."); }
    } else if ((stageSteps[key] || []).length) {
      const first = stageSteps[key][0]; setActiveStepId(idOf(first)); loadTopicResources(idOf(first));
    }
  }
  function chooseStep(step) { setActiveStepId(idOf(step)); loadTopicResources(idOf(step)); }

  useEffect(() => {
    if (isChooser || !language) {
      setYoutubeVideos([]);
      return;
    }
    let cancelled = false;
    const topic = activeStep ? titleOf(activeStep) : activeStage ? titleOf(activeStage) : language.name;
    const params = new URLSearchParams({
      topic,
      language: language.name || "C",
      maxResults: "8"
    });
    setYoutubeLoading(true);
    setYoutubeError("");
    setYoutubeVideos([]);
    fetch(`${API_BASE}/youtube/search?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error(`YouTube request failed (${response.status}).`);
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error("Unexpected YouTube response from the backend.");
        setYoutubeVideos(data.filter(video => video && video.videoId).map(video => ({
          id: video.videoId,
          title: video.title || "YouTube lesson",
          type: "Video",
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
          description: video.channelTitle ? `Channel: ${video.channelTitle}` : "YouTube lesson"
        })));
      })
      .catch(err => {
        if (!cancelled) setYoutubeError(err.message || "Could not load YouTube videos.");
      })
      .finally(() => {
        if (!cancelled) setYoutubeLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeStepId, activeStageId, language?.name, isChooser]);


  if (isChooser) return (
    <div className="lr-shell lr-chooser-shell">
      <header className="lr-topbar"><a className="lr-brand" href="#home" onClick={e => { e.preventDefault(); onBack?.(); }}><span className="lr-brand-mark">S</span> SkillRoute</a><button className="lr-back" onClick={onBack}>← Back to Home</button></header>
      <main className="lr-chooser"><span className="lr-eyebrow">YOUR LEARNING JOURNEY</span><h1>Choose a programming language</h1><p>Select a language to explore its learning stages, topic lessons, and curated resources.</p><div className="lr-language-grid">{languages.map((item, i) => <button key={item.id} className="lr-language-card" onClick={() => onSelectLanguage?.(item)}><span className={`lr-language-symbol lr-symbol-${item.id}`}>{({c:"C",cpp:"C++",java:"☕",python:"Py",javascript:"JS"})[item.id] || item.name.slice(0,2)}</span><span><strong>{item.name}</strong><small>{item.subtitle}</small></span><span className="lr-card-arrow">→</span></button>)}</div></main>
    </div>
  );

  return (
    <div className="lr-shell">
      <header className="lr-topbar"><a className="lr-brand" href="#home" onClick={e => { e.preventDefault(); onBack?.(); }}><span className="lr-brand-mark">S</span> SkillRoute</a><nav className="lr-nav"><span>Learning Paths</span><span>Resources</span></nav><button className="lr-back" onClick={onBack}>← Back</button></header>
      <div className="lr-layout">
        <aside className="lr-sidebar">
          <div className="lr-side-heading"><span className="lr-eyebrow">LEARNING PATH</span><h2>{language?.name || "Learning Path"}</h2><p>Choose a stage, then a topic.</p></div>
          <div className="lr-language-switch">{languages.map(item => <button key={item.id} className={item.id === language?.id ? "active" : ""} onClick={() => onSelectLanguage?.(item)}><span className="lr-mini-symbol">{({c:"C",cpp:"C++",java:"☕",python:"Py",javascript:"JS"})[item.id] || item.name.slice(0,2)}</span>{item.name}</button>)}</div>
          <div className="lr-stage-list"><div className="lr-list-title">{language?.name?.toUpperCase()} TOPICS</div>
            {loading && <p className="lr-muted lr-inline-status">Loading learning stages…</p>}
            {!loading && stages.length === 0 && fallbackGroups.map(group => <section className="lr-stage" key={group.stage}><div className="lr-stage-name">{group.stage}</div>{group.topics.map(topic => <button className="lr-topic-fallback" key={topic} onClick={() => setError(`The backend does not yet provide a topic record for “${topic}”.`)}>{topic}</button>)}</section>)}
            {stages.filter(stage => !["mini projects", "problem solving"].includes(normal(titleOf(stage)))).map(stage => { const key = String(idOf(stage)); const expanded = !!expandedStages[key]; return <section className="lr-stage" key={key}><button className={`lr-stage-button ${String(activeStageId) === key ? "selected" : ""}`} onClick={() => chooseStage(stage)}><span>{titleOf(stage)}</span><span className={`lr-stage-chevron ${expanded ? "open" : ""}`}>⌄</span></button>{expanded && (stageSteps[key] || []).map(step => <button key={String(idOf(step))} className={`lr-topic-button ${String(activeStepId) === String(idOf(step)) ? "selected" : ""}`} onClick={() => chooseStep(step)}>{titleOf(step)}</button>)}</section>; })}
          </div>
        </aside>
        <main className="lr-main">
          <div className="lr-breadcrumb"><button onClick={onBack}>Home</button><span>›</span><span>Programming Languages</span><span>›</span><span>{language?.name}</span>{activeStage && <><span>›</span><span>{titleOf(activeStage)}</span></>}</div>
          {error && <div className="lr-alert"><strong>Learning data notice</strong><span>{error}</span><small>Check that Spring Boot is running on port 8081 and that the selected path and resources exist in MySQL.</small></div>}
          <div className="lr-topic-heading"><div><span className="lr-eyebrow">{activeStage ? titleOf(activeStage) : "LEARNING ROADMAP"}</span><h1>{activeStep ? titleOf(activeStep) : `Learn ${language?.name || "programming"}`}</h1><p>{descOf(activeStep) || language?.subtitle || "Follow the topics in order and practise as you go."}</p></div><button className="lr-explore-more-button lr-explore-top-button" onClick={() => setShowExploreMore(v => !v)}><span><b>Explore More Resources →</b><small>Articles, Documents, GitHub, Community &amp; Practice</small></span><span aria-hidden="true">{showExploreMore ? "−" : "＋"}</span></button></div>
          <section className="lr-lesson-card">{currentVideo && youtubeId(urlOf(currentVideo)) ? <div className="lr-embedded-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId(urlOf(currentVideo))}?rel=0`} title={titleOf(currentVideo)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : videoResources[0] && thumbnailOf(videoResources[0]) ? <a className="lr-hero-thumbnail" href={urlOf(videoResources[0])} target="_blank" rel="noreferrer"><img src={thumbnailOf(videoResources[0])} alt={`${titleOf(videoResources[0])} video thumbnail`} /><span>▶</span></a> : <div className="lr-lesson-icon">▶</div>}<div><span className="lr-eyebrow">LESSON VIDEO</span><h2>{currentVideo ? titleOf(currentVideo) : "No video linked to this topic yet"}</h2><p>{currentVideo ? "Watch the lesson right here on SkillRoute." : "Add a video resource for this specific topic in your database to show it here."}</p></div></section>
          <section className="lr-topic-resources"><h2 className="lr-more-videos-title">More videos for this topic</h2>
            {youtubeLoading && <p className="lr-muted">Finding YouTube lessons…</p>}
            {youtubeError && <div className="lr-alert"><strong>YouTube videos</strong><span>{youtubeError} Check that Spring Boot is running and the YouTube API key/quota is valid.</span></div>}
            {videoResources.length ? <div className="lr-resource-list">{videoResources.map(r => resourceCard(r, false, setPlayingVideo))}</div> : !youtubeLoading && <div className="lr-empty-card">No YouTube or database videos were found for this topic yet.</div>}
          </section>
        </main>
        {showExploreMore && <aside className="lr-rightbar"><div className="lr-right-card"><div className="lr-right-heading"><div><span className="lr-eyebrow">SKILLROUTE RESOURCES</span><h2>Explore Resources</h2></div><button className="lr-close-resources" onClick={() => setShowExploreMore(false)} aria-label="Close resources">×</button></div><p className="lr-right-intro">Resources are grouped by platform, without repeating the same site for every link.</p>{groupedResources.length ? <div className="lr-right-list">{groupedResources.map(group => <section className="lr-resource-group" key={group.type}><div className="lr-resource-group-heading"><span className={`lr-group-icon lr-group-${normal(group.type).replace(/\s+/g,"-")}`}>{({Article:"A",Docs:"▤",GitHub:"⌘",Community:"◎",Practice:"✓"})[group.type] || "↗"}</span><div><h3>{group.type === "Article" ? "Articles" : group.type === "Docs" ? "Documents" : group.type === "GitHub" ? "GitHub" : group.type === "Community" ? "Community" : group.type}</h3><small>{group.type === "Article" ? "Tutorials and learning articles" : group.type === "Docs" ? "Official documentation and references" : group.type === "GitHub" ? "Repositories and example code" : group.type === "Community" ? "Forums, discussions and Q&A" : "Online compilers and coding practice"}</small></div></div>{group.items.map(r => resourceCard(r, true, setPlayingVideo))}</section>)}</div> : <div className="lr-empty-card lr-empty-compact">No extra resources are available for this path yet.</div>}</div></aside>}
      </div>
    </div>
  );
}
