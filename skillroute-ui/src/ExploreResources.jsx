
import React, { useEffect, useState } from "react";
import "./ExploreResources.css";

const API_BASE = "http://localhost:8081/api";

const CATEGORY_ORDER = [
  "Documentation",
  "Practice Problems",
  "GitHub Examples",
  "Community Discussions",
];

const CATEGORY_INFO = {
  Documentation: {
    icon: "▤",
    description: "Learn concepts and understand algorithms",
  },
  "Practice Problems": {
    icon: "✓",
    description: "Practice and improve your problem-solving skills",
  },
  "GitHub Examples": {
    icon: "⌘",
    description: "Explore implementations and code examples",
  },
  "Community Discussions": {
    icon: "◎",
    description: "Ask questions and learn together",
  },
};

export default function ExploreResources({ domainId = 2 }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchResources() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/explore-resources/${domainId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch explore resources:", err);
          setError("Unable to load resources. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchResources();

    return () => controller.abort();
  }, [domainId]);

  const groupedResources = CATEGORY_ORDER.map((category) => ({
    category,
    items: resources.filter((resource) => resource.category === category),
  }));

  if (loading) {
    return (
      <section className="explore-resources">
        <h2>Explore More Resources ↗</h2>
        <p>Loading DSA resources...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="explore-resources">
        <h2>Explore More Resources ↗</h2>
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="explore-resources">
      <div className="explore-resources-heading">
        <h2>Explore More Resources ↗</h2>
        <p>Articles, documentation, GitHub, community &amp; practice</p>
      </div>

      {resources.length === 0 ? (
        <p>No additional resources are available yet.</p>
      ) : (
        <>
          <div className="explore-resources-list">
            {groupedResources.map(({ category, items }) => {
              if (items.length === 0) return null;

              const info = CATEGORY_INFO[category];

              return (
                <div className="explore-resource-category" key={category}>
                  <div className="explore-resource-category-header">
                    <span
                      className="explore-resource-icon"
                      aria-hidden="true"
                    >
                      {info.icon}
                    </span>

                    <div className="explore-resource-category-info">
                      <h3>{category}</h3>
                      <p>
                        {items.length}{" "}
                        {items.length === 1 ? "resource" : "resources"}
                      </p>
                    </div>
                  </div>

                  <div className="explore-resource-links">
                    {items.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explore-resource-link"
                      >
                        {resource.title} <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="explore-resources-total">
            Showing {resources.length} resources
          </p>
        </>
      )}
    </section>
  );
}
