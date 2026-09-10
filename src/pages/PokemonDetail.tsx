import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import ErrorMessage from "@/components/ErrorMessage";
import PokemonViewer3D from "@/components/PokemonViewer3D";
import EvolutionChain from "@/components/EvolutionChain";
import FavoritesButton from "@/components/FavoritesButton";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import {
  getPokemonByName,
  getAllPokemon,
  type LocalPokemon,
} from "@/data";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SearchIcon,
  RotateIcon,
  RulerIcon,
  ScaleIcon,
  StarIcon,
  BarChartIcon,
  HeartIcon,
  SwordsIcon,
  ShieldIcon,
  SparklesIcon,
  TargetIcon,
  WindIcon,
} from "@/components/Icons";
import {
  spriteUrl,
  homeSpriteUrl,
  TYPE_COLORS,
  formatHeight,
  formatWeight,
} from "@/utils/pokemon";
import { preloadImage } from "@/utils/imageCache";
import styles from "./PokemonDetail.module.css";

const STAT_MAX = 255;

const STAT_COLORS: Record<string, string> = {
  hp: "#ef4444",
  attack: "#f97316",
  defense: "#eab308",
  "special-attack": "#3b82f6",
  "special-defense": "#22c55e",
  speed: "#ec4899",
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  hp: <HeartIcon size={14} filled />,
  attack: <SwordsIcon size={14} />,
  defense: <ShieldIcon size={14} />,
  "special-attack": <SparklesIcon size={14} />,
  "special-defense": <TargetIcon size={14} />,
  speed: <WindIcon size={14} />,
};

function statRating(value: number): string {
  if (value >= 150) return styles.statExcellent;
  if (value >= 100) return styles.statGreat;
  if (value >= 70) return styles.statGood;
  if (value >= 50) return styles.statAverage;
  return styles.statLow;
}

function handleBack(navigate: ReturnType<typeof useNavigate>) {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate("/");
  }
}

export default function PokemonDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pokemon, setPokemon] = useState<LocalPokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<{
    prev: string | null;
    next: string | null;
  }>({ prev: null, next: null });

  useKeyboardNav(name);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setImgError(false);
    setLoading(true);
    setError(null);
    setPokemon(null);

    if (!name) {
      setPokemon(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getPokemonByName(name)
      .then((p) => {
        if (!cancelled) {
          setPokemon(p ?? null);
          if (!p) setError(`Pokemon "${name}" not found.`);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load Pokemon data.",
          );
          setLoading(false);
        }
      });

    getAllPokemon()
      .then((list) => {
        if (!cancelled) {
          const idx = list.findIndex((p) => p.name === name);
          setNeighbors({
            prev: idx > 0 ? list[idx - 1].name : null,
            next: idx < list.length - 1 ? list[idx + 1].name : null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNeighbors({ prev: null, next: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loading) return <Loader />;

  if (error) return <ErrorMessage message={error} onRetry={() => navigate("/")} />;

  if (!pokemon) {
    return (
      <section className={styles.detail}>
        <button
          type="button"
          className={styles.back}
          onClick={() => handleBack(navigate)}
        >
          <span className={styles.backArrow}><ArrowLeftIcon size={16} /></span> Back to Catalog
        </button>
        <div className={styles.notFound}>
          <span className={styles.notFoundIcon}>
            <SearchIcon size={48} />
          </span>
          <h2 className={styles.notFoundTitle}>Pokemon not found</h2>
          <p className={styles.notFoundText}>
            &quot;{name}&quot; doesn&apos;t exist in the PokeAPI database.
          </p>
          <button
            className={styles.notFoundBtn}
            onClick={() => handleBack(navigate)}
            type="button"
          >
            Back to Catalog
          </button>
        </div>
      </section>
    );
  }

  const id = pokemon.id;
  const image = spriteUrl(id);
  const types = pokemon.types.map((t) => t.name);
  const primaryType = types[0] || "normal";
  const primaryColor = TYPE_COLORS[primaryType] || "#888";
  const abilities = pokemon.abilities;
  const stats = pokemon.stats;
  const totalStats = stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <section
      className={styles.detail}
      style={
        {
          "--type-color": primaryColor,
          "--type-color-20": primaryColor + "33",
          "--type-color-40": primaryColor + "66",
        } as React.CSSProperties
      }
    >
      <div className={styles.typeGlow} />

      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.back}
          onClick={() => handleBack(navigate)}
        >
          <span className={styles.backArrow}><ArrowLeftIcon size={16} /></span> Back to Catalog
        </button>
        <div className={styles.topActions}>
          <FavoritesButton pokemonId={id} />
          <span className={styles.kbdHint} title="Use arrow keys to navigate">
            <ArrowLeftIcon size={12} /> <ArrowRightIcon size={12} />
          </span>
        </div>
      </div>

      <div className={styles.navRow}>
        {neighbors.prev ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => navigate(`/pokemon/${neighbors.prev}`)}
          >
            <ArrowLeftIcon size={14} /> {neighbors.prev}
          </button>
        ) : (
          <span />
        )}
        {neighbors.next ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => navigate(`/pokemon/${neighbors.next}`)}
          >
            {neighbors.next} <ArrowRightIcon size={14} />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTop}>
            <span className={styles.cardId}>
              #{String(id).padStart(3, "0")}
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
          </div>
          <h1 className={styles.cardName}>{pokemon.name}</h1>
        </div>

        <div className={styles.layout}>
          <button
            type="button"
            className={styles.imageSection}
            onClick={() => !imgError && setViewerOpen(true)}
            onMouseEnter={() => { preloadImage(homeSpriteUrl(id)).catch(() => {}); }}
            aria-label={`Open 3D viewer for ${pokemon.name}`}
          >
            <div className={styles.imageAura} />
            <div className={styles.imageRing} />
            {imgError ? (
              <span
                className={styles.imageFallback}
                aria-label={`Image not available for ${pokemon.name}`}
              >
                ?
              </span>
            ) : (
              <>
                <img
                  src={image}
                  alt={`Official artwork of ${pokemon.name}`}
                  className={styles.image}
                  onError={() => setImgError(true)}
                  draggable={false}
                />
                <span className={styles.viewHint}>
                  <span className={styles.viewHintIcon}><RotateIcon size={12} /></span>{" "}
                  View in 3D
                </span>
              </>
            )}
          </button>

          <div className={styles.infoSection}>
            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span className={styles.metaIcon}><RulerIcon size={20} /></span>
                <span className={styles.metaLabel}>Height</span>
                <span className={styles.metaValue}>
                  {formatHeight(pokemon.height)}
                </span>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaIcon}><ScaleIcon size={20} /></span>
                <span className={styles.metaLabel}>Weight</span>
                <span className={styles.metaValue}>
                  {formatWeight(pokemon.weight)}
                </span>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaIcon}><StarIcon size={20} /></span>
                <span className={styles.metaLabel}>Base EXP</span>
                <span className={styles.metaValue}>
                  {pokemon.base_experience ?? "\u2014"}
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Abilities</h2>
              <div className={styles.abilitiesList}>
                {abilities.map((a) => (
                  <span
                    key={a.name}
                    className={`${styles.abilityTag} ${a.hidden ? styles.abilityHidden : ""}`}
                    title={a.hidden ? "Hidden ability" : "Regular ability"}
                  >
                    {a.hidden && (
                      <span className={styles.abilityStar}><StarIcon size={10} filled /></span>
                    )}
                    {a.name.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Type Effectiveness</h2>
              <div className={styles.typeRow}>
                {types.map((t) => (
                  <div
                    key={t}
                    className={styles.typeCard}
                    style={{ borderColor: TYPE_COLORS[t] || "#777" }}
                  >
                    <span
                      className={styles.typeDot}
                      style={{ backgroundColor: TYPE_COLORS[t] || "#777" }}
                    />
                    <span className={styles.typeCardName}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.statsHeader}>
            <h2 className={styles.sectionHeading}>Base Stats</h2>
            <span className={styles.statsTotal}>
              Total <strong>{totalStats}</strong>
            </span>
          </div>
          <div className={styles.statsGrid}>
            {stats.map((s, i) => {
              const pct = Math.min((s.value / STAT_MAX) * 100, 100);
              const color = STAT_COLORS[s.name] || "var(--accent)";
              return (
                <div key={s.name} className={styles.statRow}>
                  <span className={styles.statIcon}>
                    {STAT_ICONS[s.name] || <BarChartIcon size={14} />}
                  </span>
                  <span className={styles.statName}>
                    {s.name.replace("-", " ")}
                  </span>
                  <span className={styles.statValue}>{s.value}</span>
                  <div
                    className={`${styles.statBarTrack} ${statRating(s.value)}`}
                    role="meter"
                    aria-valuenow={s.value}
                    aria-valuemin={0}
                    aria-valuemax={STAT_MAX}
                    aria-label={`${s.name.replace("-", " ")} stat`}
                  >
                    <div
                      className={styles.statBarFill}
                      style={
                        {
                          "--bar-color": color,
                          "--bar-width": `${pct}%`,
                          "--bar-delay": `${i * 0.08}s`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EvolutionChain pokemonName={pokemon.name} />

      <PokemonViewer3D
        pokemonId={id}
        pokemonName={pokemon.name}
        types={types}
        stats={stats}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </section>
  );
}
