export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 text-gray-300">
            <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">1. Data Collection</h2>
                <p>We collect minimal data necessary to function. This includes your Nostr Public Key, IP address (for security logs), and any profile information you publicize (Name, Bio, Avatar).</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">2. Cookies & Local Storage</h2>
                <p>We do not use tracking cookies. We may use Local Storage to persist your listening preferences or session state locally on your device.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">3. Third Parties</h2>
                <p>We do not sell your data. If you use S3 storage or Lightning, data may pass through those service providers as part of the technical infrastructure.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">4. Contact</h2>
                <p>For privacy concerns, please open an issue on our repository.</p>
            </section>
        </div>
    );
}
