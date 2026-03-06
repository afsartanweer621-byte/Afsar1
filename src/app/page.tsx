"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Truck, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { HeroCarousel } from "@/components/home/HeroCarousel";

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for authorized profile record
  const profileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: profile } = useDoc(profileRef);

  // A user is only "authorized" if they have an actual profile doc. 
  // Anonymous registration sessions (without a profile) will see the standard landing page.
  const isAuthorizedRetailer = !!user && !!profile;

  // Hydration fix: Prevent rendering content that depends on dynamic client-side auth state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white text-foreground font-sans">
      <Navbar />
      
      <main className="flex-grow">
        {/* Dynamic Hero Carousel */}
        <HeroCarousel />

        {/* Value Proposition */}
        <section className="py-32 bg-white border-b border-primary/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-secondary font-bold uppercase tracking-[0.3em] text-[11px]">B2B Logistics Standard</span>
                  <h2 className="text-5xl md:text-6xl font-serif italic leading-[1.1]">
                    The standard of <br /> <span className="text-secondary">footwear procurement.</span>
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Mochibazaar is an exclusive B2B gateway connecting verified high-end boutiques with world-class footwear artisans. Our portal provides real-time stock access, artisan direct pricing, and duty-handled logistics.
                </p>
                <div className="pt-4">
                  {!isAuthorizedRetailer ? (
                    <Link href="/register">
                      <Button variant="outline" className="border-primary h-14 px-8 rounded-[4px] uppercase font-bold text-[11px] tracking-widest gap-2">
                        Request Partner Access <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/catalog">
                      <Button className="bg-primary text-background h-14 px-8 rounded-[4px] uppercase font-bold text-[11px] tracking-widest gap-2">
                        Access Catalog <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { title: "Direct Sourcing", icon: <Box className="h-6 w-6" />, desc: "Workshop direct pricing." },
                  { title: "Global Logistics", icon: <Truck className="h-6 w-6" />, desc: "Duty-handled shipping." },
                  { title: "Flexible Credit", icon: <CreditCard className="h-6 w-6" />, desc: "Verified retail lines." },
                  { title: "Artisan Quality", icon: <ShieldCheck className="h-6 w-6" />, desc: "Multi-point inspection." },
                ].map((feature, i) => (
                  <div key={i} className="p-8 border border-primary/5 bg-primary/5 rounded-[4px] space-y-4 group hover:bg-white hover:shadow-xl hover:border-transparent transition-all">
                    <div className="text-secondary">{feature.icon}</div>
                    <h3 className="text-[15px] font-bold uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-white">
          <div className="container mx-auto px-6 text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-6xl font-serif italic">Ready to transform your boutique's inventory?</h2>
              <p className="text-white/60 text-lg">Join 500+ premium retailers sourcing directly from global artisans.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {isAuthorizedRetailer ? (
                <Link href="/account">
                  <Button className="bg-secondary text-white hover:bg-secondary/90 h-16 px-12 rounded-[4px] uppercase font-bold tracking-widest text-[12px]">
                    Go to Account Hub
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="bg-secondary text-white hover:bg-secondary/90 h-16 px-12 rounded-[4px] uppercase font-bold tracking-widest text-[12px]">
                      Existing Partner Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-primary h-16 px-12 rounded-[4px] uppercase font-bold tracking-widest text-[12px]">
                      Apply for Registry
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white text-primary border-t border-primary/10 py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
            <div className="space-y-6 max-w-sm">
              <Logo />
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Empowering independent retailers with the world's most sophisticated footwear inventory management and sourcing tools.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-secondary">Portal</h4>
                <ul className="space-y-3 text-[13px] font-medium text-muted-foreground">
                  <li><Link href="/login" className="hover:text-secondary">Retailer Login</Link></li>
                  <li><Link href="/register" className="hover:text-secondary">Apply for Access</Link></li>
                  <li><Link href="/admin" className="hover:text-secondary">Admin Terminal</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-secondary">Registry</h4>
                <ul className="space-y-3 text-[13px] font-medium text-muted-foreground">
                  <li><Link href="/catalog" className="hover:text-secondary">Stock Catalog</Link></li>
                  <li><Link href="/credit" className="hover:text-secondary">Credit Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            <p>© 2024 MOCHIBAZAAR.COM. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-10">
              <Link href="#" className="hover:text-primary">Privacy</Link>
              <Link href="#" className="hover:text-primary">Legal</Link>
              <Link href="#" className="hover:text-primary">Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
