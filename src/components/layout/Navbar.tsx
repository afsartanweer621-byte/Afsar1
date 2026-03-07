'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, User, LogIn, LogOut, Trash2, LayoutDashboard, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { items, removeFromCart, cartCount, cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for administrative terminal authorization in session storage
    const authStatus = sessionStorage.getItem("admin_terminal_authorized");
    setIsAdminAuthorized(authStatus === "true");
  }, [pathname]);

  const sessionProfileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: sessionProfile } = useDoc(sessionProfileRef);

  const notificationsQuery = useMemoFirebase(() => 
    user ? query(collection(db, "Notifications"), orderBy("createdAt", "desc")) : null,
  [db, user]);
  const { data: notifications } = useCollection(notificationsQuery);

  const readNotificationsQuery = useMemoFirebase(() => 
    user ? collection(db, "AuthorizedUsers", user.uid, "readNotifications") : null,
  [db, user]);
  const { data: readNotifications } = useCollection(readNotificationsQuery);

  const readIds = new Set(readNotifications?.map(r => r.id) || []);
  const unreadNotifications = notifications?.filter(n => !readIds.has(n.id)) || [];
  const unreadCount = unreadNotifications.length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been logged out of the secure portal." });
      router.push("/");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const markAllAsRead = (open: boolean) => {
    if (!open || !user || !notifications || unreadCount === 0) return;
    
    notifications.forEach(n => {
      if (!readIds.has(n.id)) {
        const readRef = doc(db, "AuthorizedUsers", user.uid, "readNotifications", n.id);
        setDocumentNonBlocking(readRef, { readAt: new Date().toISOString() }, { merge: true });
      }
    });
  };

  const handleCheckout = () => {
    if (!user || !sessionProfile) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to submit orders." });
      return;
    }

    const orderId = crypto.randomUUID();
    const orderRef = doc(db, "Orders", orderId);
    
    const masterId = sessionProfile?.originalRequestId || user.uid;
    
    const orderData = {
      id: orderId,
      userId: masterId,
      items: items.map(i => ({
        ...i,
        discount: 0
      })),
      totalAmount: cartTotal,
      status: "Processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    toast({
      title: "Order Submitted",
      description: "Our logistics team will verify your order and update your billing statement.",
    });
    
    clearCart();
    router.push("/account");
  };

  const isAuthorized = !!user && !!sessionProfile;
  
  // Only show the terminal switcher tabs if the admin is authorized AND they are actually on an admin page
  const showAdminTabs = isAdminAuthorized && (pathname === '/admin' || pathname === '/admin1');

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-primary/5 bg-background/90 backdrop-blur-2xl text-primary">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <Logo className="h-4 md:h-5 w-auto" />
          <div className="h-8 w-16 bg-primary/5 animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/5 bg-background/90 backdrop-blur-2xl text-primary">
      <div className="container mx-auto px-4 flex h-16 md:h-20 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center group">
            <Logo className="h-4 md:h-5 w-auto transition-all group-hover:opacity-70" />
          </Link>

          {/* Admin Tabs - Only shown when authorized and inside an admin route */}
          {showAdminTabs && (
            <div className="hidden sm:flex items-center gap-1 border-l border-primary/10 pl-4 md:pl-8">
              <Link href="/admin1">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "h-8 px-3 rounded-none uppercase font-black text-[8px] tracking-[0.2em] gap-2",
                    pathname === '/admin1' ? "bg-accent text-white" : "text-primary/40 hover:text-primary"
                  )}
                >
                  <Fingerprint className="h-3 w-3" /> Registry
                </Button>
              </Link>
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "h-8 px-3 rounded-none uppercase font-black text-[8px] tracking-[0.2em] gap-2",
                    pathname === '/admin' ? "bg-accent text-white" : "text-primary/40 hover:text-primary"
                  )}
                >
                  <LayoutDashboard className="h-3 w-3" /> Management
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {isAuthorized ? (
            <>
              <DropdownMenu onOpenChange={markAllAsRead}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-none h-10 w-10 group">
                    <Bell className="h-4 w-4 group-hover:text-accent" />
                    {unreadCount > 0 && (
                      <Badge className="absolute top-2.5 right-2.5 h-1.5 w-1.5 flex items-center justify-center p-0 bg-red-600 text-white border-none rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-none border border-primary/5 shadow-2xl p-0 overflow-hidden">
                  <div className="p-3 bg-primary text-background flex justify-between items-center">
                    <span className="uppercase font-black text-[9px] tracking-widest">Broadcasts</span>
                  </div>
                  <ScrollArea className="h-[250px]">
                    {notifications?.length === 0 ? (
                      <div className="p-8 text-center opacity-20 text-[9px] font-black uppercase tracking-widest">No Alerts</div>
                    ) : (
                      <div className="divide-y divide-primary/5">
                        {notifications?.map((n) => (
                          <div key={n.id} className="p-3 space-y-1 hover:bg-secondary/5 transition-colors">
                            <span className="font-black text-[10px] uppercase">{n.title}</span>
                            <p className="text-[9px] opacity-70 line-clamp-2">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-none h-10 w-10 group">
                    <ShoppingCart className="h-4 w-4 group-hover:text-accent" />
                    {cartCount > 0 && (
                      <Badge className="absolute top-2 right-2 h-3.5 w-3.5 flex items-center justify-center p-0 bg-accent text-background border-none text-[7px] font-black rounded-full">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] sm:w-[25vw] sm:max-w-[25vw] flex flex-col p-0 rounded-none shadow-2xl border-l border-primary/10 transition-all duration-300">
                  <SheetHeader className="p-6 md:p-8 border-b border-primary/10">
                    <SheetTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Wholesale Cart</SheetTitle>
                    <SheetDescription className="text-[9px] font-black uppercase text-accent tracking-widest">Review Registry Order</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="flex-grow">
                    <div className="p-6 md:p-8 space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-3 py-4 border-b border-primary/5 last:border-none">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 flex-1">
                              <h4 className="text-base md:text-lg font-black uppercase leading-tight tracking-tight text-primary">
                                {item.name}
                              </h4>
                              <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest bg-primary/5 inline-block px-1.5 py-0.5">
                                SKU: {item.id}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromCart(item.id)} 
                              className="h-7 w-7 text-destructive hover:bg-destructive/5 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-secondary/5 p-3 border border-primary/5">
                            <div className="flex items-center gap-2">
                              <span className="opacity-40">Qty:</span>
                              <span className="text-primary">{item.quantity} UNITS</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="opacity-40">Total:</span>
                              <span className="text-primary">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                          <ShoppingCart className="h-12 w-12 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Registry Empty</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  {items.length > 0 && (
                    <div className="p-6 md:p-8 border-t border-primary/10 bg-white space-y-6">
                      <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Grand Order Total</span>
                          <div className="text-[8px] font-bold text-accent uppercase tracking-widest">Incl. 5% GST & Duties</div>
                        </div>
                        <p className="text-xl md:text-2xl font-black tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</p>
                      </div>
                      <Button 
                        onClick={handleCheckout} 
                        className="w-full h-14 bg-primary text-background hover:bg-accent transition-all rounded-none uppercase font-black text-[10px] tracking-[0.3em]"
                      >
                        Finalize Sourcing Order
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 group">
                    <User className="h-4 w-4 group-hover:text-accent" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-none border border-primary/5 shadow-2xl p-2">
                  <div className="px-2 py-2 border-b border-primary/5 mb-1">
                    <p className="text-[9px] font-black uppercase text-primary truncate">
                      {sessionProfile?.firmName || "Partner"}
                    </p>
                  </div>
                  <DropdownMenuItem asChild className="uppercase font-black text-[7px] tracking-widest p-2 cursor-pointer">
                    <Link href="/account">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive uppercase font-black text-[7px] tracking-widest p-2 cursor-pointer">
                    <LogOut className="h-2.5 w-2.5 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login">
                <Button variant="ghost" className="h-8 px-2 uppercase font-black text-[8px] tracking-widest">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="h-8 px-3 bg-primary text-background rounded-none uppercase font-black text-[8px] tracking-widest">Registry</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Admin Navigation Bar - Only shown when authorized and inside an admin route */}
      {showAdminTabs && (
        <div className="sm:hidden flex items-center justify-center gap-4 py-2 border-t border-primary/5">
          <Link href="/admin1" className={cn("text-[8px] font-black uppercase tracking-widest", pathname === '/admin1' ? "text-accent" : "text-primary/40")}>Registry</Link>
          <div className="h-3 w-px bg-primary/10" />
          <Link href="/admin" className={cn("text-[8px] font-black uppercase tracking-widest", pathname === '/admin' ? "text-accent" : "text-primary/40")}>Management</Link>
        </div>
      )}
    </nav>
  );
}
