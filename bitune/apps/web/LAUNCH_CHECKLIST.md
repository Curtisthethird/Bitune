# BitTune Launch Checklist

## 1. Environment Variables
Ensure these variables are set in your deployment environment (Vercel, Railway, etc.).

### Database (Critical)
- `DATABASE_URL`: Connection string for a **managed PostgreSQL database** (e.g., Supabase, Neon, Railway). Do not use localhost in production.

### Storage (Critical)
- `STORAGE_MODE`: Must be set to `"s3"`.
- `S3_ENDPOINT`: Your Cloudflare R2 or AWS S3 endpoint.
- `S3_REGION`: Storage region (e.g., `"auto"` for R2).
- `S3_BUCKET`: The name of your bucket.
- `S3_ACCESS_KEY_ID`: Your IAM access key.
- `S3_SECRET_ACCESS_KEY`: Your IAM secret key.
- `S3_PUBLIC_BASE_URL`: Public URL to access the bucket assets.

### Proof of Engagement (Optional Tuning)
- `POE_HEARTBEAT_SECONDS`: Default `5`
- `POE_ELIGIBLE_SECONDS`: Default `60` (Time before a stream counts)
- `POE_MIN_VOLUME`: Default `0.05`

### App Configuration
- `NEXT_PUBLIC_APP_URL`: The public URL of your deployed app (e.g., `https://bittune.com`).
- `NEXT_PUBLIC_DEFAULT_RELAYS`: Ensure these are highly available relays.

## 2. Infrastructure Setup
- [ ] **Error Monitoring**: Run `npm run sentry:init` (or similar) to configure Sentry for crash tracking.
- [ ] **Database Migration**: Run `npx prisma migrate deploy` against your production database.

## 3. Deployment Steps
1.  **Build**: Run `npm run build` locally to ensure no type errors.
2.  **Deploy**: Push to the main branch connected to your hosting provider.

## 3. Post-Launch Verification
- [ ] **Log in** with a fresh Guest Account.
- [ ] **Backup** your Guest Key (verify the warning appears).
- [ ] **Edit Profile** (Name/Avatar) and refresh to verify persistence.
- [ ] **Connect Wallet** (using Alby or a test NWC string) to verify encryption.
