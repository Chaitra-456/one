import { useEffect, useState } from "react";
import "./LearningPage.css";
import "./ExploreResources.css";
const API = "http://localhost:8081/api";

const C_DSA_STAGES = [
  "DSA Fundamentals",
  "Arrays and Strings",
  "Pointers and Dynamic Memory",
  "Linked Lists",
  "Stacks and Queues",
  "Searching Algorithms",
  "Sorting Algorithms",
  "Recursion and Backtracking",
  "Trees and Binary Search Trees",
  "Heaps and Priority Queues",
  "Hashing",
  "Graphs",
  "Greedy Algorithms",
  "Dynamic Programming",
  "Advanced Data Structures",
];

const LANGUAGES = [
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
  { id: "java", name: "Java" },
  { id: "python", name: "Python" },
];

const norm = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getId = (item) =>
  item?.id ??
  item?.stageId ??
  item?.stage_id ??
  item?.stepId ??
  item?.step_id;

const getTitle = (item) =>
  String(
    item?.title ??
      item?.name ??
      item?.stageName ??
      item?.stage_name ??
      "Untitled"
  );

function unwrap(value) {
  if (Array.isArray(value)) return value;

  for (const key of ["data", "content", "items", "results", "records"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  return [];
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

function isVideo(resource) {
  const type = norm(resource?.resource_type ?? resource?.type);
  const url = String(resource?.url ?? resource?.link ?? "");

  return (
    type.includes("video") ||
    type.includes("youtube") ||
    /youtube\.com|youtu\.be/i.test(url)
  );
}

function getYouTubeId(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }

    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
    }

    return parsed.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
}

export default function DsaLearningPage({
  language,
  onSelectLanguage,
  onBack,
}) {
  const [stages, setStages] = useState([]);
  const [activeStageId, setActiveStageId] = useState("");
  const [videos, setVideos] = useState([]);
  const [exploreResources, setExploreResources] = useState([]);

  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState("");

  const [showAllExploreResources, setShowAllExploreResources] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeStage = stages.find(
    (stage) => String(getId(stage)) === String(activeStageId)
  );

  // Load the DSA learning path and stages.
  useEffect(() => {
    let cancelled = false;

    async function loadPath() {
      setLoading(true);
      setNotice("");
      setError("");
      setVideos([]);

      const fallbackStages = C_DSA_STAGES.map((title, index) => ({
        id: `fallback-${index}`,
        title,
        fallback: true,
      }));

      setStages(fallbackStages);
      setActiveStageId(String(fallbackStages[0].id));

      try {
        const paths = unwrap(
          await fetchJson(`${API}/paths?domainId=2`)
        );

        if (cancelled) return;

        const languageName = norm(language?.name);

        const path = paths.find((item) => {
          const title = norm(item.title ?? item.name);

          const isDsaPath =
            title.includes("dsa") ||
            title.includes("data structures") ||
            title.includes("algorithm");

          return isDsaPath && title.includes(languageName);
        });

        if (!path) {
          setNotice(
            `The DSA learning path for ${language?.name ?? "this language"} was not found. Showing the default stage list.`
          );
          return;
        }

        const pathId = getId(path);

        const pathStages = unwrap(
          await fetchJson(`${API}/paths/${pathId}/stages`)
        );

        if (cancelled) return;

        if (!pathStages.length) {
          setNotice("No stages were returned for this learning path.");
          return;
        }

        setStages(pathStages);
        setActiveStageId(String(getId(pathStages[0])));
      } catch (err) {
        if (!cancelled) {
          setNotice(
            `Could not load the DSA path from the backend: ${err.message}`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPath();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // Load videos for the selected stage.
  useEffect(() => {
    if (!activeStage || activeStage.fallback) {
      setVideos([]);
      setVideosLoading(false);
      return;
    }

    let cancelled = false;

    async function loadStageVideos() {
      setVideosLoading(true);
      setError("");
      setVideos([]);

      try {
        const stageId = getId(activeStage);

        const steps = unwrap(
          await fetchJson(`${API}/stages/${stageId}/steps`)
        );

        const collected = [];

        for (const step of steps) {
          if (cancelled) return;

          const stepId = getId(step);

          if (stepId == null) continue;

          try {
            const stepResources = unwrap(
              await fetchJson(`${API}/steps/${stepId}/resources`)
            );

            for (const resource of stepResources) {
              if (isVideo(resource)) {
                collected.push({
                  ...resource,
                  stepTitle: getTitle(step),
                });
              }
            }
          } catch (err) {
            console.warn(
              `Could not load resources for step ${stepId}:`,
              err
            );
          }
        }

        if (cancelled) return;

        const unique = [];
        const seen = new Set();

        for (const video of collected) {
          const key = String(
            video.id ??
              video.url ??
              video.link ??
              video.title
          );

          if (!seen.has(key)) {
            seen.add(key);
            unique.push(video);
          }
        }

        setVideos(unique);

        if (!unique.length && steps.length) {
          setError(
            "The stage has learning steps, but no video resources were returned. Check the step IDs and resource links."
          );
        } else if (!steps.length) {
          setError(
            "No learning steps were returned for this stage."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Could not load stage lessons: ${err.message}`);
        }
      } finally {
        if (!cancelled) setVideosLoading(false);
      }
    }

    loadStageVideos();

    return () => {
      cancelled = true;
    };
  }, [activeStageId, activeStage]);

  // Load Explore More Resources automatically for DSA domain ID 2.
  useEffect(() => {
    let cancelled = false;

    async function loadExploreResources() {
      setExploreLoading(true);
      setExploreError("");

      try {
        const result = unwrap(
          await fetchJson(`${API}/explore-resources/2`)
        );

        if (!cancelled) {
          setExploreResources(result);
        }
      } catch (err) {
        if (!cancelled) {
          setExploreResources([]);
          setExploreError(
            `Could not load Explore More Resources: ${err.message}. Check that the backend is running and the resource API is available.`
          );
        }
      } finally {
        if (!cancelled) {
          setExploreLoading(false);
        }
      }
    }

    loadExploreResources();

    return () => {
      cancelled = true;
    };
  }, []);

  function selectStage(stage) {
    setActiveStageId(String(getId(stage)));
  }

  const categories = [
    {
      name: "Documentation",
      icon: "▤",
    },
    {
      name: "Practice Problems",
      icon: "✓",
    },
    {
      name: "GitHub Examples",
      icon: "⌘",
    },
    {
      name: "Community Discussions",
      icon: "◎",
    },
  ];

  return (
    <div className="lr-shell">
      <header className="lr-topbar">
        <a
          className="lr-brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            onBack?.();
          }}
        >
          <span className="lr-brand-mark">S</span>
          SkillRoute
        </a>

        <nav className="lr-nav">
          <span>Learning Paths</span>
          <span>Resources</span>
        </nav>

        <button className="lr-back" onClick={onBack}>
          ← Back
        </button>
      </header>

      <div className="lr-layout">
        {/* LEFT: DSA stages and language selection */}
        <aside className="lr-sidebar">
          <div className="lr-side-heading">
            <span className="lr-eyebrow">LEARNING PATH</span>
            <h2>DSA with {language.name}</h2>
            <p>Choose a stage to explore its lessons.</p>
          </div>

          <div className="lr-language-switch">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                className={item.id === language.id ? "active" : ""}
                onClick={() => onSelectLanguage?.(item)}
              >
                <span className="lr-mini-symbol">
                  {item.id === "python"
                    ? "Py"
                    : item.id === "cpp"
                    ? "C++"
                    : item.name}
                </span>
                {item.name}
              </button>
            ))}
          </div>

          <div className="lr-stage-list">
            <div className="lr-list-title">
              DSA STAGES · {language.name.toUpperCase()}
            </div>

            {loading && (
              <p className="lr-muted">Loading stages…</p>
            )}

            {stages.map((stage, index) => (
              <button
                key={getId(stage) ?? index}
                className={`lr-stage-button ${
                  String(getId(stage)) === String(activeStageId)
                    ? "selected"
                    : ""
                }`}
                onClick={() => selectStage(stage)}
              >
                <span>{getTitle(stage)}</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: Selected stage and lesson videos */}
        <main className="lr-main">
          <div className="lr-breadcrumb">
            <button onClick={onBack}>Home</button>
            <span>›</span>
            <span>Data Structures &amp; Algorithms</span>
            <span>›</span>
            <span>{language.name}</span>
          </div>

          {notice && (
            <div className="lr-alert">
              <strong>DSA learning path</strong>
              <span>{notice}</span>
            </div>
          )}

          <div className="lr-topic-heading">
            <div>
              <span className="lr-eyebrow">
                DATA STRUCTURES &amp; ALGORITHMS ·{" "}
                {language.name.toUpperCase()}
              </span>

              <h1>
                {activeStage
                  ? getTitle(activeStage)
                  : `DSA with ${language.name}`}
              </h1>

              <p>
                Learn the concepts in order, watch lesson videos,
                and practise each data structure and algorithm.
              </p>
            </div>

            <span className="lr-status-pill">
              ● Learning stage
            </span>
          </div>

          <section className="lr-topic-resources">
            <div className="lr-section-heading">
              <div>
                <span className="lr-section-icon">▶</span>
                <div>
                  <h2>Lesson videos</h2>
                  <p>
                    Videos connected to the selected DSA stage
                  </p>
                </div>
              </div>
            </div>

            {videosLoading && (
              <p className="lr-muted">
                Loading videos from your database…
              </p>
            )}

            {error && (
              <div className="lr-alert">
                <strong>Lesson information</strong>
                <span>{error}</span>
              </div>
            )}

            {!videosLoading && videos.length > 0 && (
              <div className="lr-resource-list">
                {videos.map((video, index) => {
                  const url = video.url ?? video.link ?? "";
                  const videoId = getYouTubeId(url);

                  return (
                    <article
                      className="lr-resource lr-video-resource"
                      key={
                        video.id ??
                        url ??
                        `${video.title}-${index}`
                      }
                    >
                      {videoId && (
                        <a
                          className="lr-video-thumb"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={
                              video.thumbnail ??
                              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                            }
                            alt="Video thumbnail"
                          />
                          <i>▶</i>
                        </a>
                      )}

                      <span className="lr-resource-copy">
                        <strong>
                          {video.title ?? video.name ?? "Lesson video"}
                        </strong>

                        <small>
                          {video.stepTitle
                            ? `${video.stepTitle} · `
                            : ""}
                          VIDEO LESSON
                        </small>
                      </span>

                      <a
                        className="lr-watch-button"
                        href={url || "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch ↗
                      </a>
                    </article>
                  );
                })}
              </div>
            )}

            {!videosLoading &&
              videos.length === 0 &&
              !error && (
                <div className="lr-empty-card">
                  No database videos were found for this stage.
                </div>
              )}
          </section>
        </main>

        {/* RIGHT: Explore More Resources */}
        <aside className="dsa-explore-sidebar">
          <div className="lr-explore-inline er-panel">
            <div className="er-heading">
              <span className="er-eyebrow">
                SKILLROUTE RESOURCES
              </span>

              <h2>
                Explore More Resources{" "}
                <span aria-hidden="true">↗</span>
              </h2>

              <p>
                Articles, Documentation, GitHub, Community &amp; Practice
              </p>
            </div>

            {exploreLoading && (
              <p className="lr-muted">
                Loading additional resources…
              </p>
            )}

            {exploreError && (
              <div className="lr-alert">
                <strong>Resources unavailable</strong>
                <span>{exploreError}</span>
              </div>
            )}

            {!exploreLoading &&
              !exploreError &&
              exploreResources.length === 0 && (
                <div className="lr-empty-card">
                  No additional resources found for DSA (domain ID 2).
                  Check that the explore_resources table contains records.
                </div>
              )}

            {!exploreLoading &&
              !exploreError &&
              exploreResources.length > 0 && (
                <>
                  <div className="er-category-list">
                    {categories.map((category) => {
                      const items = exploreResources.filter(
                        (resource) =>
                          norm(resource.category) === norm(category.name)
                      );

                      if (!items.length) return null;

                      const visibleItems = showAllExploreResources
                        ? items
                        : items.slice(0, 3);

                      return (
                        <section
                          className="er-category"
                          key={category.name}
                        >
                          <div className="er-category-head">
                            <span className="er-icon">
                              {category.icon}
                            </span>

                            <div className="er-category-label">
                              <strong>{category.name}</strong>
                              <small>
                                {items.length}{" "}
                                {items.length === 1
                                  ? "resource"
                                  : "resources"}
                              </small>
                            </div>

                            <span
                              className="er-chevron"
                              aria-hidden="true"
                            >
                              ›
                            </span>
                          </div>

                          <div className="er-links">
                            {visibleItems.map((resource, index) => (
                              <a
                                key={
                                  resource.id ??
                                  `${resource.title}-${index}`
                                }
                                href={resource.url ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {resource.title ?? "Learning resource"}{" "}
                                <span aria-hidden="true">↗</span>
                              </a>
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>

                  {exploreResources.length > 3 && (
                    <button
                      className="er-view-all"
                      onClick={() =>
                        setShowAllExploreResources((value) => !value)
                      }
                    >
                      {showAllExploreResources
                        ? "Show Less ↑"
                        : "View All →"}
                    </button>
                  )}
                </>
              )}
          </div>
        </aside>
      </div>
    </div>
  );
}