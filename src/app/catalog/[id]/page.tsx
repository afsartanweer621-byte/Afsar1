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
  TrendingUp,
  Box,
  Info
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
      
      <main className="container max-w-5xl mx-auto px-4 py-8 md:py-12 flex-grow">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/catalog")}
          className="mb-6 md:mb-8 rounded-none uppercase font-black text-[9px] tracking-widest gap-2 opacity-40 hover:opacity-100"
        >
          <ChevronLeft className="h-3 w-3" /> Back to Catalog
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Product Image Section */}
          <div className="space-y-4">
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
                  <Package className="h-12 w-12 mb-2" />
                  <span className="text-[8px] font-black uppercase">Visual Preview Unavailable</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-background rounded-none uppercase font-black text-[8px] tracking-widest px-3 py-1 border-none shadow-xl">
                  {product.category || "Premium"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-primary/5 p-3 flex flex-col items-center justify-center gap-1">
                <Box className="h-3 w-3 text-accent" />
                <span className="text-[7px] font-black uppercase opacity-40">HSN</span>
                <span className="text-[9px] font-black">{product.hsn || "6403"}</span>
              </div>
              <div className="bg-primary/5 p-3 flex flex-col items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-accent" />
                <span className="text-[7px] font-black uppercase opacity-40">Margin</span>
                <span className="text-[9px] font-black">{product.margin}%</span>
              </div>
              <div className="bg-primary/5 p-3 flex flex-col items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3 text-accent" />
                <span className="text-[7px] font-black uppercase opacity-40">Auth</span>
                <span className="text-[9px] font-black">Verified</span>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-accent font-black uppercase tracking-[0.3em] text-[9px]">Article #{product.id}</span>
              <h1 className="text-3xl md:text-5xl font-serif italic text-primary leading-tight">
                {product.name}
              </h1>
              <p className="text-muted-foreground text-[11px] uppercase tracking-widest font-medium max-w-sm leading-relaxed">
                Handcrafted premium footwear. Exclusive B2B pricing for registered partners only.
              </p>
            </div>

            <div className="space-y-6 py-6 border-y border-primary/5">
              <div className="flex items-end gap-8">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Wholesale Price</span>
                  <div className="text-3xl md:text-4xl font-black text-primary">₹{product.price?.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Retail MRP</span>
                  <div className="text-lg md:text-xl font-black text-primary/30 line-through">₹{product.mrp?.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-none border-primary/10 text-[9px] font-black uppercase py-1 px-3 gap-2">
                  <Info className="h-3 w-3 text-accent" /> Stock: {product.stockQuantity}
                </Badge>
                <Badge variant="outline" className="rounded-none border-primary/10 text-[9px] font-black uppercase py-1 px-3">
                  Multiples of 4 ONLY
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-2 w-full sm:w-24">
                  <label className="text-[8px] font-black uppercase tracking-widest opacity-40">QUANTITY</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    step="4"
                    min="0"
                    className="rounded-none border-primary/10 h-12 font-black text-center text-lg w-full p-0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 w-full h-12 bg-primary text-background hover:bg-accent rounded-none font-black uppercase text-[10px] tracking-[0.3em] transition-all"
                >
                  ADD TO CART <ShoppingCart className="ml-3 h-4 w-4" />
                </Button>
              </div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-accent text-center sm:text-left opacity-60">
                * Order requires active wholesale authorization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}