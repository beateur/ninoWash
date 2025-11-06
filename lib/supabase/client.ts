import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ PKCE flow requis pour Safari iOS (résout problème reset password)
        flowType: 'pkce',
        
        // ✅ Détection automatique de session dans URL
        detectSessionInUrl: true,
        
        // ✅ Persistance session
        persistSession: true,
        
        // ✅ Auto-refresh des tokens
        autoRefreshToken: true,
        
        // ✅ Stockage dans localStorage
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      
      // ✅ Configuration cookies optimisée pour Safari iOS
      cookieOptions: {
        name: 'sb-auth-token',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_DOMAIN 
          : undefined,
        path: '/',
        sameSite: 'lax', // IMPORTANT pour Safari iOS
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}
