# Chunk 24 — Partner / Venue / Planner Signups

## Status: ✅ Complete

## What was built

### Backend

**`app/Http/Controllers/PartnerSignupController.php`**
- `POST /api/partner/register` — public, no auth required
- `type` param: `'agent'` → `access_level 7`, `'planner'` → `access_level 8`
- Validates: first/last name, email (unique), phone, optional company_name, website (url), license_number (agents), venue_capacity (planners), how_did_you_hear, password (confirmed, min 8), agree_to_terms (accepted)
- Generates unique 8-char uppercase `referral_string` with collision loop
- Returns Sanctum token + user object with role

**`routes/api.php`**
- `Route::post('/partner/register', [PartnerSignupController::class, 'register'])` added under Partner/Venue/Planner Signup comment

### Frontend

**`src/pages/partner/PartnerSignupPage.tsx`**

**TypeCard selector** — always visible at top, allows switching between agent/planner at any step
- Agent card: briefcase icon, description of who it's for
- Planner card: calendar icon, description of who it's for
- `?type=agent|planner` query param for deep-link pre-selection

**3-step form** (same pattern as AffiliateSignupPage):
- Step 1: first name, last name, email, phone
- Step 2: company name, website + **conditional field** — `license_number` for agents, `venue_capacity` (integer) for planners; how_did_you_hear
- Step 3: password, confirm password, agree_to_terms checkbox
- Separate `useForm` + zod schema per step to avoid cross-step validation

**Submission**: `POST /api/partner/register` with all accumulated data; on 422 email error → `form1.setError('email', ...)` + `setStep(1)`; on success → `login()` store call + navigate to `/`

**`StepsIndicator`** component (inline) with checkmarks for completed steps

**`src/routes/index.tsx`**
- `PartnerSignupPage` lazy import added
- `<Route path="/partner-signup" element={<PartnerSignupPage />} />` added (public, no auth required)

## Role mapping
| type    | access_level | Description                               |
|---------|-------------|-------------------------------------------|
| agent   | 7           | Insurance agents / event industry partners |
| planner | 8           | Event planners / venue coordinators        |

## Notes
- Partners don't have a dedicated portal yet — successful signup redirects to `/`
- Footer links to `/login` and `/affiliate-signup`
- `referral_string` generated at signup for future referral tracking (same mechanism as affiliates)
- Portal for partners (access_level 7/8) can be added in a future chunk
