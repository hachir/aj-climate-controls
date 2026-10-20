"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cable, Fan, Gauge, Search, Settings2, Siren, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchTools } from "@/lib/tool-directory";
import styles from "./tool-directory.module.css";

const icons = { Cable, Fan, Gauge, Settings2, Siren, Zap };

export function ToolDirectory() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const tools = searchTools(query);

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <section aria-label="Find an HVAC tool">
      <div className={styles.search}>
        <div className={styles.field}>
          <label htmlFor="tool-search">Find a tool</label>
          <div className={styles.input}>
            <Search aria-hidden="true" />
            <input ref={searchRef} id="tool-search" type="search" value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Escape") clearSearch(); }}
              placeholder="Try VFD, BACnet, fire alarm or CFM"
              aria-describedby="tool-search-count" aria-controls="tool-search-results" />
          </div>
        </div>
        <Button type="button" variant="outline" onClick={clearSearch} disabled={!query}>Clear search</Button>
      </div>
      <p id="tool-search-count" className={styles.count} role="status" aria-live="polite" aria-atomic="true">
        {tools.length} {tools.length === 1 ? "tool" : "tools"} found
      </p>
      <div id="tool-search-results">
        {tools.map((tool) => {
          const Icon = icons[tool.icon];
          return <Link className="voltage-tool-link" href={tool.href} key={tool.href}>
            <Icon aria-hidden="true" />
            <span><strong>{tool.title}</strong><small>{tool.description}</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>;
        })}
        {tools.length === 0 && <div className={styles.empty}>
          <h2>No matching tools</h2>
          <p>Try an equipment name, signal type or calculation, or clear the search to see every tool.</p>
          <Button type="button" variant="outline" onClick={clearSearch}>Show all tools</Button>
        </div>}
      </div>
    </section>
  );
}
