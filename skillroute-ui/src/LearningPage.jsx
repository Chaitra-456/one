import { useEffect, useMemo, useState } from "react";
import "./LearningPage.css";

const API_BASE = "http://localhost:8081/api";

const STAGE_PREFIXES = {
  "basics": ["c basics -", "basics"],
  "operators": ["c operators -", "operators"],
  "decision making": ["c decision making -", "decision making"],
  "loops": ["c loops -", "loops"],
  "patterns": ["c patterns -", "patterns"],
  "functions": ["c functions -", "functions"],
  "arrays": ["c arrays -", "arrays"],
  "arrays and strings": ["c arrays -", "arrays and strings"],
  "strings": ["c strings -", "strings"],
  "pointers": ["c pointers -", "pointers"],
  "pointers and dynamic memory": [
    "c pointers -",
    "c dynamic memory -",
    "pointers and dynamic memory",
  ],
  "dynamic memory": ["c dynamic memory -", "dynamic memory"],
  "structures": ["c structures -", "structures"],
  "file handling": ["c file handling -", "c file handling "],

  "linked lists": ["linked lists", "linked list"],
  "stacks and queues": ["stacks and queues", "stack", "queue"],
  "searching algorithms": ["searching algorithms", "searching", "binary search", "linear search"],
  "sorting algorithms": ["sorting algorithms", "sorting", "bubble sort", "merge sort", "quick sort"],
  "recursion and backtracking": ["recursion", "backtracking"],
  "trees and binary search trees": ["trees", "binary search tree", "bst"],
  "heaps and priority queues": ["heaps", "priority queue"],
  "hashing": ["hashing", "hash table"],
  "graphs": ["graphs", "graph"],
  "greedy algorithms": ["greedy algorithms", "greedy"],
  "dynamic programming": ["dynamic programming"],
  "advanced data structures": ["advanced data structures"],
};

const norm = (value) =>
  String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const getId = (item) => item?.id ?? item?.stageId ?? item?.stage_id;
const getTitle = (item) => String(item?.title ?? item?.name ?? item?.label ?? "Untitled");
const getUrl = (item) => String(item?.url ?? item?.link ?? item?.resourceUrl ?? item?.resource_url ?? "");
const getType = (item) => String(item?.resource_type ?? item?.resourceType ?? item?.type ?? "").toLowerCase();
const displayTitle = (item) => getTitle(item).replace(/^C\s+(?:Basics|Operators|Decision Making|Loops|Patterns|Functions|Arrays|Strings|Pointers|Structures|File Handling|Dynamic Memory)\s*-\s*/i, "");

function unwrap(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["data", "content", "items", "results", "records"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function youtubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1).split("/")[0];
    return parsed.searchParams.get("v") ||
      parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || "";
  } catch {
    return "";
  }
}

function stageMatchesResource(stage, resource) {
  const stageName = norm(getTitle(stage));
  const resourceTitle = norm(getTitle(resource));

  const prefixes = STAGE_PREFIXES[stageName];

  if (!prefixes) {
    return resourceTitle.startsWith(`c ${stageName} `) ||
      resourceTitle === stageName;
  }

  return prefixes.some((prefix) => {
    const normalizedPrefix = norm(prefix);
    return resourceTitle.includes(normalizedPrefix);
  });
}

function VideoCard({ resource, onWatch, selected = false }) {
  const id = youtubeId(getUrl(resource));
  return (
    <button
      type="button"
      className={`lr-resource lr-video-resource ${selected ? "selected" : ""}`}
      onClick={() => onWatch(resource)}
    >
      <span className="lr-video-thumb">
        {id ? <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" /> : null}
        <i>▶</i>
      </span>
      <span className="lr-resource-copy">
        <strong>{displayTitle(resource)}</strong>
        <small>VIDEO LESSON</small>
      </span>
      <span className="lr-watch-button">Watch ↗</span>
    </button>
  );
}

export default function LearningPage({
  language,
  languages = [],
  onSelectLanguage,
  onBack,
}) {
  const isChooser = language?.id === "__language_chooser__";
  const [paths, setPaths] = useState([]);
  const [stages, setStages] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeStageId, setActiveStageId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPath = useMemo(() => {
    const wanted = norm(language?.name);
    return paths.find((path) => norm(getTitle(path)) === wanted) ||
      paths.find((path) => norm(getTitle(path)).includes(wanted) || wanted.includes(norm(getTitle(path)))) ||
      null;
  }, [paths, language]);

  const activeStage = stages.find((stage) => String(getId(stage)) === String(activeStageId)) || stages[0] || null;

  const stageVideos = useMemo(() => {
    if (!activeStage) return [];
    return resources
      .filter((resource) => {
        const type = getType(resource);
        const videoLike = type.includes("video") || type.includes("youtube") || youtubeId(getUrl(resource));
        return videoLike && stageMatchesResource(activeStage, resource);
      })
      .filter((resource, index, list) =>
        list.findIndex((item) => getUrl(item) && getUrl(item) === getUrl(resource)) === index
      );
  }, [activeStage, resources]);

  const otherResources = resources.filter((resource) => {
    const type = getType(resource);
    const videoLike = type.includes("video") || type.includes("youtube") || youtubeId(getUrl(resource));
    return !videoLike;
  });
  const resourceGroups = [
    { title: "Documentation", subtitle: "Guides and references", icon: "▤", matches: ["doc", "documentation", "article"] },
    { title: "Practice Problems", subtitle: "Build your coding skills", icon: "✓", matches: ["practice", "problem", "exercise"] },
    { title: "GitHub Examples", subtitle: "Code and sample projects", icon: "⌘", matches: ["github", "code", "repository"] },
    { title: "Community Discussions", subtitle: "Ask questions and learn together", icon: "◎", matches: ["community", "forum", "discussion"] },
  ].map((group) => ({
    ...group,
    items: otherResources.filter((resource) => {
      const label = `${getType(resource)} ${getTitle(resource)} ${getUrl(resource)}`.toLowerCase();
      return group.matches.some((word) => label.includes(word));
    }),
  }));

  const currentVideo = stageVideos.find((video) =>
    getUrl(video) === getUrl(playingVideo)
  ) || stageVideos[0] || null;

  useEffect(() => {
    if (isChooser || !language) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setPaths([]);
      setStages([]);
      setResources([]);
      setActiveStageId(null);
      setPlayingVideo(null);

      try {
        const pathsResponse = await fetch(`${API_BASE}/paths?domainId=1`);
        if (!pathsResponse.ok) throw new Error(`Could not load learning paths (${pathsResponse.status}).`);
        const pathsData = unwrap(await pathsResponse.json());
        if (cancelled) return;
        setPaths(pathsData);

        const wanted = norm(language.name);
        const path = pathsData.find((item) => norm(getTitle(item)) === wanted) ||
          pathsData.find((item) => norm(getTitle(item)).includes(wanted) || wanted.includes(norm(getTitle(item))));
        if (!path) throw new Error(`No learning path found for ${language.name}.`);

        const pathId = getId(path);
        const [stageResponse, resourceResponse] = await Promise.all([
          fetch(`${API_BASE}/paths/${pathId}/stages`),
          fetch(`${API_BASE}/paths/${pathId}/resources`),
        ]);
        if (!stageResponse.ok) throw new Error(`Could not load stages (${stageResponse.status}).`);
        if (!resourceResponse.ok) throw new Error(`Could not load path resources (${resourceResponse.status}).`);

        const stageData = unwrap(await stageResponse.json());
        const resourceData = unwrap(await resourceResponse.json());
        if (cancelled) return;

        setStages(stageData);
        setResources(resourceData);
        if (stageData.length) setActiveStageId(getId(stageData[0]));
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load learning data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [language, isChooser]);

  useEffect(() => {
    setPlayingVideo(null);
  }, [activeStageId]);

  if (isChooser) {
    return (
      <div className="lr-shell lr-chooser-shell">
        <header className="lr-topbar">
          <a className="lr-brand" href="#home" onClick={(event) => { event.preventDefault(); onBack?.(); }}>
            <span className="lr-brand-mark">S</span> SkillRoute
          </a>
          <button className="lr-back" onClick={onBack}>← Back to Home</button>
        </header>
        <main className="lr-chooser">
          <span className="lr-eyebrow">YOUR LEARNING JOURNEY</span>
          <h1>Choose a programming language</h1>
          <p>Select a language to explore its learning stages and video lessons.</p>
          <div className="lr-language-grid">
            {languages.map((item) => (
              <button key={item.id} className="lr-language-card" onClick={() => onSelectLanguage?.(item)}>
                <span className={`lr-language-symbol lr-symbol-${item.id}`}>
                  {({ c: "C", cpp: "C++", java: "☕", python: "Py", javascript: "JS" })[item.id] || item.name.slice(0, 2)}
                </span>
                <span><strong>{item.name}</strong><small>{item.subtitle}</small></span>
                <span className="lr-card-arrow">→</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lr-shell">
      <header className="lr-topbar">
        <a className="lr-brand" href="#home" onClick={(event) => { event.preventDefault(); onBack?.(); }}>
          <span className="lr-brand-mark">S</span> SkillRoute
        </a>
        <nav className="lr-nav"><span>Learning Paths</span><span>Resources</span></nav>
        <button className="lr-back" onClick={onBack}>← Back</button>
      </header>

      <div className="lr-layout">
        <aside className="lr-sidebar">
          <div className="lr-side-heading">
            <span className="lr-eyebrow">LEARNING PATH</span>
            <h2>{language?.name || "Learning Path"}</h2>
            <p>Select a stage to view its videos.</p>
          </div>
          <div className="lr-language-switch">
            {languages.map((item) => (
              <button key={item.id} className={item.id === language?.id ? "active" : ""}
                onClick={() => onSelectLanguage?.(item)}>
                <span className="lr-mini-symbol">
                  {({ c: "C", cpp: "C++", java: "☕", python: "Py", javascript: "JS" })[item.id] || item.name.slice(0, 2)}
                </span>
                {item.name}
              </button>
            ))}
          </div>
          <div className="lr-stage-list">
            <div className="lr-list-title">{language?.name?.toUpperCase()} STAGES</div>
            {loading && <p className="lr-muted">Loading stages…</p>}
            {!loading && stages.map((stage, index) => (
              <section className="lr-stage" key={getId(stage) ?? index}>
                <button
                  type="button"
                  className={`lr-stage-button ${String(getId(activeStage || {})) === String(getId(stage)) ? "selected" : ""}`}
                  onClick={() => setActiveStageId(getId(stage))}
                >
                  <span>{getTitle(stage)}</span>
                  <span className="lr-stage-chevron">›</span>
                </button>
              </section>
            ))}
          </div>
        </aside>

        <main className="lr-main">
          <div className="lr-breadcrumb">
            <button onClick={onBack}>Home</button><span>›</span><span>Programming Languages</span>
            <span>›</span><span>{language?.name}</span>
            {activeStage && <><span>›</span><span>{getTitle(activeStage)}</span></>}
          </div>

          {error && <div className="lr-alert"><strong>Learning data notice</strong><span>{error}</span></div>}

          <div className="lr-topic-heading">
            <div>
              <span className="lr-eyebrow">STAGE {activeStage?.stage_number ?? ""}</span>
              <h1>{activeStage ? getTitle(activeStage) : `Learn ${language?.name || "programming"}`}</h1>
              <p>Watch the video lessons assigned to this stage.</p>
            </div>
          </div>

          <section className="lr-lesson-card">
            {currentVideo && youtubeId(getUrl(currentVideo)) ? (
              <div className="lr-embedded-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId(getUrl(currentVideo))}?rel=0`}
                  title={getTitle(currentVideo)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : <div className="lr-lesson-icon">▶</div>}
            <div>
              <span className="lr-eyebrow">STAGE VIDEO</span>
              <h2>{currentVideo ? getTitle(currentVideo) : "No videos assigned to this stage"}</h2>
              <p>{currentVideo ? "This video belongs to the selected stage." : "Check that the resource title starts with the matching stage prefix, and that the videos are linked to this learning path in the database."}</p>
            </div>
          </section>

          <section className="lr-topic-resources">
            <h2 className="lr-more-videos-title">Videos for {activeStage ? getTitle(activeStage) : "this stage"}</h2>
            {stageVideos.length ? (
              <div className="lr-resource-list">
                {stageVideos.map((resource, index) => (
                  <VideoCard
                    key={getUrl(resource) || `${getTitle(resource)}-${index}`}
                    resource={resource}
                    onWatch={setPlayingVideo}
                    selected={getUrl(resource) === getUrl(currentVideo)}
                  />
                ))}
              </div>
            ) : (
              <div className="lr-empty-card">
                No videos were matched to this stage. Confirm the video titles in MySQL use the stage prefixes from your SQL script and that `/api/paths/{'{pathId}'}/resources` returns those videos.
              </div>
            )}
          </section>


        </main>

        <aside className="lr-rightbar lr-explore-panel">
          <div className="lr-right-card">
            <div className="lr-explore-panel-heading">
              <div>
                <span className="lr-eyebrow">SKILLROUTE RESOURCES</span>
                <h2>Explore More Resources <span aria-hidden="true">↗</span></h2>
                <p>Articles, Documentation, GitHub, Community &amp; Practice</p>
              </div>
              <span className="lr-explore-stack" aria-hidden="true">▰</span>
            </div>
            <div className="lr-explore-groups">
              {resourceGroups.map((group) => (
                <section className="lr-explore-group" key={group.title}>
                  <div className="lr-explore-group-icon" aria-hidden="true">{group.icon}</div>
                  <div className="lr-explore-group-copy">
                    <strong>{group.title}</strong>
                    <small>{group.items.length ? `${group.items.length} resource${group.items.length === 1 ? "" : "s"}` : group.subtitle}</small>
                  </div>
                  <span className="lr-explore-chevron" aria-hidden="true">›</span>
                  {group.items.length > 0 && (
                    <div className="lr-explore-group-links">
                      {group.items.slice(0, 3).map((resource, index) => (
                        <a key={getUrl(resource) || `${getTitle(resource)}-${index}`} href={getUrl(resource) || undefined} target={getUrl(resource) ? "_blank" : undefined} rel={getUrl(resource) ? "noreferrer" : undefined}>
                          {displayTitle(resource)} <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              ))}
              {!otherResources.length && <p className="lr-explore-empty">No extra resources are linked to this learning path yet. Add documentation, practice, GitHub, or community resources to the path to show them here.</p>}
            </div>
            <button type="button" className="lr-explore-view-all" onClick={() => document.querySelector(".lr-explore-groups")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}>View All <span>→</span></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
