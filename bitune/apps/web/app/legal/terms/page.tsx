export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 text-gray-300">
            <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>By accessing BitTune, you agree to be bound by these Terms of Service. Authentication relies on Nostr (NIP-98). You are responsible for safeguarding your private keys.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">2. User Content</h2>
                <p>You retain ownership of any music you upload. By uploading, you grant BitTune a license to stream and distribute your content on the platform. You must own the rights to any content you upload.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">3. Prohibited Content</h2>
                <p>We do not tolerate illegal content, hate speech, or copyright infringement. We reserve the right to remove content and ban pubkeys that violate these rules.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">4. Payments</h2>
                <p>BitTune uses the Lightning Network for peer-to-peer value transfer. We do not act as a custodian for your funds. All transactions are final.</p>
            </section>
        </div>
    );
}
