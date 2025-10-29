export const FB_PIXEL_ID = '811036591782615'

export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data)
  }
}

// Événement: Début de réservation
export const trackInitiateCheckout = (serviceId?: string) => {
  trackEvent('InitiateCheckout', {
    content_category: 'booking',
    content_ids: serviceId ? [serviceId] : undefined,
  })
}

// Événement: Lead (formulaire soumis)
export const trackLead = (data?: { email?: string; phone?: string; name?: string }) => {
  trackEvent('Lead', {
    content_category: 'booking',
    ...data,
  })
}

// Événement: Purchase (paiement réussi)
export const trackPurchase = (data: {
  value: number // Montant en euros
  currency?: string
  bookingNumber?: string
}) => {
  trackEvent('Purchase', {
    value: data.value,
    currency: data.currency || 'EUR',
    content_type: 'product',
    content_name: 'Pressing Service',
    content_ids: data.bookingNumber ? [data.bookingNumber] : undefined,
  })
}

// Événement: ViewContent (page de service consultée)
export const trackViewContent = (data?: {
  contentName?: string
  contentCategory?: string
}) => {
  trackEvent('ViewContent', {
    content_name: data?.contentName || 'Service Page',
    content_category: data?.contentCategory || 'services',
  })
}

// Événement: CompleteRegistration (inscription)
export const trackCompleteRegistration = (data?: { method?: string }) => {
  trackEvent('CompleteRegistration', {
    content_name: 'User Registration',
    status: 'completed',
    ...data,
  })
}
