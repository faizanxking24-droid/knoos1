import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { StoreContainer } from "@/components/store/StoreContainer";
import { ArrowRight, Compass, Feather, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | KNOOS",
  description: "Discover KNOOS by KRIPA KIRAN SHOE COMPANY. Premium footwear designed around comfort, style, and refined aesthetics.",
};

export default function AboutPage() {
  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 lg:py-24">
      <StoreContainer>
        {/* Editorial Story Header */}
        <div className="max-w-3xl mb-16 sm:mb-24">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-blue font-semibold block mb-4">
            OUR PHILOSOPHY &bull; THE KNOOS STANDARD
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl text-brand-dark tracking-tight leading-[1.05] mb-6">
            Architectural Footwear, Handcrafted for Life.
          </h1>
          <p className="font-serif italic text-2xl sm:text-3xl text-brand-navy font-light leading-relaxed mb-6">
            &ldquo;Comfort in every step.&rdquo;
          </p>
          <p className="text-neutral-600 text-base sm:text-lg font-light leading-relaxed">
            KNOOS, created by KRIPA KIRAN SHOE COMPANY, is a contemporary footwear label founded on the conviction that everyday style should never compromise on ergonomic comfort.
          </p>
        </div>

        {/* Editorial Workshop Image Banner */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-lg border border-brand-sky-border/50 mb-16 sm:mb-24 bg-neutral-900">
          <Image
            src="/images/process-footwear.jpg"
            alt="The KNOOS Footwear Workshop"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-sky/80 block">
                The Agra Workshop
              </span>
              <p className="font-serif text-xl sm:text-2xl font-light">
                Where traditional cordwaining meets anatomical precision.
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 self-start sm:self-auto">
              Edition 2026
            </span>
          </div>
        </div>

        {/* Three Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-20 sm:mb-28">
          <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mb-6 shadow-2xs">
                <Feather size={22} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-3">
                01 &bull; ANATOMICAL FIT
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-4 font-medium">
                Dedicated to Comfort
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
                Every silhouette is engineered around human ergonomics with multi-density cushioned footbeds and considered arch support for 14-hour days on your feet.
              </p>
            </div>
          </div>

          <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mb-6 shadow-2xs">
                <Compass size={22} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-3">
                02 &bull; PROPORTION
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-4 font-medium">
                Timeless Modernism
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
                Pure lines, balanced proportions, and versatile silhouettes that move seamlessly from client conferences to weekend travel across every season.
              </p>
            </div>
          </div>

          <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mb-6 shadow-2xs">
                <Sparkles size={22} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-3">
                03 &bull; ARTISANAL FINISH
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-4 font-medium">
                Devotion to Detail
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
                From hand-burnishing toe boxes to bespoke packaging and direct doorstep dispatch, we ensure every touchpoint feels exceptional.
              </p>
            </div>
          </div>
        </div>

        {/* Brand Statement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white p-8 sm:p-14 lg:p-18 mb-20 shadow-xl border border-neutral-800">
          <div className="max-w-3xl relative z-10">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold block mb-4">
              KRIPA KIRAN SHOE COMPANY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6 font-normal">
              Crafting a seamless footwear journey from Shahganj, Agra to your doorstep.
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-light">
              Rooted in India’s historic leathercraft capital, our mission is to deliver thoughtfully constructed footwear with attentive customer support and transparent policies.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/men"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-neutral-950 font-mono text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand-blue hover:text-white transition-colors shadow-md"
              >
                <span>Shop Men</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/women"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/30 text-white font-mono text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-white hover:text-neutral-950 transition-colors"
              >
                <span>Shop Women</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Care Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-brand-sky-border/70 pt-10">
          <div>
            <h3 className="font-serif text-xl text-brand-dark font-medium">Have questions regarding fit or craft?</h3>
            <p className="text-sm text-neutral-500 font-light mt-1">
              Our footwear concierge team in Agra is available Monday to Saturday, 10 AM to 7 PM IST.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-colors font-medium self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>Contact Concierge</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </StoreContainer>
    </main>
  );
}
