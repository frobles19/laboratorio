"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MultiSelectItem = { id: string; label: string; hint?: string };

export function MultiSelect({
  name,
  items,
  placeholder,
  defaultSelectedIds,
}: {
  name: string;
  items: MultiSelectItem[];
  placeholder: string;
  defaultSelectedIds?: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds ?? []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const selectedItems = useMemo(
    () => selectedIds.map((id) => items.find((it) => it.id === id)).filter((it): it is MultiSelectItem => !!it),
    [selectedIds, items]
  );

  const results = useMemo(() => {
    const pool = items.filter((it) => !selectedIds.includes(it.id));
    const q = query.trim().toLowerCase();
    const filtered = q ? pool.filter((it) => it.label.toLowerCase().includes(q)) : pool;
    return filtered.slice(0, 6);
  }, [items, selectedIds, query]);

  return (
    <div className="multiselect" data-ms={name} ref={rootRef}>
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <input
        type="text"
        className="ms-search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <div className={`ms-results${open ? " open" : ""}`}>
        {results.length === 0 ? (
          <div className="ms-empty">Sin resultados</div>
        ) : (
          results.map((it) => (
            <div
              key={it.id}
              className="ms-result-row"
              onClick={() => {
                setSelectedIds((s) => [...s, it.id]);
                setQuery("");
                setOpen(false);
              }}
            >
              <span>{it.label}</span>
              {it.hint && (
                <span className="pill warn" style={{ flex: "none" }}>
                  <span className="dot"></span>
                  {it.hint}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="ms-selected">
        {selectedItems.map((it) => (
          <div className="ms-selected-row" key={it.id}>
            <span>{it.label}</span>
            <button
              type="button"
              className="ms-remove"
              title="Quitar"
              onClick={() => setSelectedIds((s) => s.filter((id) => id !== it.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
