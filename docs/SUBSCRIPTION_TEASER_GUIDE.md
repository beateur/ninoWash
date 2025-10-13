# Subscription Teaser Feature Flag

## Overview

This system allows launching the app with **subscriptions as teasers** (locked/blurred) while keeping the Classic service fully functional. Subscriptions can be activated later via a simple environment variable change.

---

## Quick Start

### MVP Launch (Subscriptions Locked)

```bash
# .env.local or .env.production
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false
```

**Result**:
- ✅ Classic service: Fully functional (CTA clickable, booking works)
- 🔒 Subscription cards: Teaser mode (blur overlay, CTA disabled, no href)
- 🔒 Direct URL access blocked (middleware redirects to `/pricing?locked=1`)

### Production Activation (Subscriptions Live)

```bash
# .env.local or .env.production
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true
```

**Result**:
- ✅ All services fully functional
- ✅ Subscription CTAs become clickable Links
- ✅ Blur overlays removed automatically
- ✅ URL access enabled

**Deploy**: Push to Vercel/Netlify → automatic rebuild with new flag

---

## Implementation Details

### Files Modified

1. **`lib/flags.ts`** - Feature flag definition
   ```typescript
   export const SUBSCRIPTIONS_ENABLED: boolean =
     process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "true"
   ```

2. **`env.d.ts`** - TypeScript environment types
   ```typescript
   NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED?: "true" | "false"
   ```

3. **`components/sections/services-section.tsx`** - UI with teaser logic
   - Imports `SUBSCRIPTIONS_ENABLED` flag
   - Conditional rendering: `Link` (active) vs `Button` (disabled)
   - Blur overlay on features when locked
   - "Bientôt disponible" badge

4. **`app/reservation/page.tsx`** - Server-side guard
   ```typescript
   if (isSubscription && !SUBSCRIPTIONS_ENABLED) {
     redirect("/pricing?locked=1")
   }
   ```

5. **`middleware.ts`** - URL protection
   - Checks query param `?service=monthly|quarterly`
   - Redirects to `/pricing?locked=1` if flag OFF

---

## Architecture

### Frontend Layer (Public)

**Teaser UI** (`services-section.tsx`):
- Detects subscription services: `isSubscription = service.id !== "classic"`
- Checks lock state: `isLocked = isSubscription && !SUBSCRIPTIONS_ENABLED`
- Renders conditionally:
  ```tsx
  {isLocked ? (
    <Button disabled aria-disabled onClick={preventDefault}>S'abonner</Button>
  ) : (
    <Link href={`/reservation?service=${service.id}`}>...</Link>
  )}
  ```

**Blur Overlay**:
```tsx
<div className="absolute inset-0 rounded-xl backdrop-blur-[2px] bg-background/40">
  <p>Bientôt disponible</p>
</div>
```

### Server Layer (Protected)

**Page Guard** (`app/reservation/page.tsx`):
- Runs server-side (no client bypass possible)
- Blocks rendering if subscription + flag OFF
- Redirects to `/pricing?locked=1`

**Middleware** (`middleware.ts`):
- Intercepts ALL requests before page load
- Checks `?service=` query param
- Redirects subscription URLs if flag OFF
- **Security**: Even direct URL access blocked

---

## User Flows

### Flow 1: Click Disabled CTA (Flag OFF)
```
User → Clicks "S'abonner" on Monthly card
       ↓
       Button onClick → preventDefault()
       ↓
       Nothing happens (cursor: not-allowed)
```

### Flow 2: Direct URL Access (Flag OFF)
```
User → Types /reservation?service=monthly
       ↓
       Middleware intercepts request
       ↓
       Checks: isSubscription && !SUBSCRIPTIONS_ENABLED
       ↓
       Redirects to /pricing?locked=1
```

### Flow 3: Classic Service (Always Works)
```
User → Clicks "Réserver" on Classic card
       ↓
       <Link> navigates to /reservation?service=classic
       ↓
       Page loads normally (no flag check for classic)
```

### Flow 4: Admin Activates Flag (Flag ON)
```
Admin → Sets NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true
        ↓
        Deploys to production
        ↓
        Next.js rebuilds with new env var
        ↓
        All teaser logic bypassed:
        - isLocked = false (subscriptions enabled)
        - Links rendered instead of disabled buttons
        - Blur overlays not rendered
        - Middleware allows subscription URLs
```

---

## Security

### Defense Layers

1. **Frontend (UI)**: Disabled button with no href (user-friendly)
2. **Middleware**: Blocks URL navigation (first server-side check)
3. **Page Guard**: Refuses page rendering (second server-side check)
4. **API Routes**: Existing validation (already checks service validity)

**Bypass Protection**:
- ❌ Client-side JS manipulation: Middleware blocks URL
- ❌ Direct API calls: Existing API guards
- ❌ Disabled JS: Button remains disabled (SSR)
- ❌ Curl/Postman: API routes validate service

---

## Code Cleanup (Optional)

When subscriptions go live permanently, you can remove teaser code:

### Step 1: Find Teaser Blocks
Search for comment: `// TEASER LAYER`

### Step 2: Simplify Component
**Before** (with teaser):
```tsx
{isLocked ? (
  <Button disabled>S'abonner</Button>
) : (
  <Link href={...}>S'abonner</Link>
)}
```

**After** (cleanup):
```tsx
<Button asChild>
  <Link href={...}>
    {service.id === "classic" ? "Réserver" : "S'abonner"}
  </Link>
</Button>
```

### Step 3: Remove Guards (Optional)
- Keep middleware guard if you want permanent fallback
- Remove page guard if subscriptions always enabled

---

## Testing Checklist

### Manual Testing

**Flag OFF** (`SUBSCRIPTIONS_ENABLED=false`):
- [ ] Classic card: CTA clickable, navigation works
- [ ] Monthly card: CTA disabled, no hover effect, blur visible
- [ ] Quarterly card: CTA disabled, no hover effect, blur visible
- [ ] Direct URL `/reservation?service=monthly` → Redirects to `/pricing?locked=1`
- [ ] Direct URL `/reservation?service=classic` → Works normally
- [ ] Badge "Bientôt" visible on subscription cards
- [ ] Badge "Plus populaire" still visible on Monthly

**Flag ON** (`SUBSCRIPTIONS_ENABLED=true`):
- [ ] All CTAs clickable (Classic + Subscriptions)
- [ ] No blur overlays visible
- [ ] No "Bientôt" badges
- [ ] Navigation works for all services
- [ ] Direct URL `/reservation?service=monthly` → Page loads normally

### Accessibility Testing

- [ ] Disabled buttons have `aria-disabled="true"`
- [ ] Disabled buttons have `tabIndex={-1}` (not focusable)
- [ ] Overlay has `aria-label="Bientôt disponible"`
- [ ] Screen reader announces "Bientôt disponible" on focus
- [ ] Keyboard navigation: Tab skips disabled buttons

### TypeScript Validation

```bash
pnpm tsc --noEmit
# Expected: 0 errors
```

### Bundle Size

```bash
pnpm build:analyze
# Expected: <2KB increase (Lock icon + flag check logic)
```

---

## Troubleshooting

### Issue: Subscriptions still locked after setting flag to `true`

**Solution**:
1. Verify `.env.local` or `.env.production` has exact syntax:
   ```bash
   NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true
   ```
   (no quotes, no spaces)

2. Restart dev server:
   ```bash
   pnpm dev
   ```

3. Check browser console for flag value:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED)
   // Should output: "true"
   ```

4. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Issue: Direct URL still accessible (middleware not blocking)

**Solution**:
1. Verify middleware.ts updated with flag check
2. Check middleware logs in terminal:
   ```
   [v0] Middleware - subscription access blocked (flag OFF): monthly
   ```
3. Ensure `matcher` config includes `/reservation` path

### Issue: TypeScript error on env var

**Solution**:
1. Verify `env.d.ts` exists at project root
2. Restart TypeScript server in VSCode: `Cmd+Shift+P` → "Restart TS Server"
3. Check `tsconfig.json` includes `env.d.ts`:
   ```json
   {
     "include": ["env.d.ts", "**/*.ts", "**/*.tsx"]
   }
   ```

---

## Deployment

### Vercel

1. Go to Project Settings → Environment Variables
2. Add variable:
   - Key: `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED`
   - Value: `false` (MVP) or `true` (Production)
3. Redeploy (automatic trigger or manual)

### Netlify

1. Site Configuration → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false
   ```
3. Trigger deploy

### Docker

```dockerfile
# Dockerfile
ENV NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false
```

---

## Monitoring

### Analytics Events (Optional)

Track teaser interactions:

```typescript
// In services-section.tsx disabled button onClick
onClick={(e) => {
  e.preventDefault()
  // Track analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'subscription_teaser_click', {
      service_id: service.id,
      service_name: service.name
    })
  }
}}
```

### Metrics to Watch

- **Teaser clicks**: How many users try to click disabled CTAs
- **Pricing page visits** (`?locked=1`): Users redirected from blocked URLs
- **Conversion rate** after activation: Compare before/after flag ON

---

## FAQ

**Q: Can users bypass the lock with browser DevTools?**
A: Frontend can be modified, but middleware + page guards block actual navigation server-side.

**Q: Will SEO be affected by locked subscriptions?**
A: No. Features remain in DOM (under blur), so Google indexes full content. CTAs marked `aria-disabled` won't harm rankings.

**Q: Can I test both states locally?**
A: Yes. Change `.env.local` and restart dev server:
```bash
# Test locked state
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false pnpm dev

# Test active state
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true pnpm dev
```

**Q: Is the Classic service affected by the flag?**
A: No. Classic is explicitly excluded from all flag checks (`service.id !== "classic"`).

**Q: Can I remove teaser code after activation?**
A: Yes, but not required. Keeping it allows reverting to teaser mode if needed (emergency disable). Removal is optional cleanup.

---

## Support

For issues or questions:
- Check console logs for `[v0]` prefixed messages
- Verify environment variable spelling (exact match required)
- Test with `pnpm tsc --noEmit` for type errors
- Review PRD: `docs/PRD/PRD_SUBSCRIPTION_TEASER_MVP.md`
