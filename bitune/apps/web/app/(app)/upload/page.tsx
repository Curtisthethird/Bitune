'use client';

import TrackUploadForm from '@/components/TrackUploadForm';

export default function UploadPage() {
    return (
        <div className="page-container">
            <TrackUploadForm title="Artist Studio" />

            <style jsx>{`
                .page-container {
                    max-width: 900px;
                    margin: 2rem auto;
                    padding: 0 2rem;
                }
            `}</style>
        </div>
    );
}
