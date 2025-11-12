/**
 * Layout for guest booking flow
 * Removes header/footer distractions for better conversion
 */

export default function GuestBookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">Nino Wash</span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Minimal footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Besoin d&apos;aide ?{" "}
            <a
              href="mailto:contact@ninowash.fr"
              className="underline hover:text-foreground"
            >
              contact@ninowash.fr
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
