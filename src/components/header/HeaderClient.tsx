"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, Search, ShoppingBag, X, ChevronDown, Menu } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { CustomerLoginModal } from "@/components/auth/CustomerLoginModal";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HeaderClientProps {
  cartCount: number;
  userName?: string | null;
  signInAction: () => void;
  signOutAction: () => void;
  categories: Category[];
}

export function HeaderClient({
  cartCount,
  userName,
  signInAction,
  signOutAction,
  categories,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShopByOpen, setIsShopByOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shopByRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isShopByOpen) setIsShopByOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, isShopByOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopByRef.current && !shopByRef.current.contains(e.target as Node)) {
        setIsShopByOpen(false);
      }
    }
    if (isShopByOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isShopByOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-brand-sky-border/40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] py-2.5"
            : "bg-[#FCFDFE]/90 backdrop-blur-sm border-b border-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between">
          
          {/* Mobile Left: Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 -ml-2 text-brand-dark hover:text-brand-blue transition-colors flex items-center gap-1.5"
            >
              <Menu size={22} strokeWidth={1.75} />
              <span className="font-mono text-[11px] uppercase tracking-widest font-medium hidden xs:inline">Menu</span>
            </button>
          </div>

          {/* Brand Logo (Left on Desktop, Centered on Mobile) */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-transform duration-300 hover:opacity-90 active:scale-95"
          >
            <Image
              src="/knoos-logo.png"
              alt="KNOOS Footwear"
              width={130}
              height={45}
              priority
              className={`w-auto object-contain origin-left transition-all duration-300 ${
                isScrolled ? "h-8 sm:h-9 scale-[0.94]" : "h-9 sm:h-10 scale-100"
              }`}
            />
          </Link>

          {/* Desktop Center Navigation */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            <Link
              href="/men"
              className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand-dark hover:text-brand-blue transition-colors py-1 relative group"
            >
              <span>Men</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
            </Link>

            <Link
              href="/women"
              className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand-dark hover:text-brand-blue transition-colors py-1 relative group"
            >
              <span>Women</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
            </Link>

            {/* Shop By Dropdown */}
            <div ref={shopByRef} className="relative">
              <button
                type="button"
                onClick={() => setIsShopByOpen(!isShopByOpen)}
                className="group relative flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-brand-dark hover:text-brand-blue transition-colors py-1"
                aria-expanded={isShopByOpen}
              >
                <span>Shop By</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    isShopByOpen ? "rotate-180 text-brand-blue" : "text-brand-gray-400 group-hover:text-brand-blue"
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
              </button>

              <AnimatePresence>
                {isShopByOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white/95 backdrop-blur-md border border-brand-sky-border/60 shadow-xl rounded-xl py-2 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-gray-400 border-b border-brand-gray-100 mb-1">
                      Collections
                    </div>
                    <Link
                      href="/search?sort=Newest"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-2 text-xs font-mono uppercase tracking-wider text-brand-dark hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      New Arrivals
                    </Link>
                    <Link
                      href="/men"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-2 text-xs font-mono uppercase tracking-wider text-brand-dark hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      Men&apos;s Footwear
                    </Link>
                    <Link
                      href="/women"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-2 text-xs font-mono uppercase tracking-wider text-brand-dark hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      Women&apos;s Footwear
                    </Link>
                    <div className="border-t border-brand-gray-100 my-1" />
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-gray-400">
                      Categories
                    </div>
                    <Link
                      href="/search?category=sneakers"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-1.5 text-xs text-brand-gray-600 hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      Sneakers
                    </Link>
                    <Link
                      href="/search?category=loafers"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-1.5 text-xs text-brand-gray-600 hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      Loafers
                    </Link>
                    <Link
                      href="/search?category=boots"
                      onClick={() => setIsShopByOpen(false)}
                      className="block px-4 py-1.5 text-xs text-brand-gray-600 hover:bg-brand-sky hover:text-brand-navy transition-colors"
                    >
                      Boots
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/search?category=${cat.slug}`}
                        onClick={() => setIsShopByOpen(false)}
                        className="block px-4 py-1.5 text-xs text-brand-gray-600 hover:bg-brand-sky hover:text-brand-navy transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/about"
              className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand-dark hover:text-brand-blue transition-colors py-1 relative group"
            >
              <span>About</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
            </Link>
          </nav>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="group p-1.5 text-brand-dark hover:text-brand-blue transition-colors flex items-center gap-1.5 relative"
              aria-label="Search KNOOS footwear"
            >
              <Search size={18} strokeWidth={1.75} />
              <span className="hidden lg:inline font-mono text-[11px] uppercase tracking-widest text-brand-dark font-medium relative">
                Search
                <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
              </span>
            </button>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="p-1.5 text-brand-dark hover:text-brand-blue transition-colors flex items-center gap-1.5 relative group"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <div className="relative">
                <ShoppingBag size={18} strokeWidth={1.75} className="group-hover:scale-105 transition-transform duration-200" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-brand-blue text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </div>
              <span className="hidden lg:inline font-mono text-[11px] uppercase tracking-widest text-brand-dark font-medium relative">
                Cart
                <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
              </span>
            </Link>

            {/* Account / User section (Desktop) */}
            <div className="hidden md:flex items-center">
              {userName ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/account"
                    className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-brand-dark hover:text-brand-blue transition-colors relative py-1"
                  >
                    <User size={16} strokeWidth={1.75} />
                    <span className="max-w-[100px] truncate relative">
                      {userName}
                      <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOutAction()}
                    className="font-mono text-[10px] uppercase tracking-widest text-brand-gray-500 hover:text-rose-600 transition-colors pl-2 border-l border-brand-gray-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (process.env.NEXT_PUBLIC_OTP_ENABLED === "true") {
                      setIsLoginModalOpen(true);
                    } else {
                      signInAction();
                    }
                  }}
                  className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-brand-dark hover:text-brand-blue transition-colors relative py-1"
                >
                  <User size={16} strokeWidth={1.75} />
                  <span className="relative">
                    Sign In
                    <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-brand-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Overlay Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-brand-sky-border/50 bg-white/98 backdrop-blur-md overflow-hidden"
            >
              <div className="max-w-4xl mx-auto px-6 py-6 md:py-8">
                <form action="/search" method="GET" className="relative flex items-center">
                  <Search size={22} className="absolute left-0 text-brand-blue pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    name="q"
                    placeholder="Search footwear by style, model, or category..."
                    className="w-full pl-9 pr-10 py-2.5 text-lg md:text-2xl font-serif text-brand-dark bg-transparent border-b border-brand-dark/20 focus:border-brand-blue focus:outline-none placeholder:text-brand-gray-400 placeholder:font-sans placeholder:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Close search"
                    className="absolute right-0 p-1.5 text-brand-gray-400 hover:text-brand-dark transition-colors"
                  >
                    <X size={20} />
                  </button>
                </form>
                <div className="mt-3 flex items-center gap-3 text-xs font-mono text-brand-gray-500">
                  <span className="uppercase tracking-widest text-[10px] text-brand-blue">Suggestions:</span>
                  <Link href="/search?q=runner" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-navy hover:underline">
                    Apex Runner
                  </Link>
                  <Link href="/search?q=classic" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-navy hover:underline">
                    Court Classic
                  </Link>
                  <Link href="/search?q=boots" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-navy hover:underline">
                    Chelsea Boots
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop for Search */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 bg-brand-navy/30 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        cartCount={cartCount}
        userName={userName}
        signInAction={signInAction}
        signOutAction={signOutAction}
        categories={categories}
        openLoginModal={() => setIsLoginModalOpen(true)}
      />

      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
