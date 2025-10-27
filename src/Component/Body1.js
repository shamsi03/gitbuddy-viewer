// Body.js
import React, { useEffect, useState, useRef } from "react";
import useFetch from "../useFetch";

/**
 * Updated Body component
 * Features:
 *  - Fetch GitHub users list via https://api.github.com/users?since=<rand>&per_page=<n>
 *  - Validate number input and provide default (10)
 *  - "Load More" that appends more profiles
 *  - Local search (debounced)
 *  - Skeleton loader while fetching
 *  - Per-user detail fetch (followers/following/bio) on demand to avoid rate-limit issues
 *  - Error handling and small UI messages
 *
 * Note: Hitting many /users/:login endpoints can run into GitHub rate limits for unauthenticated requests.
 */

function Body1() {
  const DEFAULT_COUNT = 10;

  const [profile, setProfile] = useState([]); // array of user objects from /users
  const [numberOfProfile, setNumberOfProfile] = useState(""); // user input string
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sinceCursor, setSinceCursor] = useState(null); // store last id for pagination (optional)
  const [detailsMap, setDetailsMap] = useState({}); // { login: { followers, following, bio, fetchedAt } }
  const [message, setMessage] = useState(""); // small UI messages

  const abortRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounce searchInput -> debouncedSearch
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 350); // 350ms debounce
    return () => clearTimeout(debounceTimerRef.current);
  }, [searchInput]);

  // small helper: show temporary UI message
  const flashMessage = (txt, ms = 2000) => {
    setMessage(txt);
    setTimeout(() => setMessage(""), ms);
  };

  // Validate and return a safe count
  const safeCount = (raw) => {
    const n = Number(raw);
    if (!n || isNaN(n)) return DEFAULT_COUNT;
    if (n < 1) return 1;
    if (n > 100) return 100;
    return Math.floor(n);
  };

  // Primary fetch: fetch list of users
  // append: if true, append to existing profile array (Load More)
  async function generateProfile(countPages = DEFAULT_COUNT, append = false) {
    try {
      setError("");
      const count = safeCount(countPages);
      // abort previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      append ? setLoadingMore(true) : setLoading(true);

      // generate random since value if none; otherwise use last id (cursor) to paginate
      let since = Math.floor(1 + Math.random() * 10000);
      if (append && sinceCursor) {
        // try to use cursor to show more consistent pagination
        since = sinceCursor;
      }

      const res = await fetch(
        `https://api.github.com/users?since=${since}&per_page=${count}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const msg = `GitHub API error: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const data = await res.json();

      // update cursor: GitHub returns incremental ids; use last id + 1 for next 'since' if available
      if (Array.isArray(data) && data.length > 0) {
        const lastId = data[data.length - 1].id;
        setSinceCursor(lastId + 1);
      }

      setProfile((prev) => (append ? [...prev, ...data] : data));
      flashMessage(append ? `Appended ${data.length} profiles` : `Loaded ${data.length} profiles`);
    } catch (err) {
      if (err.name === "AbortError") {
        // fetch aborted; ignore
      } else {
        console.error("Error while fetching GitHub profiles:", err);
        setError(err.message || "Failed to load profiles.");
        setProfile((p) => (append ? p : []));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      abortRef.current = null;
    }
  }

  // Fetch extended details for one user (followers, following, bio)
  // We store them in detailsMap to avoid refetching repeatedly
  async function fetchUserDetails(login) {
    if (!login) return;
    // if details exist and are recent (e.g., within 5 minutes), don't re-fetch
    const existing = detailsMap[login];
    if (existing && Date.now() - (existing.fetchedAt || 0) < 1000 * 60 * 5) {
      return;
    }

    try {
      setDetailsMap((d) => ({ ...d, [login]: { loading: true } }));
      const resp = await fetch(`https://api.github.com/users/${login}`);
      if (!resp.ok) throw new Error(`Details fetch failed: ${resp.status}`);
      const obj = await resp.json();
      const details = {
        followers: obj.followers ?? "—",
        following: obj.following ?? "—",
        bio: obj.bio ?? "",
        location: obj.location ?? "",
        company: obj.company ?? "",
        fetchedAt: Date.now(),
        loading: false,
      };
      setDetailsMap((d) => ({ ...d, [login]: details }));
    } catch (err) {
      console.error("Error fetching user details:", err);
      setDetailsMap((d) => ({ ...d, [login]: { loading: false, error: true } }));
      flashMessage("Could not fetch details (rate-limit?)");
    }
  }

  // Derived: filtered list by debouncedSearch (search on login only)
  const filteredProfiles = profile.filter((p) =>
    p.login.toLowerCase().includes(debouncedSearch)
  );

  // initial load once
  useEffect(() => {
    generateProfile(DEFAULT_COUNT, false);
    // cleanup on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="input-section" style={{ marginBottom: 24 }}>
        <input
          type="number"
          min={1}
          max={100}
          placeholder={`Profiles (1-100) — default ${DEFAULT_COUNT}`}
          value={numberOfProfile}
          onChange={(e) => setNumberOfProfile(e.target.value)}
        />
        <button
          onClick={() => {
            const count = safeCount(numberOfProfile || DEFAULT_COUNT);
            generateProfile(count, false);
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>

        <button
          onClick={() => {
            const count = safeCount(numberOfProfile || DEFAULT_COUNT);
            generateProfile(count, true);
          }}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading more..." : "Load More (Append)"}
        </button>

        <input
          type="text"
          placeholder="Search by username"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ marginLeft: 12 }}
        />
        <button
          onClick={() => {
            setSearchInput("");
            setDebouncedSearch("");
            flashMessage("Search cleared");
          }}
        >
          Clear
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: 12, color: "#0a66c2", fontWeight: 600 }}>{message}</div>
      )}

      {error && (
        <div style={{ marginBottom: 12, color: "crimson", fontWeight: 600 }}>
          {error} — try again or reduce requests.
        </div>
      )}

      {/* Skeleton loader when initial loading */}
      {loading && (
        <div className="skeleton-container" aria-live="polite">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-avatar" />
              <div className="skeleton-text" />
              <div className="skeleton-text" style={{ width: "40%" }} />
              <div className="skeleton-button" />
            </div>
          ))}
        </div>
      )}

      {/* Profiles grid */}
      <div className="profile" aria-live="polite">
        {filteredProfiles.length === 0 && !loading && (
          <div style={{ color: "#6b7280", padding: 18 }}>
            No profiles match your search.
          </div>
        )}

        {filteredProfiles.map((value) => {
          const det = detailsMap[value.login];
          return (
            <div key={value.id} className="cards" role="article">
              <img src={value.avatar_url} alt={`${value.login} avatar`} />
              <h2>{value.login}</h2>

              {/* show followers/following if we have details, else show a small button to fetch */}
              <h3 style={{ fontSize: 13, color: "#6b7280" }}>
                {det && !det.loading && !det.error ? (
                  <>
                    {det.followers} Followers | {det.following} Following
                  </>
                ) : det && det.loading ? (
                  <>Loading details...</>
                ) : (
                  <>
                    <span style={{ marginRight: 8 }}>— Followers | — Following</span>
                    <button
                      onClick={() => fetchUserDetails(value.login)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: "#e6f0ff",
                        color: "#004182",
                        fontWeight: 600,
                      }}
                    >
                      Load details
                    </button>
                  </>
                )}
              </h3>

              {/* links */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a
                  href={value.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "8px 12px" }}
                >
                  View Profile
                </a>
                <a
                  href={value.repos_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "8px 12px" }}
                >
                  Repos
                </a>
                <button
                  onClick={() => {
                    // copy username to clipboard
                    navigator.clipboard
                      .writeText(value.login)
                      .then(() => flashMessage("Username copied"))
                      .catch(() => flashMessage("Copy failed"));
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e6ea",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              </div>

              {/* small bio / location if available in details */}
              {det && det.bio ? (
                <p style={{ fontSize: 13, color: "#4b5563", marginTop: 10 }}>{det.bio}</p>
              ) : null}

              {det && det.error && (
                <p style={{ color: "crimson", fontSize: 13, marginTop: 10 }}>
                  Could not load details.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* footer: helpful hint */}
      <div style={{ marginTop: 20, color: "#6b7280", fontSize: 13, textAlign: "center" }}>
        Tip: Click "Load details" to fetch followers/following for a user. Avoid fetching details for too
        many users at once to prevent GitHub rate limits.
      </div>
    </>
  );
}

export default Body1;
