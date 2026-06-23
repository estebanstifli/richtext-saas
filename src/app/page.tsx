import { ArrowRight, FileText, LockKeyhole, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/messages/en";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-muted/35">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
            <div className="max-w-2xl space-y-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {messages.landing.heroEyebrow}
              </p>
              <div className="space-y-5">
                <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                  {messages.landing.heroTitle}
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">{messages.landing.heroSubtitle}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className={buttonVariants({ size: "default" })} href="/register">
                  {messages.landing.heroPrimaryCta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link className={buttonVariants({ variant: "outline" })} href="/#pricing">
                  {messages.landing.heroSecondaryCta}
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{messages.appName}</span>
              </div>
              <div className="grid gap-0 md:grid-cols-[160px_1fr]">
                <aside className="hidden border-r border-border bg-muted/60 p-4 md:block">
                  <div className="mb-4 h-3 w-20 rounded bg-muted-foreground/20" />
                  <div className="space-y-3">
                    <div className="rounded-md bg-background p-3 text-xs font-medium shadow-sm">
                      {messages.landing.preview.documents[0]}
                    </div>
                    <div className="rounded-md p-3 text-xs text-muted-foreground">
                      {messages.landing.preview.documents[1]}
                    </div>
                    <div className="rounded-md p-3 text-xs text-muted-foreground">
                      {messages.landing.preview.documents[2]}
                    </div>
                  </div>
                </aside>
                <div className="p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-4">
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
                      {messages.landing.preview.toolbar[0]}
                    </span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs italic">
                      {messages.landing.preview.toolbar[1]}
                    </span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs">
                      {messages.landing.preview.toolbar[2]}
                    </span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs">
                      {messages.landing.preview.toolbar[3]}
                    </span>
                  </div>
                  <article className="space-y-4">
                    <div className="h-8 w-3/4 rounded bg-foreground/90" />
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-muted-foreground/20" />
                      <div className="h-3 w-11/12 rounded bg-muted-foreground/20" />
                      <div className="h-3 w-4/5 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="rounded-md border-l-4 border-primary bg-accent/80 p-4">
                      <div className="h-3 w-10/12 rounded bg-accent-foreground/30" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-5/6 rounded bg-muted-foreground/20" />
                      <div className="h-3 w-2/3 rounded bg-muted-foreground/20" />
                    </div>
                  </article>
                </div>
              </div>
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
