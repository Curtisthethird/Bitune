export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 prose prose-invert">
            <h1 className="text-4xl font-black mb-10 text-accent underline decoration-white/10 underline-offset-8">Privacy Policy</h1>
            <p className="opacity-60 text-sm mb-12 italic">Last Updated: February 8, 2026</p>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">1. Information Collection</h2>
                <p className="opacity-60 leading-relaxed">
                    BitTune is designed as a privacy-first platform. We do not require usernames, passwords,
                    or email addresses. Your identity is tied to your Nostr Public Key.
                    We collect engagement data (playback position, time spent) solely to calculate
                    Proof of Engagement payouts.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">2. Wallet Authorization</h2>
                <p className="opacity-60 leading-relaxed">
                    When you connect a Lightning Wallet via NWC, your connection string is encrypted at rest
                    on our servers. We never have access to your private spend keys. Your authorization is used
                    strictly for the functions you approve (e.g., sending tips or receiving payouts).
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">3. Data Sharing</h2>
                <p className="opacity-60 leading-relaxed">
                    We do not sell your data to third parties. Public interactions (likes, comments, profile updates)
                    are broadcast to the Nostr network and are public by design.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">4. Cookies</h2>
                <p className="opacity-60 leading-relaxed">
                    We use local storage to maintain your current session and theme preferences.
                    No tracking cookies from advertisers are utilized.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">5. Contact</h2>
                <p className="opacity-60 leading-relaxed">
                    For privacy inquiries, please contact us via Nostr or our official social channels.
                </p>
            </section>
        </div>
    );
}
