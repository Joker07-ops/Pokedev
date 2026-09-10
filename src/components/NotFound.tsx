import { Link } from "react-router-dom";
import { SearchIcon } from "@/components/Icons";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <section className={styles.container} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <SearchIcon size={48} />
      </span>
      <h1 className={styles.title}>404</h1>
      <p className={styles.message}>The page you are looking for does not exist.</p>
      <Link to="/" className={styles.link}>
        Back to Catalog
      </Link>
    </section>
  );
}
