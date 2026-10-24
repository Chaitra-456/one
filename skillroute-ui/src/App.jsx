import { useEffect, useState } from "react";
import "./App.css";
import LearningPage from "./LearningPage";
import DsaLearningPage from "./DsaLearningPage";

/* ================== ICONS ================== */
const ICONS = {
  code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  chart:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  cloud: "M3 15a4 4 0 004 4h9a5 5 0 00-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z",
  columns:
    "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  arrow: "M14 5l7 7m0 0l-7 7m7-7H3",
  chevron: "M9 5l7 7-7 7",
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ name, size = 20, width = 2 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={width} d={ICONS[name] || ICONS.code} />
    </svg>
  );
}

/* ================== REAL PLATFORM CONTENT ==================
   The API currently returns domain IDs and names only.
   These descriptions and learning outlines enrich those records in the UI.
   Later, topics/resources can be loaded from dedicated backend endpoints.
============================================================= */
const LANGUAGE_PATHS = [
  {
    id: "c",
    name: "C Programming",
    subtitle: "Start with the fundamentals and build a solid programming foundation.",
    topics: [
      "Introduction to C, compiler and first program",
      "Variables, data types and constants",
      "Operators, input and output",
      "Decision making: if, else and switch",
      "Loops: for, while and do-while",
      "Functions and variable scope",
      "Arrays and strings",
      "Pointers and memory addresses",
      "Structures, unions and enumerations",
      "Dynamic memory allocation",
      "File handling and error checking",
      "Practice problems and mini projects",
    ],
    resources: [
      { label: "Programiz — C Programming Tutorial", url: "https://www.programiz.com/c-programming" },
      { label: "learn-c.org — Interactive C Tutorial", url: "https://www.learn-c.org/" },
      { label: "GNU — GCC Documentation", url: "https://gcc.gnu.org/documentation.html" },
    ],
  },
  {
    id: "cpp",
    name: "C++",
    subtitle: "Learn modern C++ fundamentals, object-oriented programming and STL.",
    topics: [
      "C++ setup, syntax and basic input/output",
      "Variables, types, operators and control flow",
      "Functions, references and scope",
      "Arrays, strings and vectors",
      "Pointers and memory basics",
      "Classes, objects and constructors",
      "Inheritance and polymorphism",
      "Templates and the Standard Template Library",
      "Exceptions and file handling",
      "Practice problems and mini projects",
    ],
    resources: [
      { label: "LearnCpp — Comprehensive C++ Tutorial", url: "https://www.learncpp.com/" },
      { label: "cppreference — C++ Reference", url: "https://en.cppreference.com/w/" },
    ],
  },
  {
    id: "java",
    name: "Java",
    subtitle: "Progress from Java basics to object-oriented programming and practical applications.",
    topics: [
      "JDK, JVM and your first Java program",
      "Variables, data types and operators",
      "Conditions and loops",
      "Arrays and strings",
      "Classes, objects and constructors",
      "Inheritance, polymorphism and abstraction",
      "Interfaces, packages and access modifiers",
      "Exception handling and collections",
      "File handling and basic streams",
      "Mini projects and problem-solving practice",
    ],
    resources: [
      { label: "dev.java — Learn Java", url: "https://dev.java/learn/" },
      { label: "Java Documentation", url: "https://docs.oracle.com/en/java/" },
    ],
  },
  {
    id: "python",
    name: "Python",
    subtitle: "Learn Python syntax, reusable code, collections and practical scripting.",
    topics: [
      "Install Python and run your first program",
      "Variables, values and data types",
      "Conditions and loops",
      "Functions and modules",
      "Strings, lists, tuples and dictionaries",
      "Files and exception handling",
      "Object-oriented programming basics",
      "Using packages and virtual environments",
      "Automation scripts and mini projects",
    ],
    resources: [
      { label: "Official Python Tutorial", url: "https://docs.python.org/3/tutorial/" },
      { label: "Programiz — Python Tutorial", url: "https://www.programiz.com/python-programming" },
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    subtitle: "Learn the language of the web, from fundamentals to interactive browser apps.",
    topics: [
      "Variables, values and data types",
      "Operators, conditions and loops",
      "Functions, scope and arrow functions",
      "Arrays, objects and common methods",
      "DOM selection and event handling",
      "Modern JavaScript and modules",
      "Promises, async/await and fetch",
      "Working with APIs and JSON",
      "Mini projects and browser applications",
    ],
    resources: [
      { label: "MDN — JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
      { label: "javascript.info — The Modern JavaScript Tutorial", url: "https://javascript.info/" },
    ],
  },
];

const DOMAIN_CONTENT = [
  {
    key: "programming",
    backendId: 1,
    match: ["programming", "programming languages"],
    icon: "code",
    title: "Programming Languages",
    level: "",
    scope: "5 languages",
    focus: "C, C++, Java, Python, JavaScript",
    description:
      "Build your coding foundation with C, C++, Java, Python and JavaScript. Learn syntax, problem-solving, functions and object-oriented programming step by step.",
    topics: ["Syntax & fundamentals", "Conditions & loops", "Functions", "Object-oriented programming"],
  },
  {
    key: "dsa",
    backendId: 2,
    match: ["dsa", "data structures", "data structures and algorithms"],
    icon: "chart",
    title: "Data Structures & Algorithms",
    level: "Problem Solving",
    scope: "Core concepts",
    focus: "Data organization & algorithms",
    description:
      "Learn to organize data and solve problems efficiently, from arrays and linked lists to trees, graphs, searching, sorting and algorithm analysis.",
    topics: ["Arrays & strings", "Linked lists", "Stacks & queues", "Trees & graphs", "Searching & sorting", "Complexity analysis"],
    roadmap: [
      "Problem-solving basics and complexity (Big O)",
      "Arrays and strings",
      "Searching and sorting",
      "Linked lists",
      "Stacks and queues",
      "Hashing and hash maps",
      "Recursion and backtracking",
      "Trees and binary search trees",
      "Heaps and priority queues",
      "Graphs and graph traversal",
      "Greedy algorithms and dynamic programming",
      "Practice problems and revision",
    ],
    resources: [
      { label: "VisuAlgo — Visualise Data Structures", url: "https://visualgo.net/en" },
      { label: "Programiz — Data Structures and Algorithms", url: "https://www.programiz.com/dsa" },
    ],
  },
  {
    key: "web",
    backendId: 3,
    match: ["web development", "web dev", "web"],
    icon: "lock",
    title: "Web Development",
    level: "Build Projects",
    scope: "Full-stack",
    focus: "Frontend, backend & database",
    description:
      "Build complete web applications: create responsive interfaces, add interactivity, develop backend APIs, connect databases and learn how the pieces work together.",
    topics: ["HTML & CSS", "JavaScript & React", "Java Spring Boot", "REST APIs", "MySQL & integration"],
    roadmap: [
      "How the web works: browsers, servers and HTTP",
      "HTML structure and semantic markup",
      "CSS layouts, responsive design and accessibility",
      "JavaScript fundamentals and DOM interaction",
      "React components, props, state and events",
      "Java and Spring Boot fundamentals",
      "REST APIs and JSON communication",
      "MySQL tables, relationships and queries",
      "Connect React, Spring Boot and MySQL",
      "Build and deploy a full-stack project",
    ],
    resources: [
      { label: "MDN — Learn Web Development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development" },
      { label: "React — Quick Start", url: "https://react.dev/learn" },
      { label: "Spring — RESTful Web Services", url: "https://spring.io/guides/gs/rest-service" },
    ],
  },
  // These lower three cards are intentionally retained as future placeholders.
  // We can decide their final content later without changing the six-card layout.
  {
    key: "ai-ml",
    icon: "bolt",
    title: "AI & Machine Learning",
    level: "Coming Soon",
    scope: "Future domain",
    focus: "AI foundations & models",
    description: "This learning domain is reserved for a future update. We will add the right topics and curated resources when this domain is ready.",
    isComingSoon: true,
  },
  {
    key: "cloud",
    icon: "cloud",
    title: "Cloud Computing",
    level: "Coming Soon",
    scope: "Future domain",
    focus: "Cloud & deployment",
    description: "This learning domain is reserved for a future update. We will add the right topics and curated resources when this domain is ready.",
    isComingSoon: true,
  },
  {
    key: "product",
    icon: "columns",
    title: "Product Management",
    level: "Coming Soon",
    scope: "Future domain",
    focus: "Product planning & delivery",
    description: "This learning domain is reserved for a future update. We will add the right topics and curated resources when this domain is ready.",
    isComingSoon: true,
  },
];

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Explore Domains", href: "#domains" },
  { label: "Learning Paths", href: "#features" },
  { label: "Resources", href: "#resources" },
  { label: "About", href: "#about" },
];

const CODE_LINES = [
  { width: "78%", indent: "0%", color: "cyan" },
  { width: "46%", indent: "6%", color: "purple" },
  { width: "62%", indent: "6%", color: "orange" },
  { width: "40%", indent: "12%", color: "purple" },
  { width: "70%", indent: "6%", color: "cyan" },
  { width: "58%", indent: "6%", color: "orange" },
  { width: "66%", indent: "0%", color: "cyan" },
];

const STATS = [
  { value: "Step by Step", label: "Structured Learning" },
];

const badgeClass = (level) =>
  level === "Build Projects"
    ? "badge badge-purple"
    : level === "Problem Solving"
      ? "badge badge-green"
      : "badge badge-blue";

function getDomainContent(record) {
  const name = String(record?.name || "").toLowerCase();
  const info = DOMAIN_CONTENT.find(
    (item) => item.backendId === Number(record?.id) || item.match.some((term) => name.includes(term))
  );

  if (!info) {
    return {
      key: String(record?.id ?? record?.name ?? "domain"),
      id: record?.id,
      icon: "code",
      title: record?.name || "Learning Domain",
      level: "Explore",
      scope: "Learning roadmap",
      focus: "Topics and resources",
      description: "Explore a structured learning path with topics and learning resources for this domain.",
      topics: ["Foundations", "Core concepts", "Practice", "Build a project"],
      roadmap: ["Foundations", "Core concepts", "Practice", "Build a project"],
      resources: [],
    };
  }

  return { ...info, id: record?.id ?? info.backendId };
}

function App() {
  const [domains, setDomains] = useState(DOMAIN_CONTENT.map((item) => ({ ...item, id: item.backendId })));
  const [apiStatus, setApiStatus] = useState("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [searchText, setSearchText] = useState("");
  const [learningLanguage, setLearningLanguage] = useState(null);
  const [dsaLanguage, setDsaLanguage] = useState(null);
  const [selectedDomainKey, setSelectedDomainKey] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetch("http://localhost:8081/api/domains")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load domains");
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (!Array.isArray(data) || data.length === 0) {
          setDomains(DOMAIN_CONTENT.map((item) => ({ ...item, id: item.backendId })));
          setApiStatus("empty");
          return;
        }
        // Use API records for the first three real domains, then retain the
        // three reserved cards at the bottom for future expansion.
        const realDomains = data.slice(0, 3).map(getDomainContent);
        const coreDomains = DOMAIN_CONTENT.slice(0, 3).map((template) => {
          const apiDomain = realDomains.find((domain) => domain.key === template.key);
          return apiDomain || { ...template, id: template.backendId };
        });
        const futureDomains = DOMAIN_CONTENT.slice(3).map((domain) => ({ ...domain, id: domain.key }));
        setDomains([...coreDomains, ...futureDomains]);
        setApiStatus("connected");
      })
      .catch(() => {
        if (isMounted) {
          setDomains(DOMAIN_CONTENT.map((item) => ({ ...item, id: item.backendId })));
          setApiStatus("offline");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const visibleDomains = domains.filter((domain) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return `${domain.title} ${domain.description} ${(domain.topics || []).join(" ")}`.toLowerCase().includes(query);
  });

  const openDomainPath = (domain) => {
    if (domain.isComingSoon) {
      setModal({ type: "comingSoon", domain });
    } else if (domain.key === "programming") {
      // Keep the existing programming-language learning flow unchanged.
      setModal(null);
      setLearningLanguage(LANGUAGE_PATHS[0]);
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (domain.key === "dsa") {
      // DSA has its own language chooser and its own language-specific learning page.
      setModal({ type: "dsaLanguages", domain });
    } else {
      setModal({ type: "roadmap", domain });
    }
  };

  const activeModalTitle = () => {
    if (!modal) return "";
    if (modal.type === "languages") return "Choose a Programming Language";
    if (modal.type === "dsaLanguages") return "Choose a Language for DSA";
    if (modal.type === "language") return modal.language.name;
    if (modal.type === "comingSoon") return `${modal.domain.title} — Coming Soon`;
    return modal.domain.title;
  };

  const activeModalDescription = () => {
    if (!modal) return "";
    if (modal.type === "languages") return "Choose a language to view its ordered roadmap and starter learning resources.";
    if (modal.type === "dsaLanguages") return "Choose the language you want to use for Data Structures & Algorithms.";
    if (modal.type === "language") return modal.language.subtitle;
    if (modal.type === "comingSoon") return "We are keeping this card for future expansion. The learning roadmap and curated resources will be added when this domain is ready.";
    return modal.domain.description;
  };

  const renderRoadmap = (topics, resources = []) => (
    <>
      <div className="modal-box">
        <p className="modal-box-title">Learning roadmap</p>
        {topics.map((topic, index) => (
          <div key={`${index}-${topic}`}>
            <span>{topic}</span>
            <span className="blue">{String(index + 1).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
      {resources.length > 0 && (
        <div className="modal-box">
          <p className="modal-box-title">Starter learning resources</p>
          {resources.map((resource) => (
            <a
              key={resource.url}
              className="blue"
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", lineHeight: 1.5 }}
            >
              {resource.label} ↗
            </a>
          ))}
        </div>
      )}
    </>
  );

  if (dsaLanguage) {
    return (
      <DsaLearningPage
        language={dsaLanguage}
        onSelectLanguage={setDsaLanguage}
        onBack={() => { setDsaLanguage(null); window.scrollTo({ top: 0, behavior: "instant" }); }}
      />
    );
  }

  if (learningLanguage) {
    return (
      <LearningPage
        language={learningLanguage}
        languages={LANGUAGE_PATHS}
        onSelectLanguage={setLearningLanguage}
        onBack={() => {
          setLearningLanguage(null);
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
      />
    );
  }

  return (
    <div className="site-wrap skillroute-academics">
      <div className="py-2 bg-light skillroute-topbar">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 d-none d-lg-block">
              <span className="small mr-3"><span className="icon-book mr-2" /> Structured learning paths</span>
              <span className="small mr-3"><span className="icon-laptop mr-2" /> Learn at your own pace</span>
            </div>
            <div className="col-lg-4 text-right">
              <a href="#domains" className="small btn btn-primary px-4 py-2 rounded-0">Start Learning</a>
            </div>
          </div>
        </div>
      </div>

      <header className="site-navbar py-3 js-sticky-header site-navbar-target" role="banner">
        <div className="container">
          <div className="d-flex align-items-center skillroute-nav-inner">
            <div className="site-logo skillroute-logo">
              <a href="#hero" className="d-block">Skill<span>Route</span></a>
            </div>
            <div className="mr-auto">
              <nav className="site-navigation position-relative text-right" role="navigation">
                <ul className="site-menu main-menu js-clone-nav mr-auto d-none d-lg-flex">
                  <li className="active"><a href="#hero" className="nav-link text-left">Home</a></li>
                  <li><a href="#domains" className="nav-link text-left">Learning Domains</a></li>
                  <li><a href="#how-it-works" className="nav-link text-left">How It Works</a></li>
                  <li><a href="#resources" className="nav-link text-left">Resources</a></li>
                  <li><a href="#about" className="nav-link text-left">About</a></li>
                </ul>
              </nav>
            </div>
            <div className="ml-auto skillroute-nav-action">
              <button className="btn btn-primary rounded-0 px-3 py-2" onClick={() => scrollTo("domains")}>Explore Paths</button>
              <button className="skillroute-mobile-toggle d-inline-block d-lg-none" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu"><Icon name={menuOpen ? "close" : "menu"} size={23} /></button>
            </div>
          </div>
          {menuOpen && <div className="skillroute-mobile-menu">
            {NAV_LINKS.map(link => <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
          </div>}
        </div>
      </header>

      <main>
        <section className="hero-slide site-blocks-cover skillroute-hero" id="hero">
<div className="intro-section" style={{backgroundImage: "linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,.38)), url('/academics/images/hero_1.png')"}}>            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-9 mx-auto text-center" data-aos="fade-up">
                  <p className="skillroute-hero-kicker">DISCOVER • LEARN • BUILD</p>
                  <h1>Find Your Path. Build Your Skills.</h1>
                  <p className="lead text-white mt-4 mb-4">Explore structured learning paths, follow topics in the right order, and discover curated resources to help you keep moving forward.</p>
                  <button className="btn btn-primary btn-lg rounded-0 px-4 py-3" onClick={() => scrollTo("domains")}>Explore Learning Domains <Icon name="arrow" size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-section skillroute-benefits" id="how-it-works">
          <div className="container">
            <div className="row mb-5 justify-content-center text-center">
              <div className="col-lg-7">
                <h2 className="section-title-underline mb-3"><span>Learning Made Structured</span></h2>
                <p>Everything you need to move from the basics to confident practice, one step at a time.</p>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="feature-1 border h-100"><div className="icon-wrapper bg-primary"><span className="flaticon-mortarboard text-white"></span></div>
                  <div className="feature-1-content"><h2>Choose Your Domain</h2><p>Start with a subject that matches your interests and goals.</p></div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="feature-1 border h-100"><div className="icon-wrapper bg-primary"><span className="flaticon-book text-white"></span></div>
                  <div className="feature-1-content"><h2>Follow a Roadmap</h2><p>Learn concepts in a clear sequence, from foundations to advanced topics.</p></div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="feature-1 border h-100"><div className="icon-wrapper bg-primary"><span className="flaticon-library text-white"></span></div>
                  <div className="feature-1-content"><h2>Use Curated Resources</h2><p>Find tutorials, documentation, and practice material connected to each step.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-section skillroute-domains" id="domains">
          <div className="container">
            <div className="row mb-5 justify-content-center text-center">
              <div className="col-lg-7">
                <h2 className="section-title-underline mb-3"><span>Choose Your Learning Domain</span></h2>
                <p>Choose a domain and start exploring its learning path and resources.</p>
              </div>
            </div>
            <div className="row">
              {visibleDomains.map((domain) => (
                <div className="col-lg-4 col-md-6 mb-4" key={domain.id ?? domain.key}>
                  <article className={`feature-1 border skillroute-domain-card h-100 ${selectedDomainKey === (domain.id ?? domain.key) ? "selected" : ""}`} onClick={() => setSelectedDomainKey(domain.id ?? domain.key)}>
                    <div className="icon-wrapper bg-primary"><span className={`text-white skillroute-domain-symbol symbol-${domain.icon}`}><Icon name={domain.icon} size={28}/></span></div>
                    <div className="feature-1-content">
                      <h2>{domain.title}</h2>
                      <p>{domain.description}</p>
                      <p className="skillroute-domain-focus"><strong>Focus:</strong> {domain.focus}</p>
                      <button className="btn btn-primary rounded-0 px-4 py-2" onClick={(event) => { event.stopPropagation(); openDomainPath(domain); }}>
                        {domain.isComingSoon ? "Coming Soon" : "Explore Path"} <Icon name="arrow" size={15}/>
                      </button>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            {visibleDomains.length === 0 && <p className="text-center">No domains matched “{searchText}”. Try another search.</p>}
            {apiStatus === "offline" && <p className="text-center text-muted small">Showing starter domains. Start Spring Boot to load domain records from the API.</p>}
          </div>
        </section>

        <section className="section-bg style-1 skillroute-callout" style={{backgroundImage: "linear-gradient(rgba(26,55,77,.82),rgba(26,55,77,.82)), url('/academics/images/bg_1.jpg')"}} id="resources">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h2 className="section-title-underline style-2"><span>Less Searching. More Learning.</span></h2>
                <p className="lead">SkillRoute brings learning steps and useful resources together, so you can understand what to study first, what comes next, and where to practise.</p>
              </div>
              <div className="col-lg-4 text-lg-right mt-4 mt-lg-0"><button className="btn btn-primary rounded-0 px-4 py-3" onClick={() => scrollTo("domains")}>Browse Learning Paths</button></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-section" id="about">
        <div className="container">
          <div className="row">
            <div className="col-md-4"><h3>SkillRoute</h3><p>Find your path. Build your skills. Learn step by step with structured roadmaps and curated resources.</p></div>
            <div className="col-md-3 ml-auto"><h3>Explore</h3><ul className="list-unstyled footer-links"><li><a href="#hero">Home</a></li><li><a href="#domains">Learning Domains</a></li><li><a href="#how-it-works">How It Works</a></li><li><a href="#resources">Resources</a></li></ul></div>
            <div className="col-md-4"><h3>Keep Learning</h3><p>Choose a learning domain and follow your next step with SkillRoute.</p><button className="btn btn-primary rounded-0" onClick={() => scrollTo("domains")}>Get Started</button></div>
          </div>
          <div className="row pt-5 mt-5 text-center"><div className="col-md-12"><p>© {new Date().getFullYear()} SkillRoute. Learn • Practise • Grow.</p></div></div>
        </div>
      </footer>

      {/* ============ LEARNING PATH MODAL ============ */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="path-modal-title"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-head">
              <h3 id="path-modal-title">{activeModalTitle()}</h3>
              <button className="modal-close" onClick={() => setModal(null)} aria-label="Close learning path">
                <Icon name="close" size={20} />
              </button>
            </div>

            <p className="modal-text">{activeModalDescription()}</p>

            {modal.type === "comingSoon" && (
              <div className="modal-box">
                <p className="modal-box-title">Reserved for a future update</p>
                <div><span>Domain card</span><span className="blue">Kept in place</span></div>
                <div><span>Roadmap and resources</span><span>To be added</span></div>
              </div>
            )}

            {modal.type === "dsaLanguages" && (
              <div className="modal-box">
                <p className="modal-box-title">Choose a language</p>
                {[
                  { id: "c", name: "C", subtitle: "DSA using C" },
                  { id: "cpp", name: "C++", subtitle: "DSA using C++" },
                  { id: "java", name: "Java", subtitle: "DSA using Java" },
                  { id: "python", name: "Python", subtitle: "DSA using Python" },
                ].map((language) => (
                  <button key={language.id} className="btn-outline" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", gap: "12px" }} onClick={() => { setModal(null); setDsaLanguage(language); window.scrollTo({ top: 0, behavior: "instant" }); }}>
                    <span><strong>{language.name}</strong><small style={{ display: "block", color: "#7b879d", marginTop: 4 }}>{language.subtitle}</small></span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            )}

            {modal.type === "languages" && (
              <div className="modal-box">
                <p className="modal-box-title">Choose a language</p>
                {LANGUAGE_PATHS.map((language) => (
                  <button
                    key={language.id}
                    className="btn-outline"
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", gap: "12px" }}
                    onClick={() => {
                      setModal(null);
                      setLearningLanguage(language);
                      window.scrollTo({ top: 0, behavior: "instant" });
                    }}
                  >
                    <span>{language.name}</span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            )}

            {modal.type === "language" && renderRoadmap(modal.language.topics, modal.language.resources)}

            {modal.type === "roadmap" && renderRoadmap(modal.domain.roadmap || modal.domain.topics, modal.domain.resources || [])}

            <div className="modal-actions">
              {modal.type === "language" && (
                <button className="btn-outline" onClick={() => setModal({ type: "languages", domain: modal.domain })}>
                  Back to Languages
                </button>
              )}
              <button className="btn btn-blue btn-small" onClick={() => setModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      <div className={`toast ${toast ? "toast-show" : ""}`} role="status">{toast}</div>
    </div>
  );
}

export default App;
