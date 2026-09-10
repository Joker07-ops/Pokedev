import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Loader from "@/components/Loader";
import ErrorMessage from "@/components/ErrorMessage";
import PokemonCard from "@/components/PokemonCard";
import { HeartIcon, SwordsIcon, CloseIcon, ArrowLeftIcon, ArrowRightIcon } from "@/components/Icons";
import {
  getAllPokemon,
  searchPokemon,
  type PokemonListItem,
} from "@/data";
import { useFavoritesContext } from "@/context/FavoritesContext";
import styles from "./Home.module.css";

const PAGE_SIZE = 40;

function parsePage(sp: URLSearchParams): number {
  const p = parseInt(sp.get("page") || "1", 10);
  return isNaN(p) || p < 1 ? 1 : p;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPokemon, setAllPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favorites } = useFavoritesContext();
  const showFavorites = searchParams.get("fav") === "1";
  const favCount = favorites.size;

  // Sync search state from URL on back/forward navigation
  const searchQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const page = parsePage(searchParams);

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

  const [filtered, setFiltered] = useState<PokemonListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    searchPokemon(search)
      .then((data) => {
        if (!cancelled) {
          if (showFavorites) {
            setFiltered(data.filter((p) => favorites.has(p.id)));
          } else {
            setFiltered(data);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFiltered([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, showFavorites, favCount, favorites]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const visible = useMemo(
    () => filtered.slice(startIdx, startIdx + PAGE_SIZE),
    [filtered, startIdx],
  );

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams);
      if (p <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(p));
      }
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const toggleFavorites = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (showFavorites) {
      params.delete("fav");
    } else {
      params.set("fav", "1");
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, showFavorites]);

  if (loading) return <Loader />;

  if (error) return <ErrorMessage message={error} />;

  return (
    <section className={styles.catalog}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Pokemon Catalog</h1>
          <p className={styles.subtitle}>
            Browse {allPokemon.length} Pokemon &mdash; click a card to view
            details
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.favFilter} ${showFavorites ? styles.favActive : ""}`}
            onClick={toggleFavorites}
          >
            <HeartIcon size={14} filled /> Favorites{" "}
            {favCount > 0 && (
              <span className={styles.favCount}>{favCount}</span>
            )}
          </button>
          <Link to="/compare" className={styles.compareLink}>
            <SwordsIcon size={14} /> Compare
          </Link>
        </div>
      </div>

      <div className={styles.searchBar} role="search">
        <label htmlFor="pokemon-search" className="sr-only">
          Search Pokemon
        </label>
        <input
          id="pokemon-search"
          type="search"
          className={styles.searchInput}
          placeholder="Search Pokemon by name\u2026"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search Pokemon by name"
        />
        {search && (
          <button
            className={styles.searchClear}
            onClick={() => handleSearch("")}
            type="button"
            aria-label="Clear search"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className={styles.noResults}>
          {showFavorites
            ? "No favorite Pokemon yet. Click the heart icon on any card to add one!"
            : `No Pokemon found matching "${search}"`}
        </p>
      ) : (
        <div className={styles.grid}>
          {visible.map((p) => (
            <PokemonCard key={p.name} name={p.name} id={p.id} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          <button
            className={styles.pageBtn}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            type="button"
            aria-label="Previous page"
          >
            <ArrowLeftIcon size={14} /> Prev
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            type="button"
            aria-label="Next page"
          >
            Next <ArrowRightIcon size={14} />
          </button>
        </nav>
      )}
    </section>
  );
}
