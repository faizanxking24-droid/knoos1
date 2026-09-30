"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MessageCircle, Info, Shield, FileText, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { StoreContainer } from "@/components/store/StoreContainer";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion";

export function Footer() {
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() || "https://www.facebook.com/knoosshoes";

  return (
    <footer className="relative bg-brand-navy-dark text-white border-t border-white/10 overflow-hidden">
      {/* Subtle oversized background brand wordmark */}
      <div
        aria-hidden="true"
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[14vw] font-serif font-bold tracking-tighter text-white/[0.03] select-none pointer-events-none leading-none whitespace-nowrap"
      >
        KNOOS
      </div>

      <StoreContainer className="pt-16 pb-12 sm:pt-20 sm:pb-16 relative z-10">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Column (Col 1-4) */}
          <StaggerItem className="lg:col-span-4 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/" className="inline-block transition-opacity hover:opacity-90">
                <Image
                  src="/knoos-logo.png"
                  alt="KNOOS Footwear"
                  width={140}
                  height={48}
                  className="h-9 sm:h-10 w-auto object-contain brightness-110"
                />
              </Link>
            </motion.div>

            <p className="font-serif italic text-brand-sky text-base sm:text-lg">
              Comfort In Every Step
            </p>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-light">
              Crafted with deliberate intent, ergonomic arch support, and timeless modern silhouettes for discerning daily wear.
            </p>

            {/* Social channels */}
            <div className="pt-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-brand-gold block mb-3">
                Connect
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://www.instagram.com/knoosshoes"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KNOOS on Instagram"
                  className="group inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors duration-200"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span className="hover:underline">@KNOOSSHOES</span>
                </a>

                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="KNOOS on Facebook"
                    className="group inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors duration-200"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200"
                      aria-hidden="true"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <span className="hover:underline">@KNOOSSHOES</span>
                  </a>
                )}

                <a
                  href="https://wa.me/917088808882"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KNOOS on WhatsApp"
                  className="group inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors duration-200"
                >
                  <MessageCircle
                    size={16}
                    className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="hover:underline">WHATSAPP</span>
                </a>
              </div>
            </div>
          </StaggerItem>

          {/* Shop Column (Col 5-7) */}
          <StaggerItem className="lg:col-span-3 space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">
              Shop Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/men" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group">
                  <span>Men&apos;s Footwear</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                </Link>
              </li>
              <li>
                <Link href="/women" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group">
                  <span>Women&apos;s Footwear</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                </Link>
              </li>
              <li>
                <Link href="/search?sort=Newest" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group">
                  <span>New Arrivals</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group">
                  <span>Complete Catalog</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                </Link>
              </li>
            </ul>
          </StaggerItem>

          {/* Information Column (Col 8-9) */}
          <StaggerItem className="lg:col-span-2 space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">
              Information
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/about" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <Info size={13} className="text-brand-blue" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <Phone size={13} className="text-brand-blue" />
                  <span>Contact Support</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <FileText size={13} className="text-brand-blue" />
                  <span>Returns Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <Shield size={13} className="text-brand-blue" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span>Terms of Service</span>
                </Link>
              </li>
            </ul>
          </StaggerItem>

          {/* Contact Column (Col 10-12) */}
          <StaggerItem className="lg:col-span-3 space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">
              Get in Touch
            </h4>
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white">KRIPA KIRAN SHOE COMPANY</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  15/5 Soron Ktra, Shahganj<br />
                  Agra — 282010, Uttar Pradesh
                </p>
              </div>

              <div className="pt-1 space-y-2 text-xs">
                <a
                  href="tel:7088808882"
                  className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 font-mono"
                >
                  <Phone size={13} className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200 shrink-0" />
                  <span>+91 7088808882</span>
                </a>
                <a
                  href="https://wa.me/917088808882"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 font-mono"
                >
                  <MessageCircle size={13} className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200 shrink-0" />
                  <span>WhatsApp Concierge</span>
                </a>
                <a
                  href="mailto:KKSHOECOMPANY@GMAIL.COM"
                  className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 font-mono"
                >
                  <Mail size={13} className="text-brand-blue group-hover:scale-[1.08] group-hover:-translate-y-[2px] group-hover:text-brand-gold transition-all duration-200 shrink-0" />
                  <span className="truncate">KKSHOECOMPANY@GMAIL.COM</span>
                </a>
                <p className="text-[11px] text-slate-400 pt-1">
                  Hours: Monday – Saturday, 10:00 AM – 7:00 PM IST
                </p>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Bottom Copyright and Legal Bar */}
        <Reveal>
          <div className="border-t border-white/10 mt-12 sm:mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-slate-400 text-center sm:text-left">
              &copy; {new Date().getFullYear()} KNOOS. Handcrafted Footwear. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
              <Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
              <Link href="/returns-refunds" className="hover:text-slate-200 transition-colors">Returns</Link>
            </div>
          </div>
        </Reveal>
      </StoreContainer>
    </footer>
  );
}
