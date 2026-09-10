import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvolutionChain } from "@/data/evolutionChains";
import { getNameToIdMap } from "@/data";
import { spriteUrl } from "@/utils/pokemon";
import { ChevronRightIcon } from "@/components/Icons";
import styles from "./EvolutionChain.module.css";

interface Props {
  pokemonName: string;
}

export default function EvolutionChain({ pokemonName }: Props) {
  const chain = getEvolutionChain(pokemonName);
  const [nameMap, setNameMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    getNameToIdMap()
      .then((map) => {
        if (!cancelled) setNameMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!chain || chain.length <= 1) return null;

  const hasData = Object.keys(nameMap).length > 0;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Evolution Chain</h2>
      <div className={styles.chain}>
        {chain.map((name, i) => (
          <div key={name} className={styles.stage}>
            {i > 0 && (
              <span className={styles.arrow} aria-hidden="true">
                <ChevronRightIcon size={18} />
              </span>
            )}
            <Link
              to={`/pokemon/${name}`}
              className={`${styles.node} ${name === pokemonName.toLowerCase() ? styles.current : ""}`}
            >
              {hasData && nameMap[name] ? (
                <img
                  src={spriteUrl(nameMap[name])}
                  alt={name}
                  className={styles.sprite}
                  loading="lazy"
                />
              ) : (
                <div className={styles.spritePlaceholder} />
              )}
              <span className={styles.name}>{name}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
