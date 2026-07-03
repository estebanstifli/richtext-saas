import { ArrowRight, Cloud, FileText, ImageIcon, LockKeyhole, PenLine, PlayCircle, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/messages/en";

// Landing principal del producto.
// Todo el contenido sale de messages para mantener copy centralizado.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-accent/20 to-accent/50">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
              <div className="max-w-xl space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {messages.landing.heroBadge}
                </span>
                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  {messages.landing.heroTitleTop}                  
                  <br />
                  <span className="text-primary">{messages.landing.heroTitleAccent}</span>
                </h1>
                <p className="max-w-lg text-lg leading-8 text-muted-foreground">
                  {messages.landing.heroSubtitle}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link className={buttonVariants({ size: "default" })} href="/register">
                    {messages.landing.heroPrimaryCta}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link className={buttonVariants({ variant: "outline" })} href="/#pricing">
                    <PlayCircle aria-hidden="true" className="h-4 w-4" />
                    {messages.landing.heroSecondaryCta}
                  </Link>
                </div>
              </div>
              <div className="relative lg:-mr-10">
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
                <Image
                  alt={messages.landing.heroImageAlt}
                  className="h-auto w-full drop-shadow-2xl"
                  height={768}
                  priority
                  src="/landing/laptop-hero.png"
                  width={1152}
                />
              </div>
            </div>
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Highlights rapidos para explicar valor sin scrollear demasiado. */}
              {messages.landing.heroHighlights.map((highlight, index) => {
                const Icon = [PenLine, ImageIcon, Cloud, LockKeyhole][index] ?? PenLine;
                return (
                  <div
                    key={highlight.title}
                    className="rounded-xl border border-border bg-background/70 p-5 shadow-sm backdrop-blur-sm"
                  >
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold">{highlight.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6" id="features">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl space-y-3">
              <h2 className="text-3xl font-bold tracking-normal">{messages.landing.featuresTitle}</h2>
              <p className="text-muted-foreground">{messages.landing.featuresSubtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Features mas detalladas en formato card. */}
              {messages.landing.features.map((feature, index) => {
                const icons = [Sparkles, LockKeyhole, FileText];
                const Icon = icons[index] ?? FileText;

                return (
                  <Card key={feature.title}>
                    <CardHeader>
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/35 px-4 py-20 sm:px-6" id="pricing">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                  <Zap aria-hidden="true" className="h-4 w-4" />
                  {messages.landing.pricingTitle}
                </div>
                <p className="text-lg leading-8 text-muted-foreground">{messages.landing.pricingSubtitle}</p>
              </div>
            </div>
            <PricingCards />
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6" id="faq">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.7fr_1fr]">
            <h2 className="text-3xl font-bold tracking-normal">{messages.landing.faqTitle}</h2>
            <div className="space-y-4">
              {/* FAQ simple: pregunta + respuesta. */}
              {messages.landing.faqItems.map((item) => (
                <div className="border-b border-border pb-4" key={item.question}>
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-foreground px-4 py-16 text-background sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-bold tracking-normal">{messages.landing.ctaTitle}</h2>
              <p className="text-background/75">{messages.landing.ctaSubtitle}</p>
            </div>
            <Link className={buttonVariants({ variant: "secondary" })} href="/register">
              {messages.landing.ctaButton}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
