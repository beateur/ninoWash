"use client"

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[v0] SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("[v0] SW registration failed: ", registrationError)
        })
    })
  }
}

export function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("[v0] Notification permission:", permission)
      })
    }
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon-192x192.jpg",
      badge: "/icon-192x192.jpg",
      ...options,
    })
  }
}
