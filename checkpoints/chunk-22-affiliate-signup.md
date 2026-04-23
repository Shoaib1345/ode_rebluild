# Chunk 22 — Affiliate Signup

## Status: ✅ Complete

## What was built

### Backend — `app/Http/Controllers/AffiliateController.php`

**`POST /api/affiliate/register`** — public, no auth

Validated fields:
- `first_name`, `last_name`, `email` (unique), `phone`, `password` (confirmed, min 8)
- `company_name`, `website`, `how_did_you_hear` — optional, not stored on User (collected but not persisted in this chunk; can be stored in a future `affiliate_profiles` table)
- `agree_to_terms` — must be accepted

Behaviour:
- Looks up `UserRole` where `access_level = 6`
- Generates unique 8-char uppercase `referral_string` (collision loop)
- Creates `User` with `role_id`, `referral_string`, `status=1`, `w9_status=false`
- Issues Sanctum token
- Returns `{ user, token }` 201

### Frontend — `src/pages/affiliate/AffiliateSignupPage.tsx`

3-step form (state-machine with `useState<1|2|3>`):

**Step 1 — Your info**: first name, last name, email, phone  
**Step 2 — About you**: company name, website, how did you hear (all optional, stored in local state for submission)  
**Step 3 — Password**: password, confirm password, agree to terms checkbox

- Each step has its own `useForm` + zod schema — only validates the current step's fields
- Back buttons restore previous step (form defaults pre-filled from saved state)
- On 422 email-unique error: auto-navigates back to Step 1 with error set on email field
- On success: `setAuth(user, token)` → toast → navigate to `/affiliate` (Chunk 23 portal)
- `StepsIndicator` component: numbered circles with checkmarks for completed steps, connector lines

### `routes/index.tsx`
- Route: `<Route path="/affiliate-signup" element={<AffiliateSignupPage />} />`
- Public (no `ProtectedRoute`)
- Note: legacy route was `/affliate-signup/:step?` (typo in original) — corrected to `/affiliate-signup`

## Notes
- `company_name`, `website`, `how_did_you_hear` are collected in the form but not currently stored (no `affiliate_profiles` table yet). They can be POSTed to the backend once a profile table is added.
- Affiliate portal at `/affiliate` will be built in Chunk 23
