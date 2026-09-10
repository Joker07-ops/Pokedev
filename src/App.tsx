import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import PokemonDetail from "@/pages/PokemonDetail";
import Compare from "@/pages/Compare";
import NotFound from "@/components/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeToggle from "@/components/ThemeToggle";
import { BoltIcon } from "@/components/Icons";
import { FavoritesContext } from "@/context/FavoritesContext";
import { ThemeContext } from "@/context/ThemeContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useTheme } from "@/hooks/useTheme";
import styles from "./App.module.css";

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/pokemon/:name" element={<PokemonDetail />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppShell() {
  const fav = useFavorites();
  const themeCtx = useTheme();

  return (
    <FavoritesContext.Provider value={fav}>
      <ThemeContext.Provider value={themeCtx}>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <header className={styles.header}>
          <Link to="/" className={styles.brand} aria-label="Pokedex home">
            <span className={styles.brandIcon} aria-hidden="true">
              <BoltIcon size={22} />
            </span>
            <span className={styles.brandText}>Pokedex</span>
          </Link>
          <div className={styles.headerRight}>
            <ThemeToggle />
          </div>
        </header>

        <main id="main-content" className={styles.main}>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </main>
      </ThemeContext.Provider>
    </FavoritesContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
