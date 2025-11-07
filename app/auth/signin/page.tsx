import { AuthForm } from "@/components/forms/auth-form"

export default function SignInPage({
  searchParams,
}: {
  searchParams: { email?: string; message?: string; redirect?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <AuthForm 
        mode="signin" 
        defaultEmail={searchParams.email}
        infoMessage={searchParams.message}
      />
    </div>
  )
}
