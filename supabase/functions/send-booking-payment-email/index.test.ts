/**
 * Unit tests for send-booking-payment-email Edge Function
 * Tests the handler with mocked Resend API and Supabase auth
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/testing/asserts.ts"
import { handler, corsHeaders } from "./index.ts"

Deno.test("handler - OPTIONS request returns CORS headers", async () => {
  const req = new Request("http://localhost", { method: "OPTIONS" })
  const res = await handler(req)
  assertEquals(res.status, 200)
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*")
})

Deno.test("handler - Invalid payload returns 400", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invalid: "payload" }),
  })
  const res = await handler(req)
  assertEquals(res.status, 400)
  const json = await res.json()
  assertStringIncludes(json.error, "Invalid payload")
})

Deno.test("handler - Guest booking sends payment email", async () => {
  // Mock Deno.env
  Deno.env.set("RESEND_API_KEY", "test_key")
  Deno.env.set("NEXT_PUBLIC_APP_URL", "https://app.test")

  // Mock fetch globally to capture Resend API call
  let capturedFetchCall: { url: string; init: RequestInit } | null = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: string | Request, init?: RequestInit) => {
    if (typeof input === "string" && input.includes("api.resend.com")) {
      capturedFetchCall = { url: input, init: init || {} }
      // Simulate successful Resend response
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }
    return originalFetch(input, init)
  }

  try {
    const bookingPayload = {
      type: "INSERT",
      record: {
        id: "booking-uuid-1",
        booking_number: "BK-20251017-ABC123",
        user_id: null,
        status: "pending_payment",
        total_amount_cents: 5000,
        metadata: {
          guest_contact: {
            email: "guest@example.com",
            first_name: "Alice",
            last_name: "Martin",
          },
        },
        created_at: "2025-10-17T10:00:00Z",
      },
    }

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bookingPayload),
    })

    const res = await handler(req)
    assertEquals(res.status, 200)

    const json = await res.json()
    assertEquals(json.success, true)
    assertEquals(json.email, "guest@example.com")
    assertEquals(json.messageId, "email_123")

    // Verify Resend API was called correctly
    assertEquals(capturedFetchCall !== null, true)
    if (capturedFetchCall) {
      const body = JSON.parse(capturedFetchCall.init.body as string)
      assertEquals(body.to, "guest@example.com")
      assertStringIncludes(body.subject, "BK-20251017-ABC123")
      assertStringIncludes(body.html, "Alice Martin")
      assertStringIncludes(body.html, "50.00€")
      assertStringIncludes(body.html, "/booking/booking-uuid-1/pay")
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

Deno.test("handler - No email found returns 400", async () => {
  Deno.env.set("RESEND_API_KEY", "test_key")
  Deno.env.set("NEXT_PUBLIC_APP_URL", "https://app.test")

  const bookingPayload = {
    type: "INSERT",
    record: {
      id: "booking-uuid-2",
      booking_number: "BK-20251017-DEF456",
      user_id: null,
      status: "pending_payment",
      total_amount_cents: 2000,
      metadata: {
        guest_contact: {
          email: null, // Missing email
          first_name: "Bob",
          last_name: "Smith",
        },
      },
      created_at: "2025-10-17T10:00:00Z",
    },
  }

  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bookingPayload),
  })

  const res = await handler(req)
  assertEquals(res.status, 400)
  const json = await res.json()
  assertStringIncludes(json.error, "No email found")
})

Deno.test("handler - Missing RESEND_API_KEY returns 500", async () => {
  Deno.env.delete("RESEND_API_KEY")
  Deno.env.set("NEXT_PUBLIC_APP_URL", "https://app.test")

  const bookingPayload = {
    type: "INSERT",
    record: {
      id: "booking-uuid-3",
      booking_number: "BK-20251017-GHI789",
      user_id: null,
      status: "pending_payment",
      total_amount_cents: 3000,
      metadata: {
        guest_contact: {
          email: "guest@example.com",
          first_name: "Charlie",
          last_name: "Brown",
        },
      },
      created_at: "2025-10-17T10:00:00Z",
    },
  }

  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bookingPayload),
  })

  const res = await handler(req)
  assertEquals(res.status, 500)
  const json = await res.json()
  assertStringIncludes(json.error, "Email service not configured")
})

Deno.test("handler - Handles zero amount bookings", async () => {
  Deno.env.set("RESEND_API_KEY", "test_key")
  Deno.env.set("NEXT_PUBLIC_APP_URL", "https://app.test")

  let capturedBody: any = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: string | Request, init?: RequestInit) => {
    if (typeof input === "string" && input.includes("api.resend.com")) {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(JSON.stringify({ id: "email_zero" }), { status: 200 })
    }
    return originalFetch(input, init)
  }

  try {
    const bookingPayload = {
      type: "INSERT",
      record: {
        id: "booking-uuid-4",
        booking_number: "BK-20251017-ZERO",
        user_id: null,
        status: "pending_payment",
        total_amount_cents: 0,
        metadata: {
          guest_contact: {
            email: "guest@example.com",
            first_name: "Zero",
            last_name: "Amount",
          },
        },
        created_at: "2025-10-17T10:00:00Z",
      },
    }

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bookingPayload),
    })

    const res = await handler(req)
    assertEquals(res.status, 200)

    // Verify 0€ is shown correctly
    assertStringIncludes(capturedBody.html, "0.00€")
  } finally {
    globalThis.fetch = originalFetch
  }
})
