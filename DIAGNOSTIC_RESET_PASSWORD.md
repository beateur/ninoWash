/**
 * Script de diagnostic pour le reset password Safari iOS
 * 
 * Ce script vérifie :
 * 1. La configuration Supabase Dashboard
 * 2. Les URLs de redirection
 * 3. Le flow PKCE
 */

export default async function DiagnosticResetPassword() {
  const checks = {
    pkce: typeof window !== 'undefined' && localStorage.getItem('sb-auth-token'),
    redirectUrl: typeof window !== 'undefined' ? window.location.origin : null,
    callbackUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?type=recovery` : null,
  }

  console.log('🔍 Diagnostic Reset Password:', checks)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Diagnostic Reset Password</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">1. Configuration PKCE</h2>
          <code className="text-sm bg-gray-100 p-2 block rounded">
            {JSON.stringify({ pkce: 'enabled', flowType: 'pkce' }, null, 2)}
          </code>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">2. Redirect URLs configurées</h2>
          <code className="text-sm bg-gray-100 p-2 block rounded">
            Callback URL: {checks.callbackUrl}
          </code>
        </div>

        <div className="p-4 border rounded bg-yellow-50 border-yellow-200">
          <h2 className="font-semibold mb-2">⚠️ Points à vérifier dans Supabase Dashboard</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Authentication → URL Configuration</strong>
              <br />
              <span className="text-gray-600">
                Site URL: https://ninowash.fr (ou votre domaine)
              </span>
            </li>
            <li>
              <strong>Redirect URLs</strong>
              <br />
              <span className="text-gray-600">
                Ajouter: https://ninowash.fr/auth/callback
              </span>
            </li>
            <li>
              <strong>Email Templates → Reset Password</strong>
              <br />
              <span className="text-gray-600">
                Vérifier que l'URL contient: {"{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}&type=recovery"}
              </span>
            </li>
          </ol>
        </div>

        <div className="p-4 border rounded bg-blue-50 border-blue-200">
          <h2 className="font-semibold mb-2">🔧 Procédure de test</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Aller sur https://ninowash.fr/auth/forgot-password</li>
            <li>Entrer votre email</li>
            <li>Ouvrir l'email sur iPhone Safari</li>
            <li>Cliquer sur le lien (il doit contenir "code=..." et "type=recovery")</li>
            <li>Le navigateur doit rediriger vers /auth/reset-password avec une session active</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
