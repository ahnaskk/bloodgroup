(() => {
  // node_modules/@vercel/analytics/dist/index.mjs
  var name = "@vercel/analytics";
  var version = "1.6.1";
  var initQueue = () => {
    if (window.va) return;
    window.va = function a(...params) {
      (window.vaq = window.vaq || []).push(params);
    };
  };
  function isBrowser() {
    return typeof window !== "undefined";
  }
  function detectEnvironment() {
    try {
      const env = "development";
      if (env === "development" || env === "test") {
        return "development";
      }
    } catch (e) {
    }
    return "production";
  }
  function setMode(mode = "auto") {
    if (mode === "auto") {
      window.vam = detectEnvironment();
      return;
    }
    window.vam = mode;
  }
  function getMode() {
    const mode = isBrowser() ? window.vam : detectEnvironment();
    return mode || "production";
  }
  function isDevelopment() {
    return getMode() === "development";
  }
  function getScriptSrc(props) {
    if (props.scriptSrc) {
      return props.scriptSrc;
    }
    if (isDevelopment()) {
      return "https://va.vercel-scripts.com/v1/script.debug.js";
    }
    if (props.basePath) {
      return `${props.basePath}/insights/script.js`;
    }
    return "/_vercel/insights/script.js";
  }
  function inject(props = {
    debug: true
  }) {
    var _a;
    if (!isBrowser()) return;
    setMode(props.mode);
    initQueue();
    if (props.beforeSend) {
      (_a = window.va) == null ? void 0 : _a.call(window, "beforeSend", props.beforeSend);
    }
    const src = getScriptSrc(props);
    if (document.head.querySelector(`script[src*="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.sdkn = name + (props.framework ? `/${props.framework}` : "");
    script.dataset.sdkv = version;
    if (props.disableAutoTrack) {
      script.dataset.disableAutoTrack = "1";
    }
    if (props.endpoint) {
      script.dataset.endpoint = props.endpoint;
    } else if (props.basePath) {
      script.dataset.endpoint = `${props.basePath}/insights`;
    }
    if (props.dsn) {
      script.dataset.dsn = props.dsn;
    }
    script.onerror = () => {
      const errorMessage = isDevelopment() ? "Please check if any ad blockers are enabled and try again." : "Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";
      console.log(
        `[Vercel Web Analytics] Failed to load script from ${src}. ${errorMessage}`
      );
    };
    if (isDevelopment() && props.debug === false) {
      script.dataset.debug = "false";
    }
    document.head.appendChild(script);
  }

  // src/app.js
  inject();
  (() => {
    const THEME_KEY = "bloodDonorTheme";
    const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const state = {
      members: [],
      filter: "All",
      search: "",
      sort: "name-asc"
    };
    const el = {
      loader: document.getElementById("loader"),
      app: document.getElementById("app"),
      searchInput: document.getElementById("searchInput"),
      filterBar: document.getElementById("filterBar"),
      memberList: document.getElementById("memberList"),
      noResults: document.getElementById("noResults"),
      darkModeToggle: document.getElementById("darkModeToggle")
    };
    async function loadMembers() {
      try {
        const response = await fetch("./data/members.json");
        if (!response.ok) {
          throw new Error("Failed to load donor data");
        }
        const data = await response.json();
        state.members = Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn("Could not load members from JSON file.", error);
        state.members = [];
      }
    }
    function loadTheme() {
      const theme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      applyTheme(theme);
    }
    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
      document.querySelector(".icon-sun").hidden = theme === "dark";
      document.querySelector(".icon-moon").hidden = theme !== "dark";
    }
    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    }
    function render() {
      renderFilters();
      renderList();
    }
    function renderFilters() {
      const groups = ["All", ...BLOOD_GROUPS];
      el.filterBar.innerHTML = groups.map((g) => `<button class="filter-chip ${state.filter === g ? "active" : ""}" data-group="${g}">${g}</button>`).join("");
    }
    function getFilteredSortedMembers() {
      const q = state.search.trim().toLowerCase();
      let list = state.members.filter((m) => {
        const matchesFilter = state.filter === "All" || m.bloodGroup === state.filter;
        const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q);
        return matchesFilter && matchesSearch;
      });
      if (state.sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
      else if (state.sort === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
      else if (state.sort === "bloodGroup") list.sort((a, b) => a.bloodGroup.localeCompare(b.bloodGroup) || a.name.localeCompare(b.name));
      return list;
    }
    function renderList() {
      const list = getFilteredSortedMembers();
      el.noResults.hidden = list.length !== 0;
      el.memberList.hidden = list.length === 0;
      el.memberList.innerHTML = list.map(
        (m) => `
      <div class="member-card" data-id="${m.id}">
        <div class="member-card-top">
          <div>
            <p class="member-name">${escapeHtml(m.name)}</p>
            <p class="member-phone">${escapeHtml(m.phone)}</p>
          </div>
          <span class="badge">${m.bloodGroup}</span>
        </div>
        <div class="member-card-actions">
          <a class="action-btn call" href="tel:+91${m.phone}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>
        </div>
      </div>`
      ).join("");
    }
    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }
    function render() {
      renderFilters();
      renderList();
    }
    function bindEvents() {
      el.searchInput.addEventListener("input", (e) => {
        state.search = e.target.value;
        renderList();
      });
      el.filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-chip");
        if (!btn) return;
        state.filter = btn.dataset.group;
        renderFilters();
        renderList();
      });
      el.darkModeToggle.addEventListener("click", toggleTheme);
    }
    async function init() {
      loadTheme();
      await loadMembers();
      bindEvents();
      render();
      setTimeout(() => {
        el.loader.hidden = true;
        el.app.hidden = false;
      }, 400);
    }
    document.addEventListener("DOMContentLoaded", init);
  })();
})();
