
"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, 
  Loader2, 
  Search,
  Edit,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Phone as PhoneIcon,
  Fingerprint,
  MapPin,
  UserPlus
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { collection, query, orderBy, doc, where, getDocs } from "firebase/firestore";
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signOut, signInAnonymously } from "firebase/auth";
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
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
  "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh"
};

export default function Admin1Page() {
  return (
    <AdminAuthGuard>
      <Admin1Content />
    </AdminAuthGuard>
  );
}

function Admin1Content() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("registrations");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [isAddingRetailer, setIsAddingRetailer] = useState(false);
  const [newRetailer, setNewRetailer] = useState({
    firmName: "",
    phone: "+91",
    gst: "",
    openingBalance: "0",
    creditLimit: "0"
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [user, isUserLoading, auth]);

  const requestsQuery = useMemoFirebase(() => user ? query(collection(db, "PendingRequests"), orderBy("createdAt", "desc")) : null, [db, user]);
  const retailersQuery = useMemoFirebase(() => user ? collection(db, "AuthorizedUsers") : null, [db, user]);
  const paymentsQuery = useMemoFirebase(() => user ? query(collection(db, "Payments"), orderBy("paymentDate", "desc")) : null, [db, user]);
  const ordersQuery = useMemoFirebase(() => user ? collection(db, "Orders") : null, [db, user]);

  const { data: requests, isLoading: loadingRequests } = useCollection(requestsQuery);
  const { data: retailers } = useCollection(retailersQuery);
  const { data: payments, isLoading: loadingPayments } = useCollection(paymentsQuery);
  const { data: allOrders } = useCollection(ordersQuery);

  const filteredRequests = requests?.filter(req => 
    req.firmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.gst?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.phone?.includes(searchTerm)
  );

  const uniqueRetailersForDropdown = useMemo(() => {
    if (!retailers) return [];
    const map = new Map();
    retailers.forEach(r => {
      const key = r.gst || r.firmName || r.id;
      if (!map.has(key) || !r.originalRequestId) {
        map.set(key, r);
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.firmName || "").localeCompare(b.firmName || ""));
  }, [retailers]);

  const getStateFromGST = (gst: string) => {
    if (!gst || gst.length < 2) return "N/A";
    const code = gst.substring(0, 2);
    return GST_STATE_CODES[code] || "Other";
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem("admin_terminal_authorized");
    await signOut(auth);
    toast({ title: "Admin Logged Out" });
    window.location.reload();
  };

  const handleApproveRequest = (req: any) => {
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const reqRef = doc(db, "PendingRequests", req.id);
    const authUserRef = doc(db, "AuthorizedUsers", req.id);

    updateDocumentNonBlocking(reqRef, {
      status: "Approved",
      accessCode: accessCode,
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    });

    setDocumentNonBlocking(authUserRef, {
      id: req.id,
      firmName: req.firmName,
      phone: req.phone,
      gst: req.gst || "",
      accessCode: accessCode,
      openingBalance: parseFloat(req.openingBalance) || 0,
      creditLimit: parseFloat(req.creditLimit) || 0,
      originalRequestId: req.id,
      authorizedAt: new Date().toISOString()
    }, { merge: true });

    toast({ 
      title: "Retailer Approved", 
      description: `Access Code ${accessCode} generated for ${req.firmName}.` 
    });
  };

  const handleSaveEdit = () => {
    if (!editingRequest) return;
    const reqRef = doc(db, "PendingRequests", editingRequest.id);
    const openingBal = parseFloat(editingRequest.openingBalance) || 0;
    const creditLim = parseFloat(editingRequest.creditLimit) || 0;

    const updateData = {
      ...editingRequest,
      openingBalance: openingBal,
      creditLimit: creditLim,
      firmName: editingRequest.firmName,
      phone: editingRequest.phone,
      gst: editingRequest.gst || "",
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(reqRef, updateData, { merge: true });

    const syncProfile = async () => {
      const q = query(collection(db, "AuthorizedUsers"), where("originalRequestId", "==", editingRequest.id));
      const snap = await getDocs(q);
      snap.forEach(d => {
        updateDocumentNonBlocking(doc(db, "AuthorizedUsers", d.id), {
          openingBalance: openingBal,
          creditLimit: creditLim,
          firmName: editingRequest.firmName,
          phone: editingRequest.phone,
          gst: editingRequest.gst || ""
        });
      });
    };
    syncProfile();

    setEditingRequest(null);
    toast({ title: "Profile Updated" });
  };

  const handleAddRetailer = () => {
    if (!newRetailer.firmName || !newRetailer.phone) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Firm Name and Phone are mandatory." });
      return;
    }

    const requestId = crypto.randomUUID();
    const reqRef = doc(db, "PendingRequests", requestId);
    
    const requestData = {
      id: requestId,
      firmName: newRetailer.firmName,
      phone: newRetailer.phone,
      gst: newRetailer.gst || "",
      openingBalance: parseFloat(newRetailer.openingBalance) || 0,
      creditLimit: parseFloat(newRetailer.creditLimit) || 0,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    setDocumentNonBlocking(reqRef, requestData, { merge: true });
    setIsAddingRetailer(false);
    setNewRetailer({ firmName: "", phone: "+91", gst: "", openingBalance: "0", creditLimit: "0" });
    toast({ title: "Retailer Added to Registry", description: "You can now approve this firm to generate an access code." });
  };

  const handleConfirmDelete = () => {
    if (!deleteRequestId) return;
    const reqRef = doc(db, "PendingRequests", deleteRequestId);
    deleteDocumentNonBlocking(reqRef);
    setDeleteRequestId(null);
    toast({ title: "Firm Deleted", description: "The record has been removed from the registry." });
  };

  const handleSavePayment = async () => {
    if (!editingPayment || !editingPayment.userId || !editingPayment.amount) return;
    const paymentId = editingPayment.id || crypto.randomUUID();
    const paymentRef = doc(db, "Payments", paymentId);

    const paymentData = {
      ...editingPayment,
      id: paymentId,
      amount: parseFloat(editingPayment.amount),
      updatedAt: new Date().toISOString(),
      createdAt: editingPayment.createdAt || new Date().toISOString()
    };

    setDocumentNonBlocking(paymentRef, paymentData, { merge: true });
    setEditingPayment(null);
    toast({ title: "Payment Recorded" });
  };

  const handleDeletePayment = (p: any) => {
    if (!confirm("Delete payment?")) return;
    const paymentRef = doc(db, "Payments", p.id);
    updateDocumentNonBlocking(paymentRef, { deleted: true }); 
    toast({ title: "Payment Deleted" });
  };

  const parseAmount = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const calculateCurrentOS = (retailer: any) => {
    if (!allOrders || !payments) return 0;
    const masterId = retailer.id;
    const approvedOrdersTotal = allOrders
      .filter(o => (o.userId === masterId) && o.status === 'Approved')
      .reduce((acc, curr) => acc + parseAmount(curr.totalAmount), 0);
    const paymentsTotal = payments
      .filter(p => p.userId === masterId && !p.deleted)
      .reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
    
    return approvedOrdersTotal - parseAmount(retailer.openingBalance) - paymentsTotal;
  };

  const totals = useMemo(() => {
    if (!filteredRequests) return { creditLimit: 0, outstanding: 0 };
    return filteredRequests.reduce((acc, req) => {
      acc.creditLimit += parseAmount(req.creditLimit);
      acc.outstanding += calculateCurrentOS(req);
      return acc;
    }, { creditLimit: 0, outstanding: 0 });
  }, [filteredRequests, allOrders, payments]);

  const handleDownloadLedger = (retailer: any) => {
    if (!allOrders || !payments) return;
    const masterId = retailer.id;
    const retailerOrders = allOrders.filter(o => o.userId === masterId && o.status === 'Approved');
    const retailerPayments = payments.filter(p => p.userId === masterId && !p.deleted);
    const openingBal = parseAmount(retailer.openingBalance);
    
    const entries = [
      ...retailerOrders.map(o => ({ 
        date: o.createdAt, 
        type: 'Order', 
        amount: -(parseAmount(o.totalAmount)), 
        remarks: `Order #${o.id.slice(0, 8)}` 
      })),
      ...retailerPayments.map(p => ({ 
        date: p.paymentDate, 
        type: 'Payment', 
        amount: parseAmount(p.amount), 
        remarks: p.remarks || 'Direct' 
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentBalance = openingBal;
    const csvRows = [
      ["Date", "Type", "Description", "Amount", "Balance"].join(","), 
      [new Date(retailer.createdAt || new Date()).toLocaleDateString(), "Opening", "Initial Registry Entry", openingBal.toFixed(2), openingBal.toFixed(2)].join(",")
    ];
    
    let totalDebit = openingBal < 0 ? Math.abs(openingBal) : 0;
    let totalCredit = openingBal > 0 ? openingBal : 0;

    entries.forEach(e => { 
      currentBalance += e.amount; 
      if (e.amount < 0) totalDebit += Math.abs(e.amount);
      else totalCredit += e.amount;
      csvRows.push([new Date(e.date).toLocaleDateString(), e.type, `"${e.remarks}"`, e.amount.toFixed(2), currentBalance.toFixed(2)].join(",")); 
    });

    csvRows.push(["", "", "", "", ""].join(","));
    csvRows.push(["SUMMARY", "", "", "", ""].join(","));
    csvRows.push(["TOTAL DEBITS", "", "", totalDebit.toFixed(2), ""].join(","));
    csvRows.push(["TOTAL CREDITS", "", "", totalCredit.toFixed(2), ""].join(","));
    csvRows.push(["FINAL NET O/S", "", "", "", (-currentBalance).toFixed(2)].join(","));

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ledger_${(retailer.firmName || "retailer").replace(/\s+/g, '_')}.csv`;
    link.click();
    toast({ title: "CSV Export Ready" });
  };

  const getRetailerName = (uid: string) => {
    const r = retailers?.find(ret => (ret.id === uid || ret.originalRequestId === uid));
    return r?.firmName || uid.slice(0, 6);
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Syncing Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-primary/10 pb-8 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">Registry</h1>
            <p className="text-accent font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px]">Financial Audit Control</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => setIsAddingRetailer(true)} className="flex-1 md:flex-none h-10 px-6 bg-accent text-white rounded-none uppercase font-black text-[9px] tracking-widest gap-2">
              <UserPlus className="h-4 w-4" /> New Retailer
            </Button>
            <Button variant="ghost" onClick={handleAdminLogout} className="h-10 px-6 border border-destructive/20 text-destructive rounded-none uppercase font-black text-[9px] tracking-widest">
              <ShieldAlert className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-primary p-1 rounded-none h-14 w-full flex overflow-x-auto gap-1 no-scrollbar">
            <TabsTrigger value="registrations" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[10px]">Master Registry</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[10px]">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card className="border-none shadow-xl bg-white rounded-none overflow-hidden">
              <div className="p-4 border-b border-primary/5">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-primary/20" />
                  <input placeholder="SEARCH FIRM, GST OR PHONE..." className="pl-10 w-full h-10 border border-primary/10 focus:outline-none text-[10px] uppercase font-black" value={searchTerm ?? ""} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="border-primary/10">
                      <TableHead className="uppercase font-black text-[10px]">Status</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Firm</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">GST & State</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Phone</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Access Code</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Credit Limit</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Opening Bal.</TableHead>
                      <TableHead className="uppercase font-black text-[10px]">Current O/S</TableHead>
                      <TableHead className="uppercase font-black text-[10px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests?.map((req) => {
                      const currentOS = calculateCurrentOS(req);
                      const stateName = getStateFromGST(req.gst || "");
                      return (
                        <TableRow key={req.id} className="border-primary/5">
                          <TableCell>
                            <Badge className={cn("rounded-none text-[8px] font-black uppercase px-2", 
                              req.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                              {req.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-[10px] uppercase truncate max-w-[120px]">{req.firmName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[9px] uppercase text-accent font-bold tracking-tight">{req.gst || "---"}</span>
                              <span className="text-[8px] opacity-40 font-black flex items-center gap-1 uppercase">
                                <MapPin className="h-2 w-2" /> {stateName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] font-bold">{req.phone}</TableCell>
                          <TableCell className="font-mono text-[10px] font-black text-primary">
                            {req.accessCode ? (
                              <div className="flex items-center gap-1">
                                <Fingerprint className="h-3 w-3 text-accent" /> {req.accessCode}
                              </div>
                            ) : "---"}
                          </TableCell>
                          <TableCell className="font-black text-[10px] text-primary">₹{parseAmount(req.creditLimit).toLocaleString()}</TableCell>
                          <TableCell className={cn("font-black text-[10px]", parseAmount(req.openingBalance) < 0 ? "text-red-600" : "text-accent")}>₹{parseAmount(req.openingBalance).toLocaleString()}</TableCell>
                          <TableCell className={cn("font-black text-[10px]", currentOS > 0 ? "text-red-600" : "text-green-600")}>₹{currentOS.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {req.status !== 'Approved' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleApproveRequest(req)} 
                                  className="p-1 text-green-600 hover:bg-green-50"
                                  title="Approve & Generate Code"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setEditingRequest(req)} className="p-1"><Edit className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadLedger(req)} className="p-1 text-accent"><FileSpreadsheet className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteRequestId(req.id)} className="p-1 text-destructive hover:bg-destructive/5"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="text-[10px] font-black uppercase text-right py-6">Registry Totals</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">₹{totals.creditLimit.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className={cn("font-black text-[10px]", totals.outstanding > 0 ? "text-red-600" : "text-green-600")}>₹{totals.outstanding.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-primary/5">
              <Button onClick={() => setEditingPayment({ userId: "", amount: 0, paymentDate: new Date().toISOString().slice(0, 16), remarks: "" })} className="w-full sm:w-auto bg-primary text-background rounded-none uppercase font-black text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> Log Payment
              </Button>
            </div>
            <Card className="border-none shadow-xl bg-white rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px]">Date</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Retailer</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Amount</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Del</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse uppercase font-black text-[10px]">Syncing...</TableCell></TableRow>
                    ) : payments?.filter(p => !p.deleted).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-[10px] font-bold">{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-[10px] font-black uppercase text-accent truncate max-w-[100px]">{getRetailerName(p.userId)}</TableCell>
                        <TableCell className="text-[10px] font-black text-green-600">₹{parseAmount(p.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeletePayment(p)} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isAddingRetailer} onOpenChange={setIsAddingRetailer}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-none bg-background p-6">
          <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black uppercase">Manual Addition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase">Firm Name *</Label>
              <Input value={newRetailer.firmName} onChange={(e) => setNewRetailer({...newRetailer, firmName: e.target.value})} className="rounded-none h-10 font-bold" placeholder="RETAILER NAME" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase">Phone *</Label>
              <Input value={newRetailer.phone} onChange={(e) => setNewRetailer({...newRetailer, phone: e.target.value})} className="rounded-none h-10 font-bold" placeholder="+91 00000 00000" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase">GST (Optional)</Label>
              <Input value={newRetailer.gst} onChange={(e) => setNewRetailer({...newRetailer, gst: e.target.value.toUpperCase()})} className="rounded-none h-10 font-bold uppercase" placeholder="GST IDENTIFIER" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">Opening Bal.</Label>
                <Input type="number" value={newRetailer.openingBalance} onChange={(e) => setNewRetailer({...newRetailer, openingBalance: e.target.value})} className="rounded-none h-10 font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">Limit (INR)</Label>
                <Input type="number" value={newRetailer.creditLimit} onChange={(e) => setNewRetailer({...newRetailer, creditLimit: e.target.value})} className="rounded-none h-10 font-bold" />
              </div>
            </div>
            <Button onClick={handleAddRetailer} className="w-full h-12 bg-primary text-background rounded-none uppercase font-black text-[10px] mt-2">Initialize Retailer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRequest} onOpenChange={() => setEditingRequest(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-none bg-background p-6">
          <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black uppercase">Registry Edit</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Firm Name</Label>
              <Input value={editingRequest?.firmName ?? ""} onChange={(e) => setEditingRequest({...editingRequest, firmName: e.target.value})} className="rounded-none h-12 font-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Phone Number</Label>
              <Input value={editingRequest?.phone ?? ""} onChange={(e) => setEditingRequest({...editingRequest, phone: e.target.value})} className="rounded-none h-12 font-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">GST Identifier</Label>
              <Input value={editingRequest?.gst ?? ""} onChange={(e) => setEditingRequest({...editingRequest, gst: e.target.value.toUpperCase()})} className="rounded-none h-12 font-black uppercase" />
              {editingRequest?.gst && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-accent mt-1">
                  <MapPin className="h-3 w-3" /> State: {getStateFromGST(editingRequest.gst)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Opening Bal.</Label>
                <Input type="number" value={editingRequest?.openingBalance ?? 0} onChange={(e) => setEditingRequest({...editingRequest, openingBalance: e.target.value})} className="rounded-none h-12 font-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Limit (INR)</Label>
                <Input type="number" value={editingRequest?.creditLimit ?? 0} onChange={(e) => setEditingRequest({...editingRequest, creditLimit: e.target.value})} className="rounded-none h-12 font-black" />
              </div>
            </div>
            <Button onClick={handleSaveEdit} className="w-full h-14 bg-primary text-background rounded-none uppercase font-black text-[10px]">Sync Registry</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-none bg-background p-6">
          <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black uppercase">Payment Entry</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <select className="w-full h-12 border border-primary/10 bg-transparent px-3 text-[10px] font-black uppercase" value={editingPayment?.userId ?? ""} onChange={(e) => setEditingPayment({...editingPayment, userId: e.target.value})}>
              <option value="">Select Firm...</option>
              {uniqueRetailersForDropdown.map(r => (<option key={r.id} value={r.id}>{r.firmName}</option>))}
            </select>
            <Input type="datetime-local" value={editingPayment?.paymentDate?.slice(0, 16) ?? ""} onChange={(e) => setEditingPayment({...editingPayment, paymentDate: e.target.value})} className="h-12 font-bold text-[10px]" />
            <Input type="number" placeholder="Amount" value={editingPayment?.amount ?? 0} onChange={(e) => setEditingPayment({...editingPayment, amount: e.target.value})} className="h-12 font-black text-green-600" />
            <Input placeholder="Remarks" value={editingPayment?.remarks ?? ""} onChange={(e) => setEditingPayment({...editingPayment, remarks: e.target.value})} className="h-12 text-[10px]" />
            <Button onClick={handleSavePayment} className="w-full h-14 bg-primary text-background rounded-none uppercase font-black text-[10px]">Finalize Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRequestId} onOpenChange={(open) => !open && setDeleteRequestId(null)}>
        <AlertDialogContent className="rounded-none border-none">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="uppercase font-black tracking-tighter text-xl">Confirm Deletion</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[11px] font-medium uppercase tracking-widest leading-relaxed">
              Are you absolutely sure? This action will permanently remove this firm from the Master Registry. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-none uppercase font-black text-[10px] tracking-widest h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-black text-[10px] tracking-widest h-12">
              Delete Firm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
