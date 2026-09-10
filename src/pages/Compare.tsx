import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "@/components/Loader";
import ErrorMessage from "@/components/ErrorMessage";
import {
  getAllPokemon,
  getPokemonByName,
  type LocalPokemon,
  type PokemonListItem,
} from "@/data";
import { spriteUrl, TYPE_COLORS } from "@/utils/pokemon";
import styles from "./Compare.module.css";

const STAT_MAX = 255;

const STAT_COLORS: Record<string, string> = {
  hp: "#ef4444",
  attack: "#f97316",
  defense: "#eab308",
  "special-attack": "#3b82f6",
  "special-defense": "#22c55e",
  speed: "#ec4899",
};

function CompareCard({
  pokemon,
  side,
  onSelect,
  allNames,
}: {
  pokemon: LocalPokemon | null;
  side: "left" | "right";
  onSelect: (name: string) => void;
  allNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!filter) return allNames;
    const q = filter.toLowerCase();
    return allNames.filter((n) => n.includes(q));
  }, [allNames, filter]);

  if (!pokemon) {
    return (
      <div className={`${styles.emptySlot} ${styles[side]}`} ref={dropdownRef}>
        <button
          type="button"
          className={styles.selectBtn}
          onClick={() => setOpen(true)}
        >
          Select Pokemon
        </button>
        {open && (
          <div className={styles.dropdown}>
            <input
              type="search"
              className={styles.dropdownSearch}
              placeholder="Search..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
            />
            <div className={styles.dropdownList}>
              {filtered.slice(0, 60).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    onSelect(name);
                    setOpen(false);
                    setFilter("");
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const types = pokemon.types.map((t) => t.name);

  return (
    <div
      className={styles.pokemonCard}
      ref={dropdownRef}
      style={
        {
          "--type-color": TYPE_COLORS[types[0]] || "#888",
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className={styles.changeBtn}
        onClick={() => setOpen(true)}
        aria-label="Change Pokemon"
      >
        Change
      </button>
      {open && (
        <div className={styles.dropdown}>
          <input
            type="search"
            className={styles.dropdownSearch}
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <div className={styles.dropdownList}>
            {filtered.slice(0, 60).map((name) => (
              <button
                key={name}
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  onSelect(name);
                  setOpen(false);
                  setFilter("");
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Link to={`/pokemon/${pokemon.name}`} className={styles.cardLink}>
        <img
          src={spriteUrl(pokemon.id)}
          alt={pokemon.name}
          className={styles.cardImage}
        />
        <h2 className={styles.cardName}>{pokemon.name}</h2>
        <span className={styles.cardId}>
          #{String(pokemon.id).padStart(3, "0")}
        </span>
        <div className={styles.cardTypes}>
          {types.map((t) => (
            <span
              key={t}
              className={styles.typeBadge}
              style={{ backgroundColor: TYPE_COLORS[t] || "#777" }}
            >
              {t}
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}

function StatComparison({
  left,
  right,
}: {
  left: LocalPokemon;
  right: LocalPokemon;
}) {
  const allStats = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed",
  ];

  const leftTotal = left.stats.reduce((s, st) => s + st.value, 0);
  const rightTotal = right.stats.reduce((s, st) => s + st.value, 0);

  return (
    <div className={styles.statsCompare}>
      <h2 className={styles.sectionTitle}>Stat Comparison</h2>
      {allStats.map((statName) => {
        const lVal = left.stats.find((s) => s.name === statName)?.value ?? 0;
        const rVal = right.stats.find((s) => s.name === statName)?.value ?? 0;
        const color = STAT_COLORS[statName] || "var(--accent)";
        const lWin = lVal > rVal;
        const rWin = rVal > lVal;

        return (
          <div key={statName} className={styles.statRow}>
            <span className={`${styles.statValue} ${lWin ? styles.winner : ""}`}>
              {lVal}
            </span>
            <div className={styles.statMiddle}>
              <span className={styles.statName}>
                {statName.replace("-", " ")}
              </span>
              <div className={styles.statBars}>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${lWin ? styles.barWin : ""}`}
                    style={
                      {
                        "--bar-color": color,
                        "--bar-width": `${(lVal / STAT_MAX) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className={`${styles.barTrack} ${styles.barRight}`}>
                  <div
                    className={`${styles.barFill} ${styles.barRight} ${rWin ? styles.barWin : ""}`}
                    style={
                      {
                        "--bar-color": color,
                        "--bar-width": `${(rVal / STAT_MAX) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            </div>
            <span className={`${styles.statValue} ${rWin ? styles.winner : ""}`}>
              {rVal}
            </span>
          </div>
        );
      })}
      <div className={`${styles.statRow} ${styles.totalRow}`}>
        <span
          className={`${styles.statValue} ${leftTotal > rightTotal ? styles.winner : ""}`}
        >
          {leftTotal}
        </span>
        <span className={styles.totalLabel}>Total</span>
        <span
          className={`${styles.statValue} ${rightTotal > leftTotal ? styles.winner : ""}`}
        >
          {rightTotal}
        </span>
      </div>

      <div className={styles.metaCompare}>
        <div className={styles.metaRow}>
          <span className={styles.metaVal}>
            {(left.height / 10).toFixed(1)}m
          </span>
          <span className={styles.metaLabel}>Height</span>
          <span className={styles.metaVal}>
            {(right.height / 10).toFixed(1)}m
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaVal}>
            {(left.weight / 10).toFixed(1)}kg
          </span>
          <span className={styles.metaLabel}>Weight</span>
          <span className={styles.metaVal}>
            {(right.weight / 10).toFixed(1)}kg
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPokemon, setAllPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leftName = searchParams.get("a");
  const rightName = searchParams.get("b");

  const [leftPokemon, setLeftPokemon] = useState<LocalPokemon | null>(null);
  const [rightPokemon, setRightPokemon] = useState<LocalPokemon | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllPokemon()
      .then((data) => {
        if (!cancelled) {
          setAllPokemon(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Pokemon");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (leftName) {
      setLeftPokemon(null);
      getPokemonByName(leftName)
        .then((p) => {
          if (!cancelled) setLeftPokemon(p ?? null);
        })
        .catch(() => {
          if (!cancelled) setLeftPokemon(null);
        });
    } else {
      setLeftPokemon(null);
    }
    return () => { cancelled = true; };
  }, [leftName]);

  useEffect(() => {
    let cancelled = false;
    if (rightName) {
      setRightPokemon(null);
      getPokemonByName(rightName)
        .then((p) => {
          if (!cancelled) setRightPokemon(p ?? null);
        })
        .catch(() => {
          if (!cancelled) setRightPokemon(null);
        });
    } else {
      setRightPokemon(null);
    }
    return () => { cancelled = true; };
  }, [rightName]);

  const allNames = useMemo(() => allPokemon.map((p) => p.name), [allPokemon]);

  const select = (side: "left" | "right", pokemonName: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(side === "left" ? "a" : "b", pokemonName);
    setSearchParams(params, { replace: true });
  };

  if (loading) return <Loader />;

  if (error) return <ErrorMessage message={error} />;

  return (
    <section className={styles.compare}>
      <h1 className={styles.title}>Pokemon Comparison</h1>
      <p className={styles.subtitle}>
        Select two Pokemon to compare their stats side by side
      </p>

      <div className={styles.slots}>
        <CompareCard
          pokemon={leftPokemon}
          side="left"
          onSelect={(n) => select("left", n)}
          allNames={allNames}
        />
        <span className={styles.vs}>VS</span>
        <CompareCard
          pokemon={rightPokemon}
          side="right"
          onSelect={(n) => select("right", n)}
          allNames={allNames}
        />
      </div>

      {leftPokemon && rightPokemon && (
        <StatComparison left={leftPokemon} right={rightPokemon} />
      )}
    </section>
  );
}
