import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPokemon } from "@/data";

let _allNames: string[] | null = null;

async function getNames(): Promise<string[]> {
  if (!_allNames) {
    const data = await getAllPokemon();
    _allNames = data.map((p) => p.name);
  }
  return _allNames;
}

export function useKeyboardNav(currentName: string | undefined) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentName) return;

    let stale = false;

    const handler = async (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Don't handle if a dialog (3D viewer) is open
      if ((e.target as HTMLElement)?.closest("[role='dialog']")) return;

      const names = await getNames();
      if (stale) return;

      const idx = names.indexOf(currentName);
      if (idx === -1) return;

      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        navigate(`/pokemon/${names[idx - 1]}`, { replace: true });
      } else if (e.key === "ArrowRight" && idx < names.length - 1) {
        e.preventDefault();
        navigate(`/pokemon/${names[idx + 1]}`, { replace: true });
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      stale = true;
      window.removeEventListener("keydown", handler);
    };
  }, [currentName, navigate]);
}
