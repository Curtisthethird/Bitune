# BitTune Launch Checklist

## 1. Environment Variables
Ensure these variables are set in your deployment environment (Vercel, Railway, etc.).

### Database
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., Supabase, Neon).

### Proof of Engagement (Optional Tuning)
- `POE_HEARTBEAT_SECONDS`: Default `5`
- `POE_ELIGIBLE_SECONDS`: Default `60` (Time before a stream counts)
- `POE_MIN_VOLUME`: Default `0.05`

### App Configuration
- `NEXT_PUBLIC_APP_URL`: The public URL of your deployed app (e.g., `https://bittune.com`).

## 2. Deployment Steps
1.  **Build**: Run `npm run build` locally to ensure no type errors.
2.  **Migrate**: Run `npx prisma migrate deploy` against your production database.
3.  **Deploy**: Push to main branch.

## 3. Post-Launch Verification
- [ ] **Log in** with a fresh Guest Account.
- [ ] **Backup** your Guest Key (verify the warning appears).
- [ ] **Edit Profile** (Name/Avatar) and refresh to verify persistence.
- [ ] **Connect Wallet** (using Alby or a test NWC string) to verify encryption.
