
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Search, Loader2, ShoppingCart, Package, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FALLBACK_PRODUCTS } from "@/lib/fallback-products";

const PRODUCTS_PER_PAGE = 25;

export default function CatalogPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !isProfileLoading) {
      if (!user || !profile) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Exclusive wholesale registry. Please log in.",
        });
        router.push("/login");
      }
    }
  }, [mounted, user, profile, isUserLoading, isProfileLoading, router, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const productsQuery = useMemoFirebase(() => 
    collection(db, "Products"), 
  [db]);
  const { data: firestoreProducts, isLoading: loadingProducts } = useCollection(productsQuery);

  const mergedProducts = useMemo(() => {
    if (loadingProducts) return [];
    
    const base = [...FALLBACK_PRODUCTS];
    if (!firestoreProducts || firestoreProducts.length === 0) {
      return base.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }

    const firestoreMap = new Map(firestoreProducts.map(p => [p.id, p]));
    const merged = base.map(p => firestoreMap.get(p.id) || p);
    
    const fallbackIds = new Set(base.map(p => p.id));
    firestoreProducts.forEach(p => {
      if (!fallbackIds.has(p.id)) {
        merged.push(p);
      }
    });
    
    return merged
      .filter(p => !p.deleted)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [firestoreProducts, loadingProducts]);

  const filteredProducts = useMemo(() => {
    return mergedProducts.filter(p => 
      (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [mergedProducts, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleQtyChange = (productId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const qtyInput = quantities[product.id] || "0";
    const qty = parseInt(qtyInput);
    
    if (qty <= 0) {
      toast({ variant: "destructive", title: "Qty Required" });
      return;
    }

    if (qty % 4 !== 0) {
      toast({ 
        variant: "destructive", 
        title: "Wholesale Requirement", 
        description: "Please order in multiples of 4 pieces (e.g., 4, 8, 12...)." 
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      category: product.category,
      mrp: product.mrp,
      margin: product.margin
    });

    toast({ title: "Added to Cart", description: `${qty} units of ${product.name}` });
    setQuantities(prev => ({ ...prev, [product.id]: "" }));
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Syncing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <HeroCarousel />

      <div className="container mx-auto px-4 py-4 flex-grow">
        <header className="mb-4 space-y-0.5">
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none text-primary">
            Product <span className="text-accent">Catalog</span>.
          </h1>
          <p className="text-[8px] font-black uppercase tracking-widest text-accent opacity-80">
            * All items must be ordered in multiples of 4 pieces. Click article to view full details.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 border-b border-primary/5 pb-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-0 top-1.5 h-3 w-3 text-primary/30" />
              <input 
                placeholder="SEARCH..." 
                className="pl-5 h-6 w-full bg-transparent focus:outline-none text-[8px] font-black uppercase tracking-widest" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-[7px] font-black uppercase text-primary/30">
              {filteredProducts.length} ARTICLES
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {paginatedProducts.map((product) => {
              const displayImg = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls[0]) || product.imageUrl;
              
              return (
                <div key={product.id} className="group flex flex-col bg-white border border-primary/5 hover:border-accent/10 transition-all overflow-hidden shadow-sm relative">
                  <Link href={`/catalog/${product.id}`} className="absolute inset-0 z-0" />
                  
                  <div className="relative h-20 md:h-24 w-full bg-primary/5">
                    {displayImg ? (
                      <Image 
                        src={displayImg} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-5">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <ArrowRight className="text-white h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="p-1.5 space-y-1 relative z-10 pointer-events-none">
                    <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter leading-tight font-lato truncate">
                      {product.name}
                    </h3>
                    
                    <div className="space-y-1.5 pt-1.5 border-t border-primary/5">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[7px] uppercase font-black opacity-40 leading-none mb-0.5">Wholesale</span>
                          <div className="text-[10px] md:text-[11px] font-black text-primary">₹{product.price?.toLocaleString('en-IN')}</div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-accent">{product.margin}% <span className="text-[6px]">MGN</span></span>
                          <span className="text-[7px] font-black opacity-30">AVL: {product.stockQuantity}</span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-[7px] uppercase font-black opacity-40 leading-none mb-0.5">MRP</span>
                          <div className="text-[8px] font-bold text-primary/40 line-through">₹{product.mrp}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pointer-events-auto">
                        <Input 
                          type="number" 
                          placeholder="0"
                          step="4"
                          min="0"
                          className="rounded-none border-primary/10 h-10 font-black text-center text-sm w-16 p-0"
                          value={quantities[product.id] || ""}
                          onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                          onClick={(e) => handleAddToCart(product, e)}
                          className="flex-1 bg-primary text-background hover:bg-accent rounded-none font-black uppercase text-[9px] tracking-widest h-10 px-0"
                        >
                          ADD TO CART <ShoppingCart className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-none h-6 px-2 uppercase font-black text-[7px]"
              >
                <ChevronLeft className="h-2 w-2 mr-1" /> PREV
              </Button>
              <span className="text-[7px] font-black uppercase opacity-40">{currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none h-6 px-2 uppercase font-black text-[7px]"
              >
                NEXT <ChevronRight className="h-2 w-2 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
