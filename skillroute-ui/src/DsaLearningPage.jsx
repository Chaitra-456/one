import { useEffect, useState } from "react";
import "./LearningPage.css";

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

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
  const [resources, setResources] = useState([]);
  const [showResources, setShowResources] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeStage = stages.find(
    (stage) => String(getId(stage)) === String(activeStageId)
  );

  // Load the DSA path and its stages.
  useEffect(() => {
    let cancelled = false;

    async function loadPath() {
      setLoading(true);
      setNotice("");
      setError("");
      setVideos([]);
      setResources([]);

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
            "The DSA learning path for this language was not found. Showing the stage list."
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

        try {
          const pathResources = unwrap(
            await fetchJson(`${API}/paths/${pathId}/resources`)
          );

          if (!cancelled) {
            setResources(pathResources);
          }
        } catch {
          // The stage page remains usable if this optional endpoint fails.
        }
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

  // Load database videos for every learning step in the selected stage.
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

        // Remove duplicate records by resource ID or URL.
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
            "The stage has learning steps, but their resource endpoints returned no video resources. Check the step IDs and resource links."
          );
        } else if (!steps.length) {
          setError(
            "No learning steps were returned for this stage. The stage title exists, but lessons may not yet be connected."
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

  async function selectStage(stage) {
    setActiveStageId(String(getId(stage)));
  }

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

            <button
              className="lr-explore-more-button"
              onClick={() => setShowResources((value) => !value)}
            >
              <span>
                <b>Explore more resources</b>
                <small>
                  Articles, documentation, GitHub, community and practice
                </small>
              </span>

              <span>{showResources ? "−" : "+"}</span>
            </button>

            {showResources && (
              <div className="lr-explore-inline">
                <h2>Resources for DSA with {language.name}</h2>

                {resources.filter((resource) => !isVideo(resource)).length >
                0 ? (
                  <div className="lr-resource-list">
                    {resources
                      .filter((resource) => !isVideo(resource))
                      .map((resource, index) => (
                        <a
                          className="lr-resource"
                          key={resource.id ?? index}
                          href={resource.url ?? resource.link ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="lr-resource-copy">
                            <strong>
                              {resource.title ??
                                resource.name ??
                                "Learning resource"}
                            </strong>
                          </span>

                          <span className="lr-watch-button">
                            Open ↗
                          </span>
                        </a>
                      ))}
                  </div>
                ) : (
                  <div className="lr-empty-card">
                    No additional resources are linked to this DSA path yet.
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}