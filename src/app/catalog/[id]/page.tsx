"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { 
  Loader2, 
  ShoppingCart, 
  Package, 
  ChevronLeft, 
  ShieldCheck, 
  Tag, 
  Info,
  TrendingUp,
  Box
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { FALLBACK_PRODUCTS } from "@/lib/fallback-products";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState("");
  const [mounted, setMounted] = useState(false);

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  const productsQuery = useMemoFirebase(() => collection(db, "Products"), [db]);
  const { data: firestoreProducts, isLoading: loadingProducts } = useCollection(productsQuery);

  const product = useMemo(() => {
    if (loadingProducts || !id) return null;
    
    // Check Firestore first
    const fromFirestore = firestoreProducts?.find(p => p.id === id);
    if (fromFirestore) return fromFirestore;
    
    // Check Fallback
    return FALLBACK_PRODUCTS.find(p => p.id === id);
  }, [firestoreProducts, loadingProducts, id]);

  const handleAddToCart = () => {
    if (!product) return;
    const qty = parseInt(quantity);
    
    if (isNaN(qty) || qty <= 0) {
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
    setQuantity("");
  };

  if (!mounted || isUserLoading || isProfileLoading || loadingProducts) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Syncing Article...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-6">
          <Package className="h-16 w-16 opacity-10" />
          <p className="text-xl font-black uppercase">Article Not Found</p>
          <Button onClick={() => router.push("/catalog")} className="rounded-none uppercase font-black text-[10px] tracking-widest">
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-16 flex-grow">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/catalog")}
          className="mb-8 md:mb-12 rounded-none uppercase font-black text-[10px] tracking-widest gap-2 opacity-40 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Product Catalog
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
          {/* Product Image Section */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-primary/5 border border-primary/5 overflow-hidden group">
              {product.imageUrl ? (
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center opacity-10">
                  <Package className="h-20 w-20 mb-4" />
                  <span className="text-[10px] font-black uppercase">Visual Preview Unavailable</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-background rounded-none uppercase font-black text-[10px] tracking-widest px-4 py-1.5 border-none shadow-2xl">
                  {product.category || "Premium Sourcing"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary/5 p-4 flex flex-col items-center justify-center gap-2">
                <Box className="h-4 w-4 text-accent" />
                <span className="text-[8px] font-black uppercase opacity-40">HSN CODE</span>
                <span className="text-[10px] font-black">{product.hsn || "6403"}</span>
              </div>
              <div className="bg-primary/5 p-4 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-[8px] font-black uppercase opacity-40">Wholesale Margin</span>
                <span className="text-[10px] font-black">{product.margin}%</span>
              </div>
              <div className="bg-primary/5 p-4 flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span className="text-[8px] font-black uppercase opacity-40">Auth Registry</span>
                <span className="text-[10px] font-black">Verified</span>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-accent font-black uppercase tracking-[0.4em] text-[10px]">Registry Article #{product.id}</span>
              <h1 className="text-4xl md:text-7xl font-serif italic text-primary leading-tight">
                {product.name}
              </h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium max-w-lg leading-relaxed">
                Handcrafted premium footwear sourced direct from verified global artisans. Exclusive B2B pricing for registered partners only.
              </p>
            </div>

            <div className="space-y-8 py-8 border-y border-primary/5">
              <div className="flex items-end gap-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Wholesale Price (Incl. GST)</span>
                  <div className="text-4xl md:text-5xl font-black text-primary">₹{product.price?.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Retail MRP</span>
                  <div className="text-xl md:text-2xl font-black text-primary/30 line-through">₹{product.mrp?.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="rounded-none border-primary/20 text-[10px] font-black uppercase py-2 px-4 gap-2">
                  <Info className="h-3 w-3 text-accent" /> Available Stock: {product.stockQuantity} UNITS
                </Badge>
                <Badge variant="outline" className="rounded-none border-primary/20 text-[10px] font-black uppercase py-2 px-4">
                  Multiples of 4 ONLY
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-3 w-full sm:w-32">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">ORDER QUANTITY</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    step="4"
                    min="0"
                    className="rounded-none border-primary/10 h-16 font-black text-center text-xl w-full p-0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 w-full h-16 bg-primary text-background hover:bg-accent rounded-none font-black uppercase text-xs tracking-[0.4em] transition-all"
                >
                  Add to Cart <ShoppingCart className="ml-4 h-5 w-5" />
                </Button>
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-accent text-center sm:text-left opacity-60">
                * Authorization required to sync with your master credit registry.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
