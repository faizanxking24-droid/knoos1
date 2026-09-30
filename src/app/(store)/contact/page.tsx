import { Metadata } from "next";
import Link from "next/link";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion";
import { Phone, MessageCircle, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | KNOOS",
  description: "Get in touch with KNOOS customer support. Reach KRIPA KIRAN SHOE COMPANY via phone, WhatsApp, or email for inquiries and support.",
};

export default function ContactPage() {
  return (
    <main className="bg-brand-surface min-h-screen py-12 sm:py-20 lg:py-24">
      <StoreContainer>
        {/* Header */}
        <Reveal>
          <div className="max-w-3xl mb-14 sm:mb-20">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-blue font-semibold block mb-3">
              CUSTOMER CARE &bull; DEDICATED SUPPORT
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.1] mb-6">
              Get in Touch
            </h1>
            <p className="text-neutral-600 text-base sm:text-lg font-light leading-relaxed">
              Our concierge team is available to assist you with sizing recommendations, order tracking, returns, and bespoke corporate orders.
            </p>
          </div>
        </Reveal>

        {/* 3 Contact Channels */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {/* Phone */}
          <StaggerItem className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between hover:border-brand-blue/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mb-6 shadow-2xs">
                <Phone size={20} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-2">
                DIRECT LINE
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-2 font-medium">Telephone</h2>
              <p className="text-sm text-neutral-500 font-light mb-6 leading-relaxed">
                Direct phone support for immediate order questions and logistics updates.
              </p>
              <p className="font-mono text-lg font-semibold text-neutral-900 mb-8">
                +91 70888 08882
              </p>
            </div>
            <a
              href="tel:7088808882"
              className="group w-full flex items-center justify-center gap-2 py-3.5 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest rounded-xl hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 font-medium shadow-xs"
            >
              <span>Call Team</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </StaggerItem>

          {/* WhatsApp */}
          <StaggerItem className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between hover:border-brand-blue/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-6 shadow-2xs">
                <MessageCircle size={20} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold block mb-2">
                INSTANT MESSAGING
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-2 font-medium">WhatsApp</h2>
              <p className="text-sm text-neutral-500 font-light mb-6 leading-relaxed">
                Send unboxing photos, fit inquiries, or exchange requests for quick replies.
              </p>
              <p className="font-mono text-lg font-semibold text-neutral-900 mb-8">
                +91 70888 08882
              </p>
            </div>
            <a
              href="https://wa.me/917088808882"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase tracking-widest rounded-xl hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 font-medium shadow-xs"
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </StaggerItem>

          {/* Email */}
          <StaggerItem className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between hover:border-brand-blue/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/40 border border-brand-sky-border flex items-center justify-center text-brand-blue mb-6 shadow-2xs">
                <Mail size={20} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue font-semibold block mb-2">
                OFFICIAL INBOX
              </span>
              <h2 className="font-serif text-2xl text-brand-dark mb-2 font-medium">Email Care</h2>
              <p className="text-sm text-neutral-500 font-light mb-6 leading-relaxed">
                Send formal return documentation, corporate gifting, or feedback.
              </p>
              <p className="font-mono text-xs sm:text-sm font-semibold text-neutral-900 mb-8 break-all">
                kkshoeco@gmail.com
              </p>
            </div>
            <a
              href="mailto:kkshoeco@gmail.com"
              className="group w-full flex items-center justify-center gap-2 py-3.5 bg-brand-navy hover:bg-brand-blue text-white font-mono text-xs uppercase tracking-widest rounded-xl hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 font-medium shadow-xs"
            >
              <span>Compose Email</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </StaggerItem>
        </StaggerContainer>

        {/* Operating Hours & Registered Studio Details */}
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <MapPin size={22} className="text-brand-blue" />
                <h3 className="font-serif text-2xl text-brand-dark font-medium">Headquarters &amp; Workshop</h3>
              </div>
              <p className="font-mono text-sm text-neutral-900 font-semibold mb-2">
                KRIPA KIRAN SHOE COMPANY
              </p>
              <p className="text-neutral-600 text-sm leading-relaxed font-light mb-6">
                15/5 Soron Ktra, Shahganj, Agra, Uttar Pradesh - 282010, India
              </p>
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-sky-border/60 text-xs font-mono text-neutral-600">
                Central dispatch hub for all pan-India shipments.
              </div>
            </div>

            <div className="bg-white border border-brand-sky-border/60 rounded-3xl p-8 sm:p-10 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <Clock size={22} className="text-brand-blue" />
                <h3 className="font-serif text-2xl text-brand-dark font-medium">Operating Hours</h3>
              </div>
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                  <span className="text-neutral-500 uppercase tracking-wider">Monday &ndash; Saturday</span>
                  <span className="text-neutral-900 font-semibold">10:00 AM &ndash; 7:00 PM IST</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                  <span className="text-neutral-500 uppercase tracking-wider">Sunday</span>
                  <span className="text-neutral-400">Closed (Inquiries answered Monday)</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-neutral-500 uppercase tracking-wider">Average Response Time</span>
                  <span className="text-emerald-700 font-semibold">&lt; 2 Hours on WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Quick Links Help Strip */}
        <Reveal>
          <div className="bg-gradient-to-r from-brand-navy to-neutral-950 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-gold block mb-2">
                SELF-SERVICE RESOURCES
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl">Looking for quick answers?</h3>
              <p className="text-neutral-400 text-sm font-light mt-1">
                Check our sizing conversions, return procedure, or common ordering questions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/faq"
                className="px-6 py-3 bg-white text-neutral-950 font-mono text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand-blue hover:text-white hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 shadow-xs"
              >
                Read FAQs
              </Link>
              <Link
                href="/returns-refunds"
                className="px-6 py-3 border border-white/30 text-white font-mono text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-white hover:text-neutral-950 hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200"
              >
                Return Policy
              </Link>
            </div>
          </div>
        </Reveal>
      </StoreContainer>
    </main>
  );
}
