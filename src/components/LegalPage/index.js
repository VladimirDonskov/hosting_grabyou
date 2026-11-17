import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import consent from '@site/src/data/partner-consent.json';
import styles from './styles.module.css';

const revisionDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${consent.version}T00:00:00Z`));

export default function LegalPage({title, description, relatedTo, relatedLabel, children}) {
  return (
    <Layout title={title} description={description}>
      <main className={styles.page}>
        <div className={`container ${styles.container}`}>
          <Link className={styles.back} to="/partners">← К заявке партнёра</Link>
          <article className={styles.document}>
            <header className={styles.header}>
              <h1>{title}</h1>
              <p className={styles.version}>Редакция <time dateTime={consent.version}>{revisionDate}</time></p>
            </header>
            <div className={styles.content}>{children}</div>
          </article>
          <nav className={styles.related} aria-label="Документы о персональных данных">
            <Link to={relatedTo}>{relatedLabel}</Link>
            <Link to="/partners">Вернуться к партнёрству</Link>
          </nav>
        </div>
      </main>
    </Layout>
  );
}
