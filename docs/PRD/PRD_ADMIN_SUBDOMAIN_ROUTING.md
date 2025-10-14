# PRD: Admin Subdomain Routing

## 1. Context

Currently, the admin interface is accessible via the `/admin` path on the main domain. However, the architecture should support subdomain-based routing where:
- Regular users access the app at `app.domain`
- Admin users are redirected to `gestion.domain`

This provides better separation of concerns, improved security, and clearer user experience.

**Business Value:**
- Clearer separation between user and admin interfaces
- Enhanced security through domain isolation
- Better branding and user experience
- Easier to manage CORS and session policies per domain

## 2. Goals (Success Criteria)

- [x] After successful authentication, users are redirected based on their role:
  - Regular user → `https://app.domain` (or configured `NEXT_PUBLIC_APP_URL`)
  - Admin user → `https://gestion.domain` (or configured `NEXT_PUBLIC_ADMIN_URL`)
- [x] Middleware automatically redirects admins trying to access `app.domain` to `gestion.domain`
- [x] Regular users trying to access `gestion.domain` are redirected to `app.domain`
- [x] Authentication state persists across subdomains (shared cookies)
- [x] Environment variables properly configured for both domains
- [x] Performance acceptable (<100ms redirect time)

## 3. Scope

### Frontend
- **Components to modify:**
  - `app/auth/signin/page.tsx` - Add post-login redirect logic based on role
  - `app/auth/callback/page.tsx` - Handle OAuth callback with role-based redirect
  - `middleware.ts` - Add subdomain detection and role-based routing

- **UI States:**
  - Loading: Show spinner during redirect
  - Error: Show error message if redirect fails
  - Success: Seamless redirect to appropriate domain

- **User Flows:**
  1. User logs in → Check role → Redirect to `app.domain` or `gestion.domain`
  2. Admin accesses `app.domain/admin` → Redirect to `gestion.domain/admin`
  3. Regular user accesses `gestion.domain` → Redirect to `app.domain/dashboard`

### Backend
- **Middleware Logic (`middleware.ts`):**
  - Detect current hostname (subdomain)
  - Get user role from session
  - Redirect if role doesn't match subdomain:
    - Admin on `app.domain` → redirect to `gestion.domain`
    - Regular user on `gestion.domain` → redirect to `app.domain`

- **Auth Callback (`app/auth/callback/route.ts`):**
  - After Supabase auth, check user role
  - Redirect to appropriate subdomain

- **Business Rules:**
  - Admin role takes precedence (if user has admin + user roles)
  - Session cookies must be shared across subdomains (`.domain` cookie domain)
  - Redirects should preserve the current path when possible

### Environment Variables
\`\`\`bash
# Required new variables
NEXT_PUBLIC_APP_URL=https://app.ninowash.com         # User-facing app
NEXT_PUBLIC_ADMIN_URL=https://gestion.ninowash.com   # Admin dashboard

# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000  # Same domain in dev
\`\`\`

### Security
- **Cookie Configuration:**
  - Set `domain` to `.domain.com` to share cookies across subdomains
  - Maintain `httpOnly`, `secure`, `sameSite` flags
  - Ensure session cookies work across both domains

- **CORS:**
  - Update `lib/config/cors.ts` to allow both `app.domain` and `gestion.domain`
  - Add subdomain origins to allowed origins list

- **RLS Policies:**
  - No changes needed (role-based access already enforced at DB level)

### DevOps
- **Vercel Configuration:**
  - Add both subdomains to Vercel project domains
  - Configure DNS records for `app.domain` and `gestion.domain`
  - Set environment variables in Vercel dashboard

- **Local Development:**
  - Use `localhost:3000` for both (no subdomain in dev)
  - Or configure `/etc/hosts` for local subdomain testing:
    \`\`\`
    127.0.0.1 app.localhost
    127.0.0.1 gestion.localhost
    \`\`\`

## 4. Technical Implementation Plan

### Step 1: Environment Variables
- [x] Add `NEXT_PUBLIC_APP_URL` to `.env.example` and `.env.local`
- [x] Add `NEXT_PUBLIC_ADMIN_URL` to `.env.example` and `.env.local`
- [x] Document in `docs/QUICK_START.md`

### Step 2: Middleware Subdomain Routing
- [x] Modify `middleware.ts`:
  \`\`\`typescript
  // Extract hostname and determine subdomain
  const hostname = request.headers.get("host") || ""
  const isAdminSubdomain = hostname.startsWith("gestion.") || hostname.includes("admin.")
  const isAppSubdomain = hostname.startsWith("app.")
  
  // If user is admin and not on admin subdomain, redirect
  if (isAdmin && !isAdminSubdomain && process.env.NEXT_PUBLIC_ADMIN_URL) {
    const adminUrl = new URL(process.env.NEXT_PUBLIC_ADMIN_URL)
    adminUrl.pathname = pathname
    return NextResponse.redirect(adminUrl)
  }
  
  // If user is not admin and on admin subdomain, redirect
  if (!isAdmin && isAdminSubdomain && process.env.NEXT_PUBLIC_APP_URL) {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
    appUrl.pathname = "/dashboard"
    return NextResponse.redirect(appUrl)
  }
  \`\`\`

### Step 3: Auth Callback Redirect
- [x] Update `app/auth/callback/route.ts`:
  \`\`\`typescript
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin"
  
  const redirectUrl = isAdmin 
    ? process.env.NEXT_PUBLIC_ADMIN_URL || "/admin"
    : process.env.NEXT_PUBLIC_APP_URL || "/dashboard"
  
  return NextResponse.redirect(new URL(redirectUrl))
  \`\`\`

### Step 4: Cookie Configuration
- [x] Update Supabase client cookie options:
  \`\`\`typescript
  cookies: {
    domain: process.env.NODE_ENV === "production" 
      ? ".ninowash.com"  // Shared across subdomains
      : "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }
  \`\`\`

### Step 5: CORS Configuration
- [x] Update `lib/config/cors.ts`:
  \`\`\`typescript
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    "http://localhost:3000",
    "http://localhost:3001"
  ].filter(Boolean)
  \`\`\`

### Step 6: Testing
- [x] Test local development (same domain)
- [x] Test production with actual subdomains
- [x] Test cookie sharing across subdomains
- [x] Test auth flow for both user and admin
- [x] Test direct URL access (should redirect appropriately)

### Step 7: Documentation
- [x] Update `.github/copilot-instructions.md` ✅ (DONE)
- [x] Update `docs/QUICK_START.md` with subdomain setup
- [x] Update `docs/architecture.md` with subdomain routing pattern
- [x] Update `DEPLOYMENT.md` with DNS configuration

## 5. Data Flow

\`\`\`
User Login
  ↓
Auth Callback (/auth/callback)
  ↓
Check user role (user_metadata.role or app_metadata.role)
  ↓
Is Admin?
  ├─ Yes → Redirect to NEXT_PUBLIC_ADMIN_URL (gestion.domain)
  └─ No → Redirect to NEXT_PUBLIC_APP_URL (app.domain)

Subsequent Requests
  ↓
Middleware checks:
  ├─ Admin on app.domain? → Redirect to gestion.domain
  ├─ User on gestion.domain? → Redirect to app.domain
  └─ Match? → Allow through
\`\`\`

## 6. Error Scenarios

- **Missing environment variables**: Fall back to path-based routing (`/admin`, `/dashboard`)
- **Cookie not shared**: Session lost on redirect → User must re-login
  - Solution: Ensure `domain` cookie option is set correctly
- **DNS not configured**: 404 on subdomain → Show error page with setup instructions
- **CORS blocked**: API calls fail → Add subdomain to allowed origins
- **Infinite redirect loop**: User role doesn't match subdomain logic → Add circuit breaker (max 1 redirect)

## 7. Edge Cases

- **Multi-role users**: Admin role takes precedence
- **Local development**: Both subdomains point to `localhost:3000` (no actual subdomain)
- **Preview deployments**: Vercel preview URLs → disable subdomain routing, use path-based
- **First-time user**: No role set → default to regular user, redirect to `app.domain`
- **OAuth providers**: Callback URL must support both subdomains in Supabase dashboard

## 8. Testing Strategy

### Unit Tests
- Test subdomain detection logic
- Test role-based redirect logic
- Test cookie domain configuration

### Integration Tests
- Test auth flow end-to-end (signin → callback → redirect)
- Test middleware redirect for both admin and regular users
- Test session persistence across subdomains

### Manual Testing
- Login as admin → should land on `gestion.domain`
- Login as user → should land on `app.domain`
- Admin accesses `app.domain/admin` → redirects to `gestion.domain/admin`
- User accesses `gestion.domain` → redirects to `app.domain/dashboard`
- Logout and login again → cookies still work

## 9. Rollout Plan

### Phase 1: Development (Local Testing)
- Implement middleware logic
- Test with `localhost` (no real subdomain)
- Verify redirect logic works

### Phase 2: Staging (Vercel Preview)
- Configure preview subdomain in Vercel
- Test with actual subdomains
- Verify cookie sharing

### Phase 3: Production
- Configure DNS (`app.ninowash.com`, `gestion.ninowash.com`)
- Deploy to Vercel with env vars
- Monitor for redirect loops or auth issues
- Rollback plan: Remove subdomain logic, fall back to path-based routing

### Monitoring
- Log all subdomain redirects in middleware (with `[v0]` prefix)
- Track auth callback failures (Vercel Analytics)
- Monitor 404s on subdomains (DNS misconfiguration)

## 10. Out of Scope (Explicitly)

- ❌ Custom domains per organization (multi-tenant subdomains)
- ❌ Dynamic subdomain routing based on organization slug
- ❌ Subdomain-based feature flags
- ❌ Email service integration (not yet implemented)
- ❌ Mobile app deep linking to subdomains
- ❌ SEO optimization for subdomain content

## 11. References

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Cookie Configuration](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- Existing files:
  - `middleware.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/client.ts`
  - `lib/config/cors.ts`
