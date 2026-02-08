export default function TOSPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 prose prose-invert">
            <h1 className="text-4xl font-black mb-10 text-accent underline decoration-white/10 underline-offset-8">Terms of Service</h1>
            <p className="opacity-60 text-sm mb-12 italic">Last Updated: February 8, 2026</p>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="opacity-60 leading-relaxed">
                    By accessing or using BitTune (the "Platform"), you agree to be bound by these Terms of Service.
                    BitTune is a decentralized music platform leveraging the Bitcoin Lightning Network and Nostr protocol.
                    If you do not agree to these terms, please do not use the Platform.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">2. Digital Assets & Lightning Payments</h2>
                <p className="opacity-60 leading-relaxed">
                    All financial transactions on BitTune are conducted via the Bitcoin Lightning Network.
                    BitTune does not custody your funds. Payments for tracks, tips, and payouts are peer-to-peer
                    or handled via your authorized non-custodial wallet (NWC). You are solely responsible
                    for the security of your private keys and wallet credentials.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">3. Content & Copyright</h2>
                <p className="opacity-60 leading-relaxed">
                    Artists represent and warrant that they own or have the necessary licenses for all content
                    uploaded to BitTune. We respect intellectual property rights and will terminate the accounts
                    of repeat infringers. Users can report content for copyright or community standard violations.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">4. Proof of Engagement</h2>
                <p className="opacity-60 leading-relaxed">
                    BitTune implements a Proof of Engagement (PoE) system. Compensation is calculated
                    deterministically based on verified engagement. Any attempt to manipulate these metrics
                    through bots or automated scripts is a violation of these terms and may result in a permanent ban
                    from the Treasury payout system.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">5. Disclaimer of Warranties</h2>
                <p className="opacity-60 leading-relaxed font-bold">
                    THE PLATFORM IS PROVIDED "AS IS". WE ARE NOT RESPONSIBLE FOR LOSS OF BITCOIN,
                    OR UNAUTHORIZED ACCESS TO YOUR NOSTR KEYS. USE AT YOUR OWN RISK.
                </p>
            </section>
        </div>
    );
}
