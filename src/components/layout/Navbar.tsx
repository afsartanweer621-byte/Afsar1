'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Bell, 
  ShoppingCart, 
  User, 
  LogIn, 
  LogOut, 
  Trash2, 
  LayoutDashboard, 
  Fingerprint, 
  Loader2,
  Plus,
  Minus,
  AlertCircle,
  CreditCard,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
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
import { doc, collection, query, orderBy, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { items, removeFromCart, updateQuantity, cartCount, cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authStatus = sessionStorage.getItem("admin_terminal_authorized");
    setIsAdminAuthorized(authStatus === "true");
  }, [pathname]);

  const sessionProfileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: sessionProfile } = useDoc(sessionProfileRef);

  const masterId = sessionProfile?.originalRequestId || user?.uid;

  // Real-time queries for credit calculation
  const userOrdersQuery = useMemoFirebase(() => 
    masterId ? query(collection(db, "Orders"), where("userId", "==", masterId)) : null, 
  [db, masterId]);

  const userPaymentsQuery = useMemoFirebase(() => 
    masterId ? query(collection(db, "Payments"), where("userId", "==", masterId)) : null, 
  [db, masterId]);

  const { data: userOrders } = useCollection(userOrdersQuery);
  const { data: userPayments } = useCollection(userPaymentsQuery);

  const parseAmount = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const creditInfo = useMemo(() => {
    if (!sessionProfile || !userOrders || !userPayments) return null;

    const approvedOrdersTotal = userOrders
      ?.filter(o => o.status === 'Approved')
      .reduce((acc, curr) => acc + parseAmount(curr.totalAmount), 0) || 0;
      
    const paymentsTotal = userPayments
      ?.filter(p => !p.deleted)
      .reduce((acc, curr) => acc + parseAmount(curr.amount), 0) || 0;

    const openingBalance = parseAmount(sessionProfile.openingBalance);
    const creditLimit = parseAmount(sessionProfile.creditLimit);

    const totalDebits = approvedOrdersTotal + (openingBalance < 0 ? Math.abs(openingBalance) : 0);
    const totalCredits = paymentsTotal + (openingBalance > 0 ? openingBalance : 0);
    const currentOutstanding = totalDebits - totalCredits;
    const availableCredit = Math.max(0, creditLimit - currentOutstanding);

    return { availableCredit, currentOutstanding, creditLimit };
  }, [sessionProfile, userOrders, userPayments]);

  const excessAmount = useMemo(() => {
    if (!creditInfo) return 0;
    return Math.max(0, cartTotal - creditInfo.availableCredit);
  }, [creditInfo, cartTotal]);

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

  const finalizeOrder = (paymentId?: string) => {
    if (!user || !sessionProfile) return;
    
    setIsProcessingPayment(true);
    const orderId = crypto.randomUUID();
    const orderRef = doc(db, "Orders", orderId);
    
    const masterId = sessionProfile?.originalRequestId || user.uid;
    
    const orderData = {
      id: orderId,
      userId: masterId,
      items: items.map(i => ({ ...i, discount: 0 })),
      totalAmount: cartTotal,
      status: "Processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    if (paymentId) {
      const pRef = doc(collection(db, "Payments"));
      setDocumentNonBlocking(pRef, {
        id: pRef.id,
        userId: masterId,
        amount: excessAmount,
        paymentDate: new Date().toISOString(),
        remarks: `Excess Amount Payment (Razorpay: ${paymentId})`,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

    toast({
      title: "Order Submitted",
      description: paymentId 
        ? `Payment of ₹${excessAmount.toLocaleString()} verified. Order placed.` 
        : "Our logistics team will verify your order and update your billing statement.",
    });
    
    clearCart();
    setIsProcessingPayment(false);
    router.push("/account");
  };

  const handleCheckout = () => {
    if (!user || !sessionProfile) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to submit orders." });
      return;
    }

    if (excessAmount > 0) {
      setIsProcessingPayment(true);
      const options = {
        key: "rzp_live_SPD2FHOlvuoCjl",
        amount: Math.round(excessAmount * 100),
        currency: "INR",
        name: "Mochibazaar",
        description: `Excess Payment for Order (${items.length} Articles)`,
        handler: function (response: any) {
          finalizeOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: sessionProfile.firmName,
          contact: sessionProfile.phone,
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      finalizeOrder();
    }
  };

  const isAuthorized = !!user && !!sessionProfile;
  const showAdminTabs = isAdminAuthorized && (pathname === '/admin' || pathname === '/admin1');

  const markAllAsRead = (open: boolean) => {
    if (!open || !user || !notifications || unreadCount === 0) return;
    notifications.forEach(n => {
      if (!readIds.has(n.id)) {
        const readRef = doc(db, "AuthorizedUsers", user.uid, "readNotifications", n.id);
        setDocumentNonBlocking(readRef, { readAt: new Date().toISOString() }, { merge: true });
      }
    });
  };

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

          {showAdminTabs && (
            <div className="hidden sm:flex items-center gap-1 border-l border-primary/10 pl-4 md:pl-8">
              <Link href="/admin1">
                <Button variant="ghost" className={cn("h-8 px-3 rounded-none uppercase font-black text-[8px] tracking-[0.2em] gap-2", pathname === '/admin1' ? "bg-accent text-white" : "text-primary/40 hover:text-primary")}>
                  <Fingerprint className="h-3 w-3" /> Registry
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" className={cn("h-8 px-3 rounded-none uppercase font-black text-[8px] tracking-[0.2em] gap-2", pathname === '/admin' ? "bg-accent text-white" : "text-primary/40 hover:text-primary")}>
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
                <SheetContent side="right" className="w-[100vw] sm:w-[450px] flex flex-col p-0 rounded-none shadow-2xl border-l border-primary/10 transition-all duration-500">
                  <SheetHeader className="p-6 md:p-8 border-b border-primary/5 bg-primary/5">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <SheetTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Wholesale Cart</SheetTitle>
                        <SheetDescription className="text-[9px] font-black uppercase text-accent tracking-widest">Review Partner Procurement</SheetDescription>
                      </div>
                      {cartCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearCart} className="text-[8px] font-black uppercase opacity-40 hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all">
                          <Trash2 className="h-3 w-3 mr-1" /> Clear All
                        </Button>
                      )}
                    </div>
                  </SheetHeader>

                  <ScrollArea className="flex-grow">
                    <div className="p-6 md:p-8 space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="group relative flex flex-col bg-white border border-primary/5 p-4 rounded-none shadow-sm hover:shadow-md hover:border-primary/10 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <h4 className="text-sm md:text-base font-black uppercase leading-tight tracking-tight text-primary group-hover:text-accent transition-colors">{item.name}</h4>
                              <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-primary/5 px-1.5 py-0.5">SKU: {item.id}</span>
                                <span className="text-accent/60">{item.category}</span>
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromCart(item.id)} 
                              className="h-8 w-8 text-primary/20 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                            <div className="flex items-center bg-primary/5 rounded-none p-1 border border-primary/5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, Math.max(4, item.quantity - 4))}
                                className="h-7 w-7 text-primary/40 hover:text-primary hover:bg-white transition-all rounded-none"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-10 text-center text-[10px] font-black text-primary">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, item.quantity + 4)}
                                className="h-7 w-7 text-primary/40 hover:text-primary hover:bg-white transition-all rounded-none"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="text-[8px] font-black uppercase opacity-40 leading-none mb-1">Subtotal</div>
                              <div className="text-sm font-black text-primary">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {items.length === 0 && (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                          <div className="bg-primary/5 p-8 rounded-full">
                            <ShoppingCart className="h-16 w-16" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Registry Empty</p>
                            <p className="text-[8px] font-bold uppercase max-w-[200px] leading-relaxed">Your procurement list is currently void. Browse the catalog to add items.</p>
                          </div>
                          <Link href="/catalog">
                            <Button className="h-12 px-8 bg-primary text-background rounded-none uppercase font-black text-[9px] tracking-widest gap-2">
                              Browse Catalog <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {items.length > 0 && (
                    <div className="p-6 md:p-8 border-t border-primary/10 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-6">
                      {/* Credit Status Card */}
                      {creditInfo && (
                        <div className="bg-primary/5 border border-primary/5 p-4 rounded-none space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><CreditCard className="h-3 w-3 text-accent" /> Available Credit</span>
                            <span className={cn(creditInfo.availableCredit < cartTotal ? "text-red-600" : "text-green-600")}>
                              ₹{creditInfo.availableCredit.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, (cartTotal / creditInfo.availableCredit) * 100)} 
                            className="h-1.5 bg-primary/10" 
                          />
                          {excessAmount > 0 && (
                            <div className="flex items-center gap-2 text-[8px] font-bold text-red-600 uppercase animate-pulse">
                              <AlertCircle className="h-3 w-3" />
                              Limit Exceeded by ₹{excessAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-primary/5 pb-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Grand Order Total</span>
                            <div className="text-[8px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Incl. 5% GST & Duties
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl md:text-3xl font-black tracking-tighter text-primary">₹{cartTotal.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        
                        {excessAmount > 0 && (
                          <div className="p-4 bg-red-50 border-l-4 border-red-600 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-red-600">Action Required</p>
                                <p className="text-[8px] font-medium uppercase opacity-60 leading-tight">Pay excess amount to finalize order immediately.</p>
                              </div>
                              <span className="text-xs font-black text-red-700">₹{excessAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={handleCheckout} 
                        disabled={isProcessingPayment}
                        className={cn(
                          "w-full h-16 transition-all duration-300 rounded-none uppercase font-black text-[10px] tracking-[0.3em] shadow-xl hover:shadow-2xl",
                          excessAmount > 0 ? "bg-accent text-white hover:bg-accent/90" : "bg-primary text-background hover:bg-primary/90"
                        )}
                      >
                        {isProcessingPayment ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>PROCESSING...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <span>{excessAmount > 0 ? `PAY EXCESS & SUBMIT` : "FINALIZE SOURCING ORDER"}</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                      
                      <p className="text-[7px] font-black text-center uppercase tracking-widest opacity-30">
                        Secure B2B Transaction • Real-time Inventory Lock
                      </p>
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
                    <p className="text-[9px] font-black uppercase text-primary truncate">{sessionProfile?.firmName || "Partner"}</p>
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
              <Link href="/login"><Button variant="ghost" className="h-8 px-2 uppercase font-black text-[8px] tracking-widest">Login</Button></Link>
              <Link href="/register"><Button className="h-8 px-3 bg-primary text-background rounded-none uppercase font-black text-[8px] tracking-widest">Registry</Button></Link>
            </div>
          )}
        </div>
      </div>
      
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
