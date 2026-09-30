"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X, ChevronDown, User, ShoppingBag, ArrowRight, Phone, MessageCircle, Shield } from "lucide-react";
import { easings } from "@/components/motion/constants";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  userName?: string | null;
  signInAction: () => void;
  signOutAction: () => void;
  categories: Category[];
  openLoginModal?: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  cartCount,
  userName,
  signInAction,
  signOutAction,
  categories,
  openLoginModal,
}: MobileMenuProps) {
  const [isShopByOpen, setIsShopByOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const navContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.06,
      },
    },
  };

  const navItemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: easings.premium,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 bottom-0 left-0 w-[88vw] max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            {/* Top Bar */}
            <div>
              <div className="flex items-center justify-between px-6 py-5 border-b border-brand-gray-100">
                <Link href="/" onClick={onClose} className="flex items-center">
                  <Image
                    src="/knoos-logo.png"
                    alt="KNOOS"
                    width={110}
                    height={36}
                    priority
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-full bg-brand-sky/40 border border-brand-sky-border/40 flex items-center justify-center text-brand-dark hover:text-brand-blue transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Editorial Nav */}
              <motion.div
                variants={navContainerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 py-6 space-y-4"
              >
                <motion.div variants={navItemVariants}>
                  <Link
                    href="/men"
                    onClick={onClose}
                    className="group flex items-center justify-between font-serif text-3xl text-brand-dark hover:text-brand-blue py-1 transition-colors"
                  >
                    <span>Men</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-blue" />
                  </Link>
                </motion.div>

                <motion.div variants={navItemVariants}>
                  <Link
                    href="/women"
                    onClick={onClose}
                    className="group flex items-center justify-between font-serif text-3xl text-brand-dark hover:text-brand-blue py-1 transition-colors"
                  >
                    <span>Women</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-blue" />
                  </Link>
                </motion.div>

                <motion.div variants={navItemVariants}>
                  <Link
                    href="/search?sort=Newest"
                    onClick={onClose}
                    className="group flex items-center justify-between font-serif text-3xl text-brand-dark hover:text-brand-blue py-1 transition-colors"
                  >
                    <span>New Arrivals</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-blue" />
                  </Link>
                </motion.div>

                {/* Shop By Accordion */}
                <motion.div variants={navItemVariants} className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShopByOpen(!isShopByOpen)}
                    className="w-full flex items-center justify-between font-mono text-xs uppercase tracking-widest text-brand-gray-500 hover:text-brand-blue py-2 transition-colors"
                  >
                    <span>Categories</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isShopByOpen ? "rotate-180 text-brand-blue" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isShopByOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3 border-l border-brand-sky-border/50 space-y-2 mt-2"
                      >
                        <Link
                          href="/search?category=sneakers"
                          onClick={onClose}
                          className="block text-sm text-brand-gray-600 hover:text-brand-blue py-1 transition-colors"
                        >
                          Sneakers &amp; Trainers
                        </Link>
                        <Link
                          href="/search?category=loafers"
                          onClick={onClose}
                          className="block text-sm text-brand-gray-600 hover:text-brand-blue py-1 transition-colors"
                        >
                          Classic Loafers
                        </Link>
                        <Link
                          href="/search?category=boots"
                          onClick={onClose}
                          className="block text-sm text-brand-gray-600 hover:text-brand-blue py-1 transition-colors"
                        >
                          Boots
                        </Link>
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/search?category=${cat.slug}`}
                            onClick={onClose}
                            className="block text-sm text-brand-gray-600 hover:text-brand-blue py-1 transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Secondary Navigation Section */}
              <div className="px-6 py-4 border-t border-brand-gray-100 space-y-3 font-mono text-xs uppercase tracking-widest text-brand-gray-600">
                {userName ? (
                  <>
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="flex items-center gap-3 py-1.5 hover:text-brand-blue transition-colors"
                    >
                      <User size={15} className="text-brand-blue" />
                      <span>{userName}</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={onClose}
                      className="flex items-center gap-3 py-1.5 hover:text-brand-blue transition-colors"
                    >
                      <ShoppingBag size={15} className="text-brand-blue" />
                      <span>My Orders</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOutAction();
                        onClose();
                      }}
                      className="flex items-center gap-3 py-1.5 text-rose-600 hover:underline"
                    >
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (openLoginModal && process.env.NEXT_PUBLIC_OTP_ENABLED === "true") {
                          openLoginModal();
                        } else {
                          signInAction();
                        }
                        onClose();
                      }}
                      className="flex items-center gap-3 py-1.5 text-brand-navy hover:text-brand-blue font-semibold transition-colors"
                    >
                      <User size={15} className="text-brand-blue" />
                      <span>Sign In / Register</span>
                    </button>
                    <Link
                      href="/account/orders"
                      onClick={onClose}
                      className="flex items-center gap-3 py-1.5 hover:text-brand-blue transition-colors"
                    >
                      <ShoppingBag size={15} className="text-brand-blue" />
                      <span>Track Orders</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 py-1.5 hover:text-brand-blue transition-colors"
                >
                  <Shield size={15} className="text-brand-blue" />
                  <span>About KNOOS</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={onClose}
                  className="flex items-center gap-3 py-1.5 hover:text-brand-blue transition-colors"
                >
                  <Phone size={15} className="text-brand-blue" />
                  <span>Contact &amp; Support</span>
                </Link>
              </div>
            </div>

            {/* Bottom Brand Details */}
            <div className="p-6 bg-brand-sky/20 border-t border-brand-sky-border/40">
              <p className="font-serif italic text-brand-navy text-sm mb-1">
                Comfort In Every Step
              </p>
              <div className="flex items-center gap-3 text-xs text-brand-gray-500 pt-2">
                <a href="tel:7088808882" className="hover:text-brand-blue transition-colors">
                  7088808882
                </a>
                <span>&bull;</span>
                <a
                  href="https://wa.me/917088808882"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-blue transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
