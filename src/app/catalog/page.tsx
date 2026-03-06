
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Search, Loader2, ShoppingCart, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { HeroCarousel } from "@/components/home/HeroCarousel";

const FALLBACK_PRODUCTS = [
  { id: '1021-Prado-Hill', name: '1021-Prado Hill', stockQuantity: 26, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 1 },
  { id: '1032-Prado-Hill', name: '1032-Prado Hill', stockQuantity: 14, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 2 },
  { id: '1051-Prado-Hill', name: '1051-Prado Hill', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 3 },
  { id: '1082-PradoHill', name: '1082-PradoHill', stockQuantity: 20, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 4 },
  { id: '1091-PradoHill', name: '1091-PradoHill', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 5 },
  { id: '1102-PradoHill', name: '1102-PradoHill', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 6 },
  { id: '1132-PradoHill', name: '1132-PradoHill', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 7 },
  { id: '1141-Prado-Hill', name: '1141-Prado Hill', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 8 },
  { id: '1142-PradoHill', name: '1142-PradoHill', stockQuantity: 32, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 9 },
  { id: '1162-PradoHill', name: '1162-PradoHill', stockQuantity: 14, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 10 },
  { id: '1192-PradoHill', name: '1192-PradoHill', stockQuantity: 29, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 11 },
  { id: '1232-PradoHill', name: '1232-PradoHill', stockQuantity: 11, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 12 },
  { id: '1261-PradoHill', name: '1261-PradoHill', stockQuantity: 6, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 13 },
  { id: '1272-PradoHill', name: '1272-PradoHill', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 14 },
  { id: '1321-PradoHill', name: '1321-PradoHill', stockQuantity: 49, mrp: 999, margin: '38%', price: 619.38, category: 'PradoHill', displayOrder: 15 },
  { id: '1421', name: '1421', stockQuantity: 30, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 16 },
  { id: '1431', name: '1431', stockQuantity: 43, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 17 },
  { id: '1451', name: '1451', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 18 },
  { id: '1461', name: '1461', stockQuantity: 21, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 19 },
  { id: '1481', name: '1481', stockQuantity: 3, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 20 },
  { id: '1501', name: '1501', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 21 },
  { id: '1551', name: '1551', stockQuantity: 3, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 22 },
  { id: '1611', name: '1611', stockQuantity: 34, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 23 },
  { id: '1621', name: '1621', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 24 },
  { id: '1631', name: '1631', stockQuantity: 3, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 25 },
  { id: '1641', name: '1641', stockQuantity: 17, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 26 },
  { id: '1661', name: '1661', stockQuantity: 3, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 27 },
  { id: '1671', name: '1671', stockQuantity: 20, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 28 },
  { id: '1681', name: '1681', stockQuantity: 9, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 29 },
  { id: '1691', name: '1691', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 30 },
  { id: '1701', name: '1701', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 31 },
  { id: '1704', name: '1704', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 32 },
  { id: '1708', name: '1708', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 33 },
  { id: '1721', name: '1721', stockQuantity: 28, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 34 },
  { id: '1806-Prado-Hill', name: '1806-Prado Hill', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 35 },
  { id: '1807', name: '1807', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 36 },
  { id: '1814', name: '1814', stockQuantity: 10, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 37 },
  { id: '1816', name: '1816', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 38 },
  { id: '1871', name: '1871', stockQuantity: 7, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 39 },
  { id: '1872-PH', name: '1872-PH', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'Prado Hill', displayOrder: 40 },
  { id: '1902', name: '1902', stockQuantity: 31, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 41 },
  { id: '1903', name: '1903', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 42 },
  { id: '1904', name: '1904', stockQuantity: 30, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 43 },
  { id: '2024', name: '2024', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 44 },
  { id: '2025', name: '2025', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 45 },
  { id: '2026', name: '2026', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 46 },
  { id: '3101', name: '3101', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 47 },
  { id: '3102', name: '3102', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 48 },
  { id: '3108', name: '3108', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 49 },
  { id: '3109', name: '3109', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 50 },
  { id: '4105', name: '4105', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 51 },
  { id: '4109', name: '4109', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 52 },
  { id: '5102', name: '5102', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 53 },
  { id: '5103', name: '5103', stockQuantity: 3, mrp: 999, margin: '38%', price: 619.38, category: 'Classic', displayOrder: 54 },
  { id: '8262-SnakeHorn', name: '8262-SnakeHorn', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'SnakeHorn', displayOrder: 55 },
  { id: '8272-SnakeHorn', name: '8272-SnakeHorn', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'SnakeHorn', displayOrder: 56 },
  { id: 'A2305T', name: 'A2305T', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 57 },
  { id: 'A2311T', name: 'A2311T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 58 },
  { id: 'A2314T', name: 'A2314T', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 59 },
  { id: 'A2315T', name: 'A2315T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 60 },
  { id: 'A2319T', name: 'A2319T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 61 },
  { id: 'A2328T', name: 'A2328T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 62 },
  { id: 'A2334T', name: 'A2334T', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 63 },
  { id: 'A2343T', name: 'A2343T', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 64 },
  { id: 'A2344T', name: 'A2344T', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 65 },
  { id: 'A2345T', name: 'A2345T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 66 },
  { id: 'A2346T', name: 'A2346T', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 67 },
  { id: 'A23471', name: 'A23471', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 68 },
  { id: 'A2348T', name: 'A2348T', stockQuantity: 20, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 69 },
  { id: 'A2349T', name: 'A2349T', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 70 },
  { id: 'A2350T', name: 'A2350T', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 71 },
  { id: 'A2351T', name: 'A2351T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 72 },
  { id: 'A2354T', name: 'A2354T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 73 },
  { id: 'A2355T', name: 'A2355T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 74 },
  { id: 'A2356T', name: 'A2356T', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 75 },
  { id: 'A2358T', name: 'A2358T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 76 },
  { id: 'A2359T', name: 'A2359T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 77 },
  { id: 'A2361T', name: 'A2361T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 78 },
  { id: 'A2362T', name: 'A2362T', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'T-Series', displayOrder: 79 },
  { id: 'Dummy', name: 'Dummy', stockQuantity: 2, mrp: 999, margin: '38%', price: 619.38, category: 'Test', displayOrder: 80 },
  { id: '13101N', name: '13101N', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 81 },
  { id: '13103N', name: '13103N', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 82 },
  { id: '13105N', name: '13105N', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 83 },
  { id: '13106N', name: '13106N', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 84 },
  { id: '13107N', name: '13107N', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 85 },
  { id: '13109N', name: '13109N', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 86 },
  { id: '13110N', name: '13110N', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 87 },
  { id: '13112N', name: '13112N', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 88 },
  { id: '13116N', name: '13116N', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 89 },
  { id: '13117N', name: '13117N', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 90 },
  { id: '13118N', name: '13118N', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 91 },
  { id: '13119N', name: '13119N', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 92 },
  { id: '13120N', name: '13120N', stockQuantity: 16, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 93 },
  { id: '13121N', name: '13121N', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 94 },
  { id: '13122N', name: '13122N', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 95 },
  { id: '13123N', name: '13123N', stockQuantity: 24, mrp: 999, margin: '38', price: 619.38, category: 'N-Series', displayOrder: 96 },
  { id: '13124N', name: '13124N', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 97 },
  { id: '13125N', name: '13125N', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 98 },
  { id: '13126N', name: '13126N', stockQuantity: 24, mrp: 999, margin: '38%', price: 619.38, category: 'N-Series', displayOrder: 99 },
  { id: 'LP-8104', name: 'LP-8104', stockQuantity: 1, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 100 },
  { id: 'LP-8105', name: 'LP-8105', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 101 },
  { id: 'LP-8106', name: 'LP-8106', stockQuantity: 12, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 102 },
  { id: 'LP-8107', name: 'LP-8107', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 103 },
  { id: 'LP-8201', name: 'LP-8201', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 104 },
  { id: 'LP-8203', name: 'LP-8203', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'LP-Series', displayOrder: 105 },
  { id: 'M3304D', name: 'M3304D', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'M-Series', displayOrder: 106 },
  { id: 'PACKING', name: 'PACKING', stockQuantity: 14, mrp: 999, margin: '38%', price: 619.38, category: 'Service', displayOrder: 107 },
  { id: 'SH-1111', name: 'SH-1111', stockQuantity: 11, mrp: 999, margin: '38%', price: 619.38, category: 'SH-Series', displayOrder: 108 },
  { id: 'SH-1301', name: 'SH-1301', stockQuantity: 2, mrp: 999, margin: '38%', price: 619.38, category: 'SH-Series', displayOrder: 109 },
  { id: 'SH-1309', name: 'SH-1309', stockQuantity: 8, mrp: 999, margin: '38%', price: 619.38, category: 'SH-Series', displayOrder: 110 },
  { id: 'SH-1311', name: 'SH-1311', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'SH-Series', displayOrder: 111 },
  { id: 'SH-1401', name: 'SH-1401', stockQuantity: 4, mrp: 999, margin: '38%', price: 619.38, category: 'SH-Series', displayOrder: 112 },
];

const PRODUCTS_PER_PAGE = 50;

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
    
    return merged.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
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

  const handleAddToCart = (product: any) => {
    const qty = parseInt(quantities[product.id] || "0");
    if (qty <= 0) {
      toast({ variant: "destructive", title: "Qty Required" });
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
            Registry <span className="text-accent">Articles</span>.
          </h1>
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
            {paginatedProducts.map((product) => (
              <div key={product.id} className="group flex flex-col bg-white border border-primary/5 hover:border-accent/10 transition-all overflow-hidden shadow-sm">
                <div className="relative h-20 md:h-24 w-full bg-primary/5">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center opacity-5">
                      <Package className="h-4 w-4" />
                    </div>
                  )}
                  <Badge className="absolute top-1 right-1 bg-primary/90 text-[5px] font-black uppercase px-1 py-0 rounded-none border-none">
                    AVL: {product.stockQuantity}
                  </Badge>
                </div>
                
                <div className="p-1.5 space-y-1">
                  <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter leading-tight font-lato truncate">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-1 pt-1 border-t border-primary/5">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] md:text-[11px] font-black text-primary">₹{product.price?.toLocaleString('en-IN')}</div>
                      <div className="text-[7px] font-bold text-primary/40 line-through">MRP: ₹{product.mrp}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="rounded-none border-primary/10 h-5 font-black text-center text-[7px] w-6 p-0"
                        value={quantities[product.id] || ""}
                        onChange={(e) => handleQtyChange(product.id, e.target.value)}
                      />
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-primary text-background hover:bg-accent rounded-none font-black uppercase text-[7px] tracking-widest h-5 px-0"
                      >
                        ADD <ShoppingCart className="ml-1 h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
