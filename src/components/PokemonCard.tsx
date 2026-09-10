import { useState } from "react";
import { Link } from "react-router-dom";
import { spriteUrl } from "@/utils/pokemon";
import { preloadImage } from "@/utils/imageCache";
import { useTilt3D } from "@/hooks/useTilt3D";
import FavoritesButton from "@/components/FavoritesButton";
import styles from "./PokemonCard.module.css";

interface PokemonCardProps {
  name: string;
  id: number | string;
}

export default function PokemonCard({ name, id }: PokemonCardProps) {
  const [imgError, setImgError] = useState(false);
  const { ref, handleMouseMove, handleMouseLeave, tiltStyle } = useTilt3D({
    maxTilt: 12,
    scale: 1.05,
    speed: 300,
  });

  const numId = typeof id === "string" ? parseInt(id, 10) : id;

  const handleHover = () => {
    preloadImage(spriteUrl(id)).catch(() => {});
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.favWrap}>
        <FavoritesButton pokemonId={numId} size="sm" />
      </div>
      <Link
        to={`/pokemon/${name}`}
        className={styles.card}
        aria-label={`View details for ${name}`}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleHover}
        style={tiltStyle}
      >
        <div className={styles.imageWrapper}>
          {imgError ? (
            <span className={styles.fallback} aria-hidden="true">
              ?
            </span>
          ) : (
            <img
              src={spriteUrl(id)}
              alt={`Official artwork of ${name}`}
              className={styles.image}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <span className={styles.id}>#{String(id).padStart(3, "0")}</span>
        <span className={styles.name}>{name}</span>
      </Link>
    </div>
  );
}
