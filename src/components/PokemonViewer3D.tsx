import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { homeSpriteUrl } from "@/utils/pokemon";
import { TYPE_COLORS } from "@/utils/pokemon";
import { preloadImage } from "@/utils/imageCache";
import { CloseIcon } from "@/components/Icons";
import styles from "./PokemonViewer3D.module.css";

interface PokemonViewer3DProps {
  pokemonId: number;
  pokemonName: string;
  types: string[];
  stats?: { name: string; value: number }[];
  isOpen: boolean;
  onClose: () => void;
}

const STAT_MAX = 255;
const STAT_SHORT: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SPA",
  "special-defense": "SPD",
  speed: "SPD",
};

export default function PokemonViewer3D({
  pokemonId,
  pokemonName,
  types,
  stats = [],
  isOpen,
  onClose,
}: PokemonViewer3DProps) {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const rotXRef = useRef(0);
  const rotYRef = useRef(0);
  const zoomRef = useRef(1);

  const primaryColor = TYPE_COLORS[types[0]] || "#3b82f6";
  const secondaryColor = TYPE_COLORS[types[1]] || primaryColor;

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Open / close
  useEffect(() => {
    if (isOpen) {
      const src = homeSpriteUrl(pokemonId);
      setImgError(false);
      setLoaded(false);
      setCachedSrc(null);
      setIsFlipped(false);
      setRotX(0);
      setRotY(0);
      setZoom(1);
      rotXRef.current = 0;
      rotYRef.current = 0;
      zoomRef.current = 1;
      preloadImage(src)
        .then(() => { setCachedSrc(src); })
        .catch(() => { setImgError(true); });
      const t1 = setTimeout(() => setIsActive(true), 50);
      const t2 = setTimeout(() => setLoaded(true), 850);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setIsActive(false);
      setLoaded(false);
    }
  }, [isOpen, pokemonId]);

  // === WHEEL ZOOM ===
  // Callback ref: guaranteed to fire when element mounts/unmounts
  const wheelCleanupRef = useRef<(() => void) | null>(null);

  const overlayRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous listener
    if (wheelCleanupRef.current) {
      wheelCleanupRef.current();
      wheelCleanupRef.current = null;
    }
    if (!node || !isOpen) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      zoomRef.current = Math.max(0.4, Math.min(2.5, zoomRef.current + delta));
      setZoom(zoomRef.current);
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    wheelCleanupRef.current = () => node.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  // === MOUSE MOVE 3D TILT ===
  useEffect(() => {
    if (!isOpen) return;
    function onMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      rotYRef.current = dx * 25;
      rotXRef.current = -dy * 15;
      setRotY(rotYRef.current);
      setRotX(rotXRef.current);
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [isOpen]);

  // === KEYBOARD ===
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "f" || e.key === "F") setIsFlipped((p) => !p);
      if (e.key === "r" || e.key === "R") {
        rotXRef.current = 0;
        rotYRef.current = 0;
        zoomRef.current = 1;
        setRotX(0);
        setRotY(0);
        setZoom(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displaySrc = cachedSrc || homeSpriteUrl(pokemonId);
  const totalStats = stats.reduce((sum, s) => sum + s.value, 0);

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`3D card view for ${pokemonName}`}
      tabIndex={-1}
    >
      {/* Background */}
      <div className={styles.atmosphere}>
        <div
          className={`${styles.bgOrb} ${isActive ? styles.bgOrbActive : ""}`}
          style={{
            background: `radial-gradient(ellipse, ${primaryColor}25 0%, ${secondaryColor}08 45%, transparent 70%)`,
          }}
        />
        <div className={styles.gridFloor} />
      </div>

      {/* Close */}
      <button
        className={styles.closeBtn}
        onClick={onClose}
        type="button"
        aria-label="Close 3D card"
      >
        <CloseIcon size={22} />
      </button>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.ctrlBtn}
          onClick={() => setIsFlipped((p) => !p)}
          type="button"
          title="Flip card (F)"
        >
          <span className={styles.ctrlIcon}>↻</span>
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={() => {
            rotXRef.current = 0;
            rotYRef.current = 0;
            zoomRef.current = 1;
            setRotX(0);
            setRotY(0);
            setZoom(1);
          }}
          type="button"
          title="Reset (R)"
        >
          <span className={styles.ctrlIcon}>R</span>
        </button>
      </div>

      {/* HUD */}
      <div className={styles.hud}>
        <span className={styles.hudLabel}>Move mouse to tilt</span>
        <span className={styles.hudSep}>|</span>
        <span className={styles.hudLabel}>Scroll to zoom</span>
        <span className={styles.hudSep}>|</span>
        <span className={styles.hudLabel}>F to flip</span>
      </div>

      {/* 3D Stage */}
      <div className={styles.stage}>
        {/* Ground shadow */}
        <div
          className={`${styles.groundShadow} ${loaded ? styles.groundShadowActive : ""}`}
          style={{
            background: `radial-gradient(ellipse, ${primaryColor}50 0%, transparent 70%)`,
          }}
        />

        {/* Card wrapper */}
        <div
          className={`${styles.cardWrapper} ${
            loaded ? styles.cardWrapperActive
              : isActive ? `${styles.cardWrapperActive} ${styles.cardEntrance}`
              : ""
          }`}
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`,
          }}
        >
          {/* Card body */}
          <div
            className={styles.cardBody}
            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front face */}
            <div
              className={styles.cardFront}
              style={{
                background: `linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
              }}
            >
              <div
                className={styles.holoFoil}
                style={{
                  background: `conic-gradient(from ${rotY + rotX}deg,
                    ${primaryColor}20 0deg, transparent 30deg,
                    ${secondaryColor}15 60deg, transparent 90deg,
                    rgba(255,255,255,0.06) 120deg, transparent 150deg,
                    ${primaryColor}10 180deg, transparent 210deg,
                    ${secondaryColor}12 240deg, transparent 270deg,
                    rgba(255,255,255,0.04) 300deg, transparent 330deg,
                    ${primaryColor}20 360deg)`,
                }}
              />
              <div className={styles.cardBorder} style={{ borderColor: `${primaryColor}40` }} />

              {/* HP + Name */}
              <div className={styles.cardHeader}>
                <div className={styles.cardHp}>
                  <span className={styles.hpLabel}>HP</span>
                  <span className={styles.hpValue}>{stats.find((s) => s.name === "hp")?.value || "?"}</span>
                </div>
                <h2 className={styles.cardName}>{pokemonName}</h2>
                <span className={styles.cardId}>#{String(pokemonId).padStart(3, "0")}</span>
              </div>

              {/* Pokemon image */}
              <div className={styles.cardImageArea}>
                <div className={styles.cardImageBg} style={{ background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)` }} />
                {imgError ? (
                  <span className={styles.cardImageFallback}>?</span>
                ) : !cachedSrc ? (
                  <div className={styles.cardImagePlaceholder} />
                ) : (
                  <img src={displaySrc} alt={pokemonName} className={styles.cardImage} draggable={false} />
                )}
              </div>

              {/* Types */}
              <div className={styles.cardTypes}>
                {types.map((t) => (
                  <span key={t} className={styles.cardType} style={{ backgroundColor: TYPE_COLORS[t] || "#777" }}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Stats */}
              {stats.length > 0 && (
                <div className={styles.cardStats}>
                  {stats.map((s) => {
                    const pct = Math.min(100, (s.value / STAT_MAX) * 100);
                    return (
                      <div key={s.name} className={styles.cardStatRow}>
                        <span className={styles.cardStatLabel}>{STAT_SHORT[s.name] || s.name}</span>
                        <span className={styles.cardStatValue}>{s.value}</span>
                        <div className={styles.cardStatBar}>
                          <div
                            className={styles.cardStatFill}
                            style={{
                              width: `${pct}%`,
                              background: pct > 70 ? "#22c55e" : pct > 40 ? "#eab308" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.cardBottom}>
                <span className={styles.cardTotal}>BST {totalStats}</span>
              </div>
            </div>

            {/* Back face */}
            <div className={styles.cardBack}>
              <div className={styles.backPattern}>
                <div className={styles.pokeballCenter}>
                  <div className={styles.pokeballTop} />
                  <div className={styles.pokeballLine} />
                  <div className={styles.pokeballBtn} />
                  <div className={styles.pokeballBottom} />
                </div>
                <div className={styles.backGrid} />
              </div>
              <div className={styles.backBorder} style={{ borderColor: `${primaryColor}30` }} />
            </div>

            {/* Card edge */}
            <div className={styles.cardEdge} style={{ background: `linear-gradient(180deg, ${primaryColor}30 0%, ${primaryColor}10 100%)` }} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
