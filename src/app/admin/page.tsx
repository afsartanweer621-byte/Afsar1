
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { 
  Package, 
  Loader2,
  Edit,
  Trash2,
  ShieldAlert,
  Upload,
  Plus,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  AlertTriangle,
  FileUp,
  Download,
  FileText,
  Search,
  Eraser,
  Send,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { collection, doc, query, orderBy, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { FALLBACK_PRODUCTS } from "@/lib/fallback-products";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminContent />
    </AdminAuthGuard>
  );
}

function AdminContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const bulkUploadRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("orders");
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Notification State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("Update");

  // Data Fetch
  const productsQuery = useMemoFirebase(() => 
    user ? collection(db, "Products") : null, 
  [db, user]);
  
  const ordersQuery = useMemoFirebase(() => 
    user ? query(collection(db, "Orders"), orderBy("createdAt", "desc")) : null, 
  [db, user]);

  const retailersQuery = useMemoFirebase(() => 
    user ? collection(db, "AuthorizedUsers") : null, 
  [db, user]);

  const notificationsQuery = useMemoFirebase(() => 
    user ? query(collection(db, "Notifications"), orderBy("createdAt", "desc")) : null, 
  [db, user]);

  const { data: firestoreProducts, isLoading: loadingProducts } = useCollection(productsQuery);
  const { data: rawOrders, isLoading: loadingOrders } = useCollection(ordersQuery);
  const { data: retailers } = useCollection(retailersQuery);
  const { data: notifications } = useCollection(notificationsQuery);

  const mergedProducts = useMemo(() => {
    const base = [...FALLBACK_PRODUCTS];
    if (!firestoreProducts) return base.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const firestoreMap = new Map(firestoreProducts.map(p => [p.id, p]));
    
    // PERFORM PROPERTY-LEVEL MERGE WITH DELTA LOGIC
    const merged = base.map(p => {
      const fsProduct = firestoreMap.get(p.id);
      if (!fsProduct) return p;
      
      // If fsProduct has a name, it's a full manual override (absolute value)
      if (fsProduct.name) {
        return { ...p, ...fsProduct };
      }
      
      // If fsProduct exists but has no name, it was created by an atomic increment/decrement (delta)
      return { 
        ...p, 
        ...fsProduct, 
        stockQuantity: (p.stockQuantity || 0) + (fsProduct.stockQuantity || 0) 
      };
    });
    
    const fallbackIds = new Set(base.map(p => p.id));
    firestoreProducts.forEach(p => {
      if (!fallbackIds.has(p.id)) {
        merged.push(p);
      }
    });
    
    return merged
      .filter(p => !p.deleted)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [firestoreProducts]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return mergedProducts;
    const lowerSearch = productSearch.toLowerCase();
    return mergedProducts.filter(p => 
      (p.id?.toLowerCase() || "").includes(lowerSearch) ||
      (p.name?.toLowerCase() || "").includes(lowerSearch) ||
      (p.category?.toLowerCase() || "").includes(lowerSearch)
    );
  }, [mergedProducts, productSearch]);

  const getRetailerName = (userId: string) => {
    const retailer = retailers?.find(r => r.id === userId || r.originalRequestId === userId);
    return retailer?.firmName || userId?.slice(0, 8) || 'Unknown';
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem("admin_terminal_authorized");
    await signOut(auth);
    toast({ title: "Admin Logged Out" });
    window.location.reload();
  };

  const handleApproveOrder = (order: any) => {
    if (!order || !order.id) return;
    const orderRef = doc(db, "Orders", order.id);
    
    // 1. Update Order Status & Financials
    updateDocumentNonBlocking(orderRef, {
      status: "Approved",
      items: order.items,
      totalAmount: order.totalAmount,
      updatedAt: new Date().toISOString()
    });

    // 2. Sync Inventory (Reduce Stock)
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.id) {
          const productRef = doc(db, "Products", item.id);
          const qtyToReduce = Math.abs(parseInt(String(item.quantity)) || 0);
          if (qtyToReduce > 0) {
            setDocumentNonBlocking(productRef, {
              stockQuantity: increment(-qtyToReduce)
            }, { merge: true });
          }
        }
      });
    }

    toast({ 
      title: "Order Approved & Stock Synced", 
      description: `Order #${order.id.slice(0,8)} finalized. Inventory levels adjusted.` 
    });
  };

  const handleCancelOrder = (order: any) => {
    if (!order || !order.id) return;
    const wasApproved = order.status === "Approved";
    
    const orderRef = doc(db, "Orders", order.id);
    
    // 1. Update Status to Cancelled
    updateDocumentNonBlocking(orderRef, {
      status: "Cancelled",
      updatedAt: new Date().toISOString()
    });

    // 2. Reverse Stock IF it was already Approved (and thus decremented)
    if (wasApproved && order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.id) {
          const productRef = doc(db, "Products", item.id);
          const qtyToRestore = Math.abs(parseInt(String(item.quantity)) || 0);
          if (qtyToRestore > 0) {
            setDocumentNonBlocking(productRef, {
              stockQuantity: increment(qtyToRestore)
            }, { merge: true });
          }
        }
      });
      toast({ 
        title: "Order Rejected & Stock Reversed", 
        description: `Order #${order.id.slice(0,8)} cancelled. Inventory levels restored.` 
      });
    } else {
      toast({ title: "Order Cancelled", description: `Order #${order.id.slice(0,8)} has been rejected.` });
    }
  };

  const handleDeleteOrder = (order: any) => {
    if (!order || !order.id) return;
    const wasApproved = order.status === "Approved";
    
    // 1. Reverse Stock IF it was Approved
    if (wasApproved && order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.id) {
          const productRef = doc(db, "Products", item.id);
          const qtyToRestore = Math.abs(parseInt(String(item.quantity)) || 0);
          if (qtyToRestore > 0) {
            setDocumentNonBlocking(productRef, {
              stockQuantity: increment(qtyToRestore)
            }, { merge: true });
          }
        }
      });
    }

    // 2. Purge order from registry
    deleteDocumentNonBlocking(doc(db, "Orders", order.id));
    setOrderToDelete(null);
    toast({ 
      title: "Order Purged", 
      description: `Order #${order.id.slice(0,8)} removed and inventory synced.` 
    });
  };

  const handleSendNotification = () => {
    if (!notifTitle || !notifMessage) {
      toast({ variant: "destructive", title: "Missing Data" });
      return;
    }

    const notifRef = doc(collection(db, "Notifications"));
    setDocumentNonBlocking(notifRef, {
      id: notifRef.id,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      createdAt: new Date().toISOString()
    }, { merge: true });

    setNotifTitle("");
    setNotifMessage("");
    toast({ title: "Notification Broadcasted" });
  };

  const handleDeleteNotification = (id: string) => {
    const notifRef = doc(db, "Notifications", id);
    deleteDocumentNonBlocking(notifRef);
    toast({ title: "Notification Removed" });
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    const mrp = parseFloat(editingProduct.mrp) || 0;
    const margin = parseFloat(editingProduct.margin) || 0;
    const calculatedPrice = mrp * (1 - (margin / 100));

    const productRef = doc(db, "Products", editingProduct.id);
    const payload = {
      ...editingProduct,
      price: calculatedPrice,
      mrp: mrp,
      margin: margin,
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(productRef, payload, { merge: true });
    setEditingProduct(null);
    toast({ title: "Inventory Updated" });
  };

  const handleAddNewProduct = () => {
    setEditingProduct({
      id: "",
      name: "",
      category: "",
      stockQuantity: 0,
      mrp: 0,
      margin: 38,
      price: 0,
      hsn: "6403",
      imageUrls: ["", "", ""],
      deleted: false,
      displayOrder: mergedProducts.length + 1
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newUrls = [...(editingProduct.imageUrls || ["", "", ""])];
        newUrls[index] = event.target?.result as string;
        setEditingProduct({ ...editingProduct, imageUrls: newUrls });
        toast({ title: "Image Prepared" });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = [...(editingProduct.imageUrls || ["", "", ""])];
    newUrls[index] = "";
    setEditingProduct({ ...editingProduct, imageUrls: newUrls });
  };

  const handleBulkUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) {
        setIsBulkProcessing(false);
        toast({ variant: "destructive", title: "Invalid File" });
        return;
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const [id, name, category, qty, mrp, margin] = values;
        if (!id) continue;

        const productRef = doc(db, "Products", id);
        const mrpValue = parseFloat(mrp) || 0;
        const marginValue = parseFloat(margin) || 38;
        
        await setDoc(productRef, {
          id,
          name: name || id,
          category: category || "General",
          stockQuantity: parseInt(qty) || 0,
          mrp: mrpValue,
          margin: marginValue,
          price: mrpValue * (1 - (marginValue / 100)),
          hsn: "6403",
          deleted: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        count++;
      }

      setIsBulkProcessing(false);
      toast({ title: "Bulk Upload Finished", description: `Updated ${count} articles.` });
      if (bulkUploadRef.current) bulkUploadRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleUpdateOrderItem = (idx: number, field: string, value: string) => {
    if (!editingOrder) return;
    
    const newItems = [...editingOrder.items];
    const item = { ...newItems[idx] };
    
    if (field === 'quantity') {
      item.quantity = parseInt(value) || 0;
    } else if (field === 'margin') {
      const marginVal = parseFloat(value) || 0;
      item.margin = marginVal;
      const mrp = item.mrp || item.price / (1 - (item.margin / 100)); 
      item.price = mrp * (1 - (marginVal / 100));
    }
    
    newItems[idx] = item;
    const newTotal = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    setEditingOrder({
      ...editingOrder,
      items: newItems,
      totalAmount: newTotal
    });
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-primary/10 pb-8 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">Management</h1>
            <p className="text-accent font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px]">Control Terminal</p>
          </div>
          <Button variant="ghost" onClick={handleAdminLogout} className="text-[9px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 gap-2 h-10 px-6 border border-destructive/20 rounded-none">
            <ShieldAlert className="h-3 w-3" /> Logout
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-primary p-1 rounded-none h-14 w-full flex overflow-x-auto gap-1 no-scrollbar">
            <TabsTrigger value="orders" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[10px] tracking-widest">Orders</TabsTrigger>
            <TabsTrigger value="products" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[10px] tracking-widest">Inventory</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[10px] tracking-widest">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px]">Date</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Firm Name</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Items</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Total</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Status</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOrders ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse uppercase font-black text-[10px]">Fetching Orders...</TableCell></TableRow>
                    ) : rawOrders?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 uppercase font-black text-[10px] opacity-20">No Orders in Registry</TableCell></TableRow>
                    ) : rawOrders?.map((order) => (
                      <TableRow key={order.id} className="border-primary/5">
                        <TableCell className="font-bold text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-black text-[10px] uppercase text-accent">{getRetailerName(order.userId)}</TableCell>
                        <TableCell className="text-[10px] font-bold">{order.items?.length || 0} SKU</TableCell>
                        <TableCell className="font-black text-[10px]">₹{order.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-none text-[8px] font-black uppercase", 
                              order.status === 'Approved' ? "bg-green-100 text-green-700" : 
                              order.status === 'Cancelled' ? "bg-red-100 text-red-700" : 
                              "bg-amber-100 text-amber-700")}>
                              {order.status}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setOrderToDelete(order)}
                              className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/5 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {order.status === 'Processing' && (
                              <Button size="sm" onClick={() => handleApproveOrder(order)} className="h-8 bg-green-600 text-white rounded-none uppercase font-black text-[8px] px-3">Approve</Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setEditingOrder(order)} className="p-1 h-8 w-8 hover:bg-accent/10 border border-primary/5 rounded-none flex items-center justify-center">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 border border-primary/5 gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-3 w-3 text-primary/30" />
                <Input placeholder="SEARCH ARTICLE..." className="pl-9 rounded-none h-10 text-[10px] uppercase font-bold" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button onClick={() => bulkUploadRef.current?.click()} variant="outline" className="flex-1 sm:flex-none h-10 rounded-none border-primary font-black text-[9px] uppercase tracking-widest gap-2">
                  <FileUp className="h-4 w-4" /> Bulk Upload
                </Button>
                <input type="file" ref={bulkUploadRef} className="hidden" accept=".csv" onChange={handleBulkUploadCSV} />
                <Button onClick={handleAddNewProduct} className="flex-1 sm:flex-none bg-primary text-background h-10 rounded-none uppercase font-black text-[9px] tracking-widest gap-2">
                  <Plus className="h-4 w-4" /> New Article
                </Button>
              </div>
            </div>
            
            <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead></TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">ID/Name</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Stock</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">W/S Price</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 uppercase font-black text-[10px] animate-pulse">Syncing Inventory...</TableCell></TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 uppercase font-black text-[10px] opacity-20">No matching articles</TableCell></TableRow>
                    ) : filteredProducts.map((p) => (
                      <TableRow key={p.id} className="border-primary/5">
                        <TableCell>
                          <div className="relative h-8 w-8 bg-primary/5">
                            {(p.imageUrls?.[0] || p.imageUrl) && <Image src={p.imageUrls?.[0] || p.imageUrl} alt="" fill className="object-cover" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[10px] uppercase">
                          <div className="font-black text-accent">{p.id}</div>
                          <div className="opacity-60 truncate max-w-[150px]">{p.name}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">{p.stockQuantity}</TableCell>
                        <TableCell className="font-black text-[10px]">₹{p.price?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(p)} className="p-1"><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setProductToDelete(p.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-8">
            <Card className="rounded-none border-none shadow-xl p-8 bg-white">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl font-black uppercase">Broadcast Console</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Alert Title</Label>
                    <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="rounded-none h-12 text-[11px] font-bold" placeholder="E.G. NEW ARRIVAL: PRADO HILL" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Alert Type</Label>
                    <Select value={notifType} onValueChange={setNotifType}>
                      <SelectTrigger className="rounded-none h-12 text-[11px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Update">Update</SelectItem>
                        <SelectItem value="Alert">Alert</SelectItem>
                        <SelectItem value="Promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Message</Label>
                    <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} className="rounded-none min-h-[120px] text-[11px] font-medium" placeholder="BROADCAST CONTENT..." />
                  </div>
                  <Button onClick={handleSendNotification} className="w-full h-14 bg-primary text-background rounded-none uppercase font-black text-[11px] tracking-widest gap-2">
                    <Send className="h-4 w-4" /> Send Broadcast
                  </Button>
                </div>

                <div className="space-y-4 border-l border-primary/5 pl-8">
                  <Label className="text-[10px] font-black uppercase opacity-40">Sent History</Label>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {notifications?.map((n) => (
                        <div key={n.id} className="p-4 bg-primary/5 border border-primary/5 flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-none text-[7px] uppercase font-black">{n.type}</Badge>
                              <span className="text-[10px] font-black uppercase">{n.title}</span>
                            </div>
                            <p className="text-[9px] opacity-60 line-clamp-2">{n.message}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(n.id)} className="h-6 w-6 text-destructive shrink-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-xl max-h-[90vh] overflow-y-auto rounded-none p-0 bg-background">
          <DialogHeader className="p-6 border-b border-primary/5">
            <DialogTitle className="text-xl font-black uppercase">Article Entry</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[9px] font-black uppercase opacity-40">Product Media</Label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative group aspect-square bg-primary/5 border border-dashed border-primary/20 flex items-center justify-center cursor-pointer">
                    {editingProduct?.imageUrls?.[idx] ? (
                      <Image src={editingProduct.imageUrls[idx]} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-20" onClick={() => fileInputRefs[idx].current?.click()}>
                        <Upload className="h-5 w-5" />
                        <span className="text-[7px] font-black uppercase">Slot {idx + 1}</span>
                      </div>
                    )}
                    {editingProduct?.imageUrls?.[idx] && (
                      <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full"><X className="h-3 w-3" /></button>
                    )}
                    <input type="file" ref={fileInputRefs[idx]} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, idx)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="ID" value={editingProduct?.id} onChange={(e) => setEditingProduct({...editingProduct, id: e.target.value})} className="rounded-none" />
              <Input placeholder="NAME" value={editingProduct?.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="rounded-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input type="number" placeholder="MRP" value={editingProduct?.mrp} onChange={(e) => setEditingProduct({...editingProduct, mrp: e.target.value})} className="rounded-none" />
              <Input type="number" placeholder="MARGIN %" value={editingProduct?.margin} onChange={(e) => setEditingProduct({...editingProduct, margin: e.target.value})} className="rounded-none" />
              <Input type="number" placeholder="STOCK" value={editingProduct?.stockQuantity} onChange={(e) => setEditingProduct({...editingProduct, stockQuantity: e.target.value})} className="rounded-none" />
            </div>
            <Button onClick={handleSaveProduct} className="w-full h-14 bg-primary text-background rounded-none uppercase font-black text-[10px]">Save Article</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog (Interactive Review) */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl rounded-none p-8 bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black uppercase">Order Review & Edit</DialogTitle>
            <div className="flex justify-between items-center mt-2">
              <div className="text-[10px] font-black uppercase text-accent">Order ID: #{editingOrder?.id?.slice(0,12)}</div>
              <Badge className="rounded-none bg-primary/5 text-primary uppercase font-black text-[9px]">{editingOrder?.status}</Badge>
            </div>
          </DialogHeader>
          <div className="space-y-6">
            <div className="border border-primary/5">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="uppercase font-black text-[10px]">Article</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">MRP</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">Margin %</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">W/S Price</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">Qty</TableHead>
                    <TableHead className="uppercase font-black text-[10px] text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editingOrder?.items?.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-[10px] font-black uppercase">
                        {item.name}
                        <div className="text-[8px] opacity-40 font-normal">SKU: {item.id}</div>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold">₹{item.mrp || (item.price / (1 - (item.margin / 100))).toFixed(0)}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.margin} 
                          onChange={(e) => handleUpdateOrderItem(i, 'margin', e.target.value)}
                          className="h-8 w-20 rounded-none text-[10px] font-black text-accent"
                          disabled={editingOrder.status !== 'Processing'}
                        />
                      </TableCell>
                      <TableCell className="text-[10px] font-bold">₹{item.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleUpdateOrderItem(i, 'quantity', e.target.value)}
                          className="h-8 w-20 rounded-none text-[10px] font-black"
                          disabled={editingOrder.status !== 'Processing'}
                        />
                      </TableCell>
                      <TableCell className="text-right text-[10px] font-black">₹{(item.price * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5">
                    <TableCell colSpan={5} className="text-right text-[10px] font-black uppercase py-6">Order Total (Adjusted)</TableCell>
                    <TableCell className="text-right text-xl font-black">₹{editingOrder?.totalAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              {editingOrder?.status === 'Processing' && (
                <Button 
                  onClick={() => { handleApproveOrder(editingOrder); setEditingOrder(null); }} 
                  className="flex-1 h-14 bg-green-600 text-white rounded-none uppercase font-black text-[11px] tracking-widest"
                >
                  Approve with Edits
                </Button>
              )}
              {editingOrder?.status !== 'Cancelled' && (
                <Button 
                  onClick={() => { 
                    const wasApproved = editingOrder.status === "Approved";
                    if (wasApproved) {
                      const confirmed = window.confirm("WARNING: This order is already APPROVED. Rejection will automatically REVERSE the stock decrement. Proceed?");
                      if (!confirmed) return;
                    }
                    handleCancelOrder(editingOrder); 
                    setEditingOrder(null); 
                  }} 
                  variant="destructive" 
                  className="flex-1 h-14 rounded-none uppercase font-black text-[11px] tracking-widest gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Reject & Reverse Stock
                </Button>
              )}
            </div>
            
            <div className="p-4 bg-secondary/5 border-l-4 border-accent">
              <p className="text-[10px] font-black uppercase text-accent mb-1">Stock Integrity Protocol</p>
              <p className="text-[9px] opacity-60 font-medium uppercase leading-relaxed">
                Rejecting an approved order will automatically return all units to active inventory using atomic increments. 
                Applying edits will sync with the retailer's outstanding balance immediately.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Delete Alert */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-none border-none">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="uppercase font-black tracking-tighter text-xl">Confirm Deletion</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[11px] font-medium uppercase tracking-widest leading-relaxed">
              Are you absolutely sure? This action will permanently remove this article from the Registry. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-none uppercase font-black text-[10px] tracking-widest h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (productToDelete) {
                deleteDocumentNonBlocking(doc(db, "Products", productToDelete));
                setProductToDelete(null);
                toast({ title: "Article Deleted" });
              }
            }} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-black text-[10px] tracking-widest h-12">
              Delete Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Delete Alert */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-none border-none">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="uppercase font-black tracking-tighter text-xl">Purge Order</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[11px] font-medium uppercase tracking-widest leading-relaxed">
              Deleting this order will permanently remove it from the registry. 
              {orderToDelete?.status === 'Approved' && (
                <span className="block mt-2 font-bold text-accent">
                  CRITICAL: Since this order was APPROVED, all items will be AUTOMATICALLY REVERSED back to your active inventory.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-none uppercase font-black text-[10px] tracking-widest h-12">Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteOrder(orderToDelete)} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-black text-[10px] tracking-widest h-12">
              Delete & Sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

