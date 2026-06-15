import { ContactFormPreview } from "@/components/cmm/contact-form-preview";
import { PageHero } from "@/components/cmm/page-hero";
import { PhotoGrid } from "@/components/cmm/photo-grid";
import { ProfileCard } from "@/components/cmm/profile-card";
import { SiteHeader } from "@/components/cmm/site-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="cmm-yellow-field min-h-[calc(100vh-var(--header-height))]">
        <PageHero
          title="Cool Molecules Media"
          deck="an independent storytelling collective"
          className="pt-24 md:pt-40"
        />
      </section>

      <section id="about" className="px-site-x py-section-y">
        <PageHero
          title="A storytelling collective"
          align="center"
          className="px-0 pb-16 pt-0"
        />
        <PhotoGrid />
        <p className="mx-auto mt-16 max-w-4xl text-center text-2xl leading-snug">
          Cool Molecules Media was founded in 2019 by Ty McCloskey and Joshua
          Graber.{" "}
          <a className="underline decoration-2 underline-offset-4" href="#contact">
            Get in touch
          </a>{" "}
          to ask about collaborating with us.
        </p>
      </section>

      <section className="grid gap-16 px-site-x py-section-y md:grid-cols-2">
        <ProfileCard
          name="Joshua Graber"
          bio="A co-founder and producer at Cool Molecules Media, with a focus on untold stories from the counterculture."
          image={{
            src: "/images/josh-headshot.webp",
            alt: "Joshua Graber",
          }}
          eager
        />
        <ProfileCard
          name="Ty McCloskey"
          bio="A co-founder and producer at Cool Molecules Media, drawn to mining buried stories and making things of all kinds."
          image={{
            src: "/images/tyler-headshot.webp",
            alt: "Ty McCloskey",
          }}
          eager
        />
      </section>

      <section
        id="contact"
        className="grid gap-16 px-site-x py-section-y md:grid-cols-[0.8fr_1.2fr]"
      >
        <div>
          <h2 className="font-serif text-6xl font-semibold leading-none md:text-7xl">
            Contact us.
          </h2>
          <p className="mt-8 max-w-md text-xl leading-relaxed">
            Ask about collaborating with us, pitch an audio documentary, or send
            us a tip for a story we might be interested in telling.
          </p>
        </div>
        <ContactFormPreview />
      </section>
    </main>
  );
}
