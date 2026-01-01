import Link from 'next/link';
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Stream Music. <br />
            <span className={styles.gradientText}>Earn Bitcoin.</span>
          </h1>
          <p className={styles.subtitle}>
            The first decentralized music streaming platform powered by Nostr and the Lightning Network.
            Direct artist support, provable engagement, and zero intermediaries.
          </p>

          <div className={styles.ctas}>
            <Link href="/feed" className={styles.primaryButton}>
              Start Listening
            </Link>
            <Link href="/wallet" className={styles.secondaryButton}>
              Connect Wallet
            </Link>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it Works</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <span className={styles.cardIcon}>⚡</span>
              <h3 className={styles.cardTitle}>1. Connect</h3>
              <p className={styles.cardText}>
                No email or password needed. Just sign in with your Nostr key or a Lightning wallet.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🎧</span>
              <h3 className={styles.cardTitle}>2. Stream</h3>
              <p className={styles.cardText}>
                Discover new music from independent artists. Listen freely without ads interrupting the flow.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>💸</span>
              <h3 className={styles.cardTitle}>3. Support</h3>
              <p className={styles.cardText}>
                Your listening time automatically streams bitcoin micropayments directly to the artist.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.artistSection}`}>
          <div className={styles.artistContent}>
            <h2 className={styles.sectionTitle}>For Artists</h2>
            <p className={styles.subtitle}>
              Keep 100% of your rights. Get paid instantly per second. No distributors, no delays.
            </p>
            <Link href="/upload" className={styles.primaryButton}>
              Upload Music
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
