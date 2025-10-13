declare interface DenoEnv {
  get(name: string): string | undefined
}

declare interface DenoServeInit {
  signal?: AbortSignal
  onListen?: (params: { hostname: string; port: number; secure: boolean }) => void
}

declare const Deno: {
  env: DenoEnv
  serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: DenoServeInit
  ): { shutdown(): Promise<void> }
}
