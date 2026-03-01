import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="upload-wrap">
      <article className="upload-card">
        <p className="eyebrow">404</p>
        <h2>Page not found</h2>
        <p className="muted">The route does not exist in this frontend.</p>
        <Link className="btn primary" to="/">
          Go Home
        </Link>
      </article>
    </section>
  );
}
