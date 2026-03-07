
"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Download,
  Clock,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionProfileRef = useMemoFirebase(() => user ? doc(db, "AuthorizedUsers", user.uid) : null, [db, user]);
  const { data: sessionProfile, isLoading: isSessionLoading } = useDoc(sessionProfileRef);

  const masterId = sessionProfile?.originalRequestId || user?.uid;

  const masterProfileRef = useMemoFirebase(() => masterId ? doc(db, "PendingRequests", masterId) : null, [db, masterId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(masterProfileRef);

  const ordersQuery = useMemoFirebase(() => masterId ? query(collection(db, "Orders"), where("userId", "==", masterId)) : null, [db, masterId]);
  const paymentsQuery = useMemoFirebase(() => masterId ? query(collection(db, "Payments"), where("userId", "==", masterId)) : null, [db, masterId]);

  const { data: rawOrders } = useCollection(ordersQuery);
  const { data: rawPayments } = useCollection(paymentsQuery);

  const parseAmount = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const sortedOrders = useMemo(() => rawOrders ? [...rawOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [], [rawOrders]);
  const sortedPayments = useMemo(() => rawPayments ? [...rawPayments].filter(p => !p.deleted).sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()) : [], [rawPayments]);

  const ledgerItems = useMemo(() => {
    const items = [
      ...sortedOrders.map(o => ({
        id: o.id,
        date: o.createdAt,
        description: `Order #${o.id.slice(0, 8)}`,
        type: 'Debit',
        amount: parseAmount(o.totalAmount),
        status: o.status,
        raw: o
      })),
      ...sortedPayments.map(p => ({
        id: p.id,
        date: p.paymentDate,
        description: p.remarks || "Direct Payment Record",
        type: 'Credit',
        amount: parseAmount(p.amount),
        status: 'Processed',
        raw: p
      }))
    ];
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sortedOrders, sortedPayments]);

  const openingBalance = profile ? parseAmount(profile.openingBalance) : 0;
  
  const approvedOrdersTotal = sortedOrders
    ?.filter(o => o.status === 'Approved')
    .reduce((acc, curr) => acc + parseAmount(curr.totalAmount), 0) || 0;
    
  const paymentsTotal = sortedPayments
    ?.reduce((acc, curr) => acc + parseAmount(curr.amount), 0) || 0;
  
  const totalDebits = approvedOrdersTotal + (openingBalance < 0 ? Math.abs(openingBalance) : 0);
  const totalCredits = paymentsTotal + (openingBalance > 0 ? openingBalance : 0);
  const currentOutstanding = totalDebits - totalCredits;

  const utilizationPercent = Math.min(100, (Math.max(0, currentOutstanding) / (profile?.creditLimit || 1)) * 100);

  const handleDownloadInvoice = (order: any) => {
    if (!profile) return;
    const doc = new jsPDF();
    const firmName = profile.firmName || "Verified Retailer";
    const gstNo = profile.gst || "N/A";
    const isInterState = !gstNo.startsWith("20");

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ZEON CORPORATION", 105, 15, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Mahendra Arcade LGF 1 and LGF 2, opp kashmir Vastralaya, Main Road, Ranchi", 105, 22, { align: "center" });
    doc.text("Ranchi, Jharkhand, 834001", 105, 27, { align: "center" });
    doc.text("GSTIN: 20AYOPT9324L1ZV", 105, 32, { align: "center" });
    
    doc.setDrawColor(0);
    doc.line(20, 36, 190, 36);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice To:", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text(firmName, 20, 60);
    doc.text(`GST: ${gstNo}`, 20, 65);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 190, 55, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 190, 60, { align: "right" });
    doc.text("HSN: 6403", 190, 65, { align: "right" });

    const tableData = order.items.map((item: any) => {
      const itemTotal = parseAmount(item.price) * (item.quantity || 1);
      const taxableValue = itemTotal / 1.05;
      const gstAmount = itemTotal - taxableValue;
      
      return [
        item.name,
        "6403",
        item.quantity || 1,
        (taxableValue / (item.quantity || 1)).toFixed(2),
        taxableValue.toFixed(2),
        "5%",
        gstAmount.toFixed(2),
        itemTotal.toFixed(2)
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [["Description", "HSN", "Qty", "Rate", "Taxable", "GST%", "GST Amt", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      styles: { fontSize: 8 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    const grandTotal = parseAmount(order.totalAmount);
    const totalTaxable = grandTotal / 1.05;
    const totalTax = grandTotal - totalTaxable;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Taxable Value: INR ${totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 10, { align: "right" });
    
    if (isInterState) {
      doc.text(`IGST (5%): INR ${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 15, { align: "right" });
    } else {
      doc.text(`CGST (2.5%): INR ${(totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 15, { align: "right" });
      doc.text(`SGST (2.5%): INR ${(totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 20, { align: "right" });
    }

    doc.setFontSize(12);
    doc.text(`GRAND TOTAL (INCL. GST): INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 30, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Terms & Conditions:", 20, finalY + 45);
    doc.text("1. Goods once sold will not be taken back.", 20, finalY + 50);
    doc.text("2. 5% GST included as per HSN 6403 Footwear norms.", 20, finalY + 55);

    doc.text("Authorized Signatory for ZEON CORPORATION", 190, finalY + 70, { align: "right" });

    doc.save(`Invoice_${order.id.slice(0, 8)}.pdf`);
  };

  const handleDownloadPDF = () => {
    if (!profile) return;
    const doc = new jsPDF();
    const firmName = profile.firmName || "Verified Retailer";

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ZEON CORPORATION", 105, 15, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Mahendra Arcade LGF 1 and LGF 2, opp kashmir Vastralaya, Main Road, Ranchi", 105, 22, { align: "center" });
    doc.text("Ranchi, Jharkhand, 834001", 105, 27, { align: "center" });
    doc.text("GSTIN: 20AYOPT9324L1ZV", 105, 32, { align: "center" });
    
    doc.setDrawColor(0);
    doc.line(20, 36, 190, 36);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Account Statement", 105, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Bill To: ${firmName}`, 20, 55);
    doc.text(`GST: ${profile.gst || "N/A"}`, 20, 60);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 190, 55, { align: "right" });

    doc.setDrawColor(230);
    doc.setFillColor(249, 249, 249);
    doc.rect(20, 68, 170, 25, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL SUMMARY", 25, 75);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Debits: INR ${totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 25, 82);
    doc.text(`Total Credits: INR ${totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 25, 88);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(currentOutstanding > 0 ? 180 : 0, 0, 0); 
    doc.text(`Net Outstanding: INR ${currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 185, 82, { align: "right" });
    doc.setTextColor(0, 0, 0);

    const tableData = [
      [
        "Initialization", 
        "Opening Registry Entry", 
        openingBalance >= 0 ? "CREDIT" : "DEBIT", 
        openingBalance < 0 ? `-${Math.abs(openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `+${openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ],
      ...ledgerItems.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.description,
        item.type.toUpperCase(),
        item.type === 'Debit' 
          ? `-${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
          : `+${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ])
    ];

    autoTable(doc, {
      startY: 100,
      head: [["Date", "Description", "Type", "Amount (INR)"]],
      body: tableData,
      foot: [
        ["", "TOTAL DEBITS", "", totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
        ["", "TOTAL CREDITS", "", totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
        ["", "NET OUTSTANDING BALANCE", "", currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })]
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8 }
    });

    doc.save(`statement_${firmName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadOrdersCSV = () => {
    if (!sortedOrders || sortedOrders.length === 0) return;
    
    const headers = ["Order ID", "Date", "Items Count", "Status", "Total Amount (INR)"];
    const rows = sortedOrders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleDateString(),
      order.items.length,
      order.status,
      parseAmount(order.totalAmount).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Orders_History_${profile?.firmName?.replace(/\s+/g, '_') || 'Retailer'}.csv`;
    link.click();
    
    toast({
      title: "CSV Export Complete",
      description: "Your order history has been downloaded.",
    });
  };

  if (!mounted || isSessionLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Clock className="h-12 w-12 animate-pulse text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Synchronizing Master Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Retailer Hub</h1>
            <div className="flex items-center gap-4 text-accent font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px]">
              <User className="h-4 w-4" /> <span>{profile?.firmName || "Verified Retailer"} Registry</span>
            </div>
          </div>
          <Button onClick={handleDownloadPDF} className="w-full md:w-auto bg-primary text-background rounded-none h-14 px-8 uppercase font-black text-[10px] tracking-widest gap-2">
            <Download className="h-4 w-4" /> Download Statement
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 md:space-y-12">
          <TabsList className="bg-primary p-1 rounded-none h-14 w-full flex overflow-x-auto gap-1 no-scrollbar">
            <TabsTrigger value="overview" className="flex-1 md:flex-none rounded-none px-6 md:px-8 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] md:text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="ledger" className="flex-1 md:flex-none rounded-none px-6 md:px-8 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] md:text-[10px]">Statement</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 md:flex-none rounded-none px-6 md:px-8 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] md:text-[10px]">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="md:col-span-2 bg-primary text-background rounded-none border-none p-6 md:p-10 flex flex-col justify-between">
              <CardHeader className="p-0 mb-6 md:mb-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Net Current Outstanding (O/S)</CardTitle>
              </CardHeader>
              <div className="text-3xl md:text-6xl font-black break-all py-2">₹{formatCurrency(currentOutstanding)}</div>
              <div className="mt-8 md:mt-12 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Credit Utilization</span>
                  <span>₹{profile?.creditLimit?.toLocaleString('en-IN') || "0"} Limit</span>
                </div>
                <div className="h-3 bg-white/10 w-full"><div className="h-full bg-accent" style={{ width: `${utilizationPercent}%` }} /></div>
              </div>
            </Card>
            
            <Card className="md:col-span-1 rounded-none border-primary/10 p-6 md:p-10 flex flex-col justify-center gap-10">
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase opacity-40">Total Procurement (Debits)</div>
                <div className="text-2xl md:text-3xl font-black text-red-600">₹{formatCurrency(totalDebits)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase opacity-40">Total Payments (Credits)</div>
                <div className="text-2xl md:text-3xl font-black text-green-600">₹{formatCurrency(totalCredits)}</div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card className="rounded-none border-none shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Date</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Transaction</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Type</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Amount (INR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-secondary/5">
                      <TableCell className="text-[10px] font-bold">Initialization</TableCell>
                      <TableCell className="text-[10px] font-black">Opening Balance</TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-none text-[8px] uppercase font-black", openingBalance < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                          {openingBalance < 0 ? "Debit" : "Credit"}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-black text-[10px] md:text-sm whitespace-nowrap", openingBalance < 0 ? "text-red-600" : "text-green-600")}>
                        {formatCurrency(openingBalance)}
                      </TableCell>
                    </TableRow>
                    {ledgerItems.map(item => (
                      <TableRow key={item.id} className={cn("hover:bg-secondary/5", item.type === 'Credit' ? "hover:bg-green-50/30" : "hover:bg-red-50/30")}>
                        <TableCell className="text-[10px] font-bold whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-[10px] font-black truncate max-w-[150px]">
                          {item.description}
                          {item.type === 'Debit' && item.status !== 'Approved' && (
                            <span className="block text-[8px] opacity-40 font-normal mt-1 italic">Pending Approval</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-none text-[8px] uppercase font-black", 
                            item.type === 'Credit' ? "bg-green-100 text-green-700" : 
                            (item.status === 'Approved' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400")
                          )}>
                            {item.type === 'Debit' ? (item.status === 'Approved' ? 'Debit' : item.status) : 'Credit'}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right font-black text-[10px] md:text-sm whitespace-nowrap", 
                          item.type === 'Credit' ? "text-green-600" : 
                          (item.status === 'Approved' ? "text-red-600" : "text-gray-300 opacity-40 line-through")
                        )}>
                          {item.type === 'Credit' ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    <TableRow className="bg-primary/5 border-t-2 border-primary/20">
                      <TableCell colSpan={2} className="text-[10px] font-black uppercase py-6">Statement Totals</TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="text-[8px] opacity-40 font-black uppercase">Total Debit Volume</div>
                          <div className="text-red-600 font-black">₹{formatCurrency(totalDebits)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="text-[8px] opacity-40 font-black uppercase">Total Credit Volume</div>
                          <div className="text-green-600 font-black">₹{formatCurrency(totalCredits)}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary text-background">
                      <TableCell colSpan={3} className="text-right text-[10px] font-black uppercase py-8">Net Current Outstanding (O/S)</TableCell>
                      <TableCell className="text-right text-xl md:text-2xl font-black whitespace-nowrap">₹{formatCurrency(currentOutstanding)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleDownloadOrdersCSV} variant="outline" size="sm" className="rounded-none h-10 px-4 uppercase font-black text-[9px] tracking-widest gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Download History (CSV)
              </Button>
            </div>
            <Card className="rounded-none border-none shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px]">Date</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">ID</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Status</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Total</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-[10px] opacity-60 whitespace-nowrap font-bold">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">{order.id.slice(0, 6).toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-none text-[8px] font-black uppercase",
                            order.status === 'Approved' ? "bg-green-100 text-green-700" :
                            order.status === 'Rejected' ? "bg-red-100 text-red-700" :
                            "bg-primary/5 text-primary")}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-[10px] md:text-sm whitespace-nowrap">₹{formatCurrency(parseAmount(order.totalAmount))}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedOrder(order)}
                            className="text-[8px] md:text-[9px] font-black uppercase tracking-widest p-1 md:px-3"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl rounded-none border-none p-0 bg-background overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 md:p-8 border-b border-primary/5">
            <div className="flex justify-between items-center gap-4">
              <DialogTitle className="text-xl md:text-3xl font-black uppercase tracking-tighter text-primary">Order Details</DialogTitle>
              <div className="flex gap-2">
                {selectedOrder?.status === 'Approved' && (
                  <Button 
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    className="bg-accent text-white rounded-none h-10 px-4 uppercase font-black text-[9px] tracking-widest gap-2"
                  >
                    <FileText className="h-4 w-4" /> Download Invoice
                  </Button>
                )}
                <Badge className={cn("rounded-none text-[8px] md:text-[10px] font-black uppercase flex items-center",
                  selectedOrder?.status === 'Approved' ? "bg-green-100 text-green-700" :
                  selectedOrder?.status === 'Rejected' ? "bg-red-100 text-red-700" :
                  "bg-primary/5 text-primary")}>
                  {selectedOrder?.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 truncate">Reference ID: #{selectedOrder?.id?.toUpperCase()}</span>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">Date: {selectedOrder?.createdAt && new Date(selectedOrder.createdAt).toLocaleString()}</span>
            </div>
          </DialogHeader>
          
          <div className="p-4 md:p-8">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/10">
                    <TableHead className="uppercase font-black text-[10px]">Article</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">Price (Incl. GST)</TableHead>
                    <TableHead className="uppercase font-black text-[10px]">Qty</TableHead>
                    <TableHead className="uppercase font-black text-[10px] text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder?.items?.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-primary/5">
                      <TableCell className="font-bold text-[10px] md:text-xs uppercase">
                        <div className="font-black text-primary">{item.name}</div>
                        <div className="text-[8px] opacity-40 mt-1">HSN: 6403</div>
                      </TableCell>
                      <TableCell className="text-[10px] md:text-xs font-black whitespace-nowrap">₹{formatCurrency(parseAmount(item.price))}</TableCell>
                      <TableCell className="text-[10px] md:text-xs font-black">{item.quantity}</TableCell>
                      <TableCell className="text-right font-black text-[10px] md:text-xs whitespace-nowrap">₹{formatCurrency(parseAmount(item.price) * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5">
                    <TableCell colSpan={3} className="text-right text-[10px] font-black uppercase py-6 md:py-8">Grand Order Total</TableCell>
                    <TableCell className="text-right text-lg md:text-2xl font-black whitespace-nowrap">₹{formatCurrency(parseAmount(selectedOrder?.totalAmount))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-8 p-4 bg-secondary/5 border-l-4 border-accent">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">GST Compliance Note</p>
              <p className="text-[9px] leading-relaxed opacity-60 uppercase font-medium">
                All prices are inclusive of 5% GST as per HSN 6403 (Footwear). 
                {profile?.gst && !profile.gst.startsWith("20") ? 
                  " Inter-state transaction (IGST 5%) applied." : 
                  " Intra-state transaction (CGST 2.5% + SGST 2.5%) applied."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
