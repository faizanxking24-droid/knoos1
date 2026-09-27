import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Mail, Phone, MessageCircle, Home, User, Users, Info, HelpCircle, Shield, FileText, ShoppingBag } from "lucide-react";

export function Footer() {
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();

  return (
    <footer className="border-t border-brand-navy-dark bg-brand-navy text-white">
      <Reveal className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16" yOffset={20} duration={0.6}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/knoos-logo.png"
                alt="KNOOS"
                width={150}
                height={100}
                className="h-10 w-auto object-contain brightness-110"
              />
            </Link>
            <p className="font-serif italic text-brand-sky text-sm">
              Comfort In Every Step
            </p>
            <p className="text-slate-300 text-xs leading-relaxed max-w-xs">
              Premium footwear designed for everyday comfort and refined elegance by KNOOS.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-gold block mb-2">
                Social
              </span>
              <div className="flex flex-col gap-2.5">
                <a
                  href="https://www.instagram.com/knoosshoes"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KNOOS Instagram"
                  className="group inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
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
                    className="text-brand-blue group-hover:scale-110 group-hover:text-brand-gold transition-transform"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span className="font-mono font-medium text-white group-hover:text-brand-gold group-hover:underline">@KNOOSSHOES</span>
                </a>

                {facebookUrl ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook @KNOOSSHOES"
                    className="group inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
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
                      className="text-brand-blue group-hover:scale-110 group-hover:text-brand-gold transition-transform"
                      aria-hidden="true"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <span className="font-mono font-medium text-white group-hover:text-brand-gold group-hover:underline">
                      @KNOOSSHOES
                    </span>
                  </a>
                ) : (
                  <div
                    className="inline-flex items-center gap-2 text-sm text-slate-300"
                    title="@KNOOSSHOES on Facebook"
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
                      className="text-brand-blue"
                      aria-hidden="true"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <span className="font-mono font-medium text-white">
                      @KNOOSSHOES
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gold mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/search" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <ShoppingBag size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Shop By</span>
                </Link>
              </li>
              <li>
                <Link href="/men" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <User size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Men</span>
                </Link>
              </li>
              <li>
                <Link href="/women" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <Users size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Women</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gold mb-4">
              Information
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <Info size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <Phone size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <HelpCircle size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <FileText size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Return &amp; Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <Shield size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <FileText size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gold mb-4">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="font-medium text-white">
                KNOOS
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                15/5 SORON KTRA SHAHGANJ<br />
                AGRA - 282010
              </p>
              <div className="pt-1 space-y-2 text-xs">
                <a href="tel:7088808882" className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <Phone size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span className="font-mono hover:underline text-white">7088808882</span>
                </a>
                <a href="https://wa.me/917088808882" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <MessageCircle size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span className="font-mono hover:underline text-white">WhatsApp</span>
                </a>
                <a href="mailto:KKSHOECOMPANY@GMAIL.COM" className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <Mail size={14} className="group-hover:scale-110 text-brand-blue group-hover:text-brand-gold transition-transform" />
                  <span className="font-mono hover:underline text-white">KKSHOECOMPANY@GMAIL.COM</span>
                </a>
                <div className="flex items-center gap-2 pt-1 text-slate-300">
                  <Info size={14} className="text-brand-gold" />
                  <span className="text-white">10 AM – 7 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-slate-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} KNOOS. All rights reserved.
          </p>
          <p className="font-mono text-xs text-brand-gold/90 text-center sm:text-right">
            Comfort In Every Step
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
