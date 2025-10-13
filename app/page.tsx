"use client"

import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/sections/hero-section"
import { ServicesSection } from "@/components/sections/services-section"
import { HowItWorksSection } from "@/components/sections/how-it-works-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      {/*<TestimonialsSection />*/}
      <Footer />
    </main>
  )
}
