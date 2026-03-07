"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { 
  Package, 
  Loader2,
  ShoppingCart,
  Edit,
  Check,
  XCircle,
  AlertCircle,
  Bell,
  Send,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Plus,
  ArrowUp,
  ArrowDown,
  Layout,
  FileSpreadsheet,
  AlertTriangle,
  FileUp,
  Download,
  FileText,
  Search
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

const FALLBACK_PRODUCTS = [
  { id: '1021-Prado-Hill', name: '1021-Prado Hill', stockQuantity: 26, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 1 },
  { id: '1032-Prado-Hill', name: '1032-Prado Hill', stockQuantity: 14, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 2 },
  { id: '1051-Prado-Hill', name: '1051-Prado Hill', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 3 },
  { id: '1082-PradoHill', name: '1082-PradoHill', stockQuantity: 20, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 4 },
  { id: '1091-PradoHill', name: '1091-PradoHill', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 5 },
  { id: '1102-PradoHill', name: '1102-PradoHill', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 6 },
  { id: '1132-PradoHill', name: '1132-PradoHill', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 7 },
  { id: '1141-Prado-Hill', name: '1141-Prado Hill', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 8 },
  { id: '1142-PradoHill', name: '1142-PradoHill', stockQuantity: 32, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 9 },
  { id: '1162-PradoHill', name: '1162-PradoHill', stockQuantity: 14, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 10 },
  { id: '1192-PradoHill', name: '1192-PradoHill', stockQuantity: 29, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 11 },
  { id: '1232-PradoHill', name: '1232-PradoHill', stockQuantity: 11, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 12 },
  { id: '1261-PradoHill', name: '1261-PradoHill', stockQuantity: 6, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 13 },
  { id: '1272-PradoHill', name: '1272-PradoHill', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 14 },
  { id: '1321-PradoHill', name: '1321-PradoHill', stockQuantity: 49, mrp: 999, margin: 38, price: 619.38, category: 'PradoHill', displayOrder: 15 },
  { id: '1421', name: '1421', stockQuantity: 30, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 16 },
  { id: '1431', name: '1431', stockQuantity: 43, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 17 },
  { id: '1451', name: '1451', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 18 },
  { id: '1461', name: '1461', stockQuantity: 21, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 19 },
  { id: '1481', name: '1481', stockQuantity: 3, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 20 },
  { id: '1501', name: '1501', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 21 },
  { id: '1551', name: '1551', stockQuantity: 3, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 22 },
  { id: '1611', name: '1611', stockQuantity: 34, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 23 },
  { id: '1621', name: '1621', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 24 },
  { id: '1631', name: '1631', stockQuantity: 3, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 25 },
  { id: '1641', name: '1641', stockQuantity: 17, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 26 },
  { id: '1661', name: '1661', stockQuantity: 3, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 27 },
  { id: '1671', name: '1671', stockQuantity: 20, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 28 },
  { id: '1681', name: '1681', stockQuantity: 9, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 29 },
  { id: '1691', name: '1691', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 30 },
  { id: '1701', name: '1701', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 31 },
  { id: '1704', name: '1704', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 32 },
  { id: '1708', name: '1708', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 33 },
  { id: '1721', name: '1721', stockQuantity: 28, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 34 },
  { id: '1806-Prado-Hill', name: '1806-Prado Hill', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 35 },
  { id: '1807', name: '1807', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 36 },
  { id: '1814', name: '1814', stockQuantity: 10, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 37 },
  { id: '1816', name: '1816', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 38 },
  { id: '1871', name: '1871', stockQuantity: 7, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 39 },
  { id: '1872-PH', name: '1872-PH', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'Prado Hill', displayOrder: 40 },
  { id: '1902', name: '1902', stockQuantity: 31, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 41 },
  { id: '1903', name: '1903', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 42 },
  { id: '1904', name: '1904', stockQuantity: 30, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 43 },
  { id: '2024', name: '2024', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 44 },
  { id: '2025', name: '2025', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 45 },
  { id: '2026', name: '2026', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 46 },
  { id: '3101', name: '3101', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 47 },
  { id: '3102', name: '3102', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 48 },
  { id: '3108', name: '3108', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 49 },
  { id: '3109', name: '3109', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 50 },
  { id: '4105', name: '4105', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 51 },
  { id: '4109', name: '4109', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 52 },
  { id: '5102', name: '5102', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 53 },
  { id: '5103', name: '5103', stockQuantity: 3, mrp: 999, margin: 38, price: 619.38, category: 'Classic', displayOrder: 54 },
  { id: '8262-SnakeHorn', name: '8262-SnakeHorn', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'SnakeHorn', displayOrder: 55 },
  { id: '8272-SnakeHorn', name: '8272-SnakeHorn', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'SnakeHorn', displayOrder: 56 },
  { id: 'A2305T', name: 'A2305T', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 57 },
  { id: 'A2311T', name: 'A2311T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 58 },
  { id: 'A2314T', name: 'A2314T', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 59 },
  { id: 'A2315T', name: 'A2315T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 60 },
  { id: 'A2319T', name: 'A2319T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 61 },
  { id: 'A2328T', name: 'A2328T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 62 },
  { id: 'A2334T', name: 'A2334T', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 63 },
  { id: 'A2343T', name: 'A2343T', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 64 },
  { id: 'A2344T', name: 'A2344T', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 65 },
  { id: 'A2345T', name: 'A2345T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 66 },
  { id: 'A2346T', name: 'A2346T', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 67 },
  { id: 'A23471', name: 'A23471', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 68 },
  { id: 'A2348T', name: 'A2348T', stockQuantity: 20, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 69 },
  { id: 'A2349T', name: 'A2349T', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 70 },
  { id: 'A2350T', name: 'A2350T', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 71 },
  { id: 'A2351T', name: 'A2351T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 72 },
  { id: 'A2354T', name: 'A2354T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 73 },
  { id: 'A2355T', name: 'A2355T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 74 },
  { id: 'A2356T', name: 'A2356T', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 75 },
  { id: 'A2358T', name: 'A2358T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 76 },
  { id: 'A2359T', name: 'A2359T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 77 },
  { id: 'A2361T', name: 'A2361T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 78 },
  { id: 'A2362T', name: 'A2362T', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'T-Series', displayOrder: 79 },
  { id: 'Dummy', name: 'Dummy', stockQuantity: 2, mrp: 999, margin: 38, price: 619.38, category: 'Test', displayOrder: 80 },
  { id: '13101N', name: '13101N', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 81 },
  { id: '13103N', name: '13103N', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 82 },
  { id: '13105N', name: '13105N', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 83 },
  { id: '13106N', name: '13106N', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 84 },
  { id: '13107N', name: '13107N', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 85 },
  { id: '13109N', name: '13109N', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 86 },
  { id: '13110N', name: '13110N', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 87 },
  { id: '13112N', name: '13112N', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 88 },
  { id: '13116N', name: '13116N', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 89 },
  { id: '13117N', name: '13117N', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 90 },
  { id: '13118N', name: '13118N', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 91 },
  { id: '13119N', name: '13119N', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 92 },
  { id: '13120N', name: '13120N', stockQuantity: 16, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 93 },
  { id: '13121N', name: '13121N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 94 },
  { id: '13122N', name: '13122N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 95 },
  { id: '13123N', name: '13123N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 96 },
  { id: '13124N', name: '13124N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 97 },
  { id: '13125N', name: '13125N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 98 },
  { id: '13126N', name: '13126N', stockQuantity: 24, mrp: 999, margin: 38, price: 619.38, category: 'N-Series', displayOrder: 99 },
  { id: 'LP-8104', name: 'LP-8104', stockQuantity: 1, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 100 },
  { id: 'LP-8105', name: 'LP-8105', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 101 },
  { id: 'LP-8106', name: 'LP-8106', stockQuantity: 12, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 102 },
  { id: 'LP-8107', name: 'LP-8107', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 103 },
  { id: 'LP-8201', name: 'LP-8201', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 104 },
  { id: 'LP-8203', name: 'LP-8203', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'LP-Series', displayOrder: 105 },
  { id: 'M3304D', name: 'M3304D', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'M-Series', displayOrder: 106 },
  { id: 'PACKING', name: 'PACKING', stockQuantity: 14, mrp: 999, margin: 38, price: 619.38, category: 'Service', displayOrder: 107 },
  { id: 'SH-1111', name: 'SH-1111', stockQuantity: 11, mrp: 999, margin: 38, price: 619.38, category: 'SH-Series', displayOrder: 108 },
  { id: 'SH-1301', name: 'SH-1301', stockQuantity: 2, mrp: 999, margin: 38, price: 619.38, category: 'SH-Series', displayOrder: 109 },
  { id: 'SH-1309', name: 'SH-1309', stockQuantity: 8, mrp: 999, margin: 38, price: 619.38, category: 'SH-Series', displayOrder: 110 },
  { id: 'SH-1311', name: 'SH-1311', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'SH-Series', displayOrder: 111 },
  { id: 'SH-1401', name: 'SH-1401', stockQuantity: 4, mrp: 999, margin: 38, price: 619.38, category: 'SH-Series', displayOrder: 112 },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("orders");
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
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
    user ? collection(db, "Orders") : null, 
  [db, user]);

  const retailersQuery = useMemoFirebase(() => 
    user ? collection(db, "AuthorizedUsers") : null, 
  [db, user]);

  const notificationsQuery = useMemoFirebase(() => 
    user ? query(collection(db, "Notifications"), orderBy("createdAt", "desc")) : null, 
  [db, user]);

  const carouselQuery = useMemoFirebase(() => 
    user ? query(collection(db, "app_assets", "homepage", "carousel"), orderBy("order", "asc")) : null,
  [db, user]);

  const { data: firestoreProducts, isLoading: loadingProducts } = useCollection(productsQuery);
  const { data: rawOrders, isLoading: loadingOrders } = useCollection(ordersQuery);
  const { data: retailers } = useCollection(retailersQuery);
  const { data: notifications } = useCollection(notificationsQuery);
  const { data: slides, isLoading: loadingSlides } = useCollection(carouselQuery);

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
    if (!productSearch) return mergedProducts;
    return mergedProducts.filter(p => 
      p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [mergedProducts, productSearch]);

  const getRetailerName = (userId: string) => {
    const retailer = retailers?.find(r => r.id === userId || r.originalRequestId === userId);
    return retailer?.firmName || userId?.slice(0, 8) || 'Unknown';
  };

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [rawOrders]);

  const handleAdminLogout = async () => {
    sessionStorage.removeItem("admin_terminal_authorized");
    await signOut(auth);
    toast({ title: "Admin Logged Out" });
    window.location.reload();
  };

  const handleDownloadOrdersCSV = () => {
    if (!orders || orders.length === 0) return;
    
    const headers = ["Order ID", "Firm Name", "Date", "Status", "Total Amount (INR)"];
    const rows = orders.map(order => [
      order.id,
      getRetailerName(order.userId),
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      (order.totalAmount || 0).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Admin_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "CSV Export Complete",
      description: "The order registry has been downloaded.",
    });
  };

  const handleExportInventoryCSV = () => {
    if (!mergedProducts || mergedProducts.length === 0) return;
    
    const headers = ["article_id", "name", "category", "quantity", "mrp", "margin", "price", "hsn"];
    const rows = mergedProducts.map(p => [
      p.id,
      p.name,
      p.category || "General",
      p.stockQuantity,
      p.mrp,
      p.margin || 0,
      p.price.toFixed(2),
      p.hsn || "6403"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Inventory Export Complete",
      description: "Current article registry and valuations downloaded.",
    });
  };

  const handleDownloadTemplateCSV = () => {
    const headers = ["article_id", "name", "category", "quantity", "mrp", "margin", "price", "hsn"];
    const exampleRow = ["SKU-101", "Classic Oxford", "Formal", "10", "1800", "38", "1116", "6403"];
    
    const csvContent = [headers, exampleRow].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Inventory_Bulk_Upload_Template.csv`;
    link.click();
    
    toast({
      title: "Template Downloaded",
      description: "Follow this format for successful bulk inventory updates.",
    });
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
        toast({ variant: "destructive", title: "Invalid File", description: "CSV is empty or missing data." });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: any = {};
        headers.forEach((h, idx) => { rowData[h] = values[idx]; });

        const articleId = rowData.article_id || rowData.id;
        if (!articleId) {
          errorCount++;
          continue;
        }

        const qty = parseInt(rowData.quantity || rowData.stockquantity || "0") || 0;
        const mrp = parseFloat(rowData.mrp) || 0;
        const margin = parseFloat(rowData.margin) || 0;
        let price = parseFloat(rowData.price) || 0;

        // If price is 0 or not provided, calculate based on MRP and Margin
        if ((price === 0 || isNaN(price)) && mrp > 0) {
          price = mrp * (1 - (margin / 100));
        }

        try {
          const docRef = doc(db, "Products", articleId);
          const docSnap = await getDoc(docRef);

          const payload = {
            id: articleId,
            name: rowData.name || articleId,
            category: rowData.category || "General",
            price: price,
            mrp: mrp,
            margin: margin,
            hsn: rowData.hsn || "6403",
            stockQuantity: qty,
            updatedAt: new Date().toISOString()
          };

          if (docSnap.exists()) {
            // Update existing product - Increment stock for bulk additions
            await updateDoc(docRef, {
              ...payload,
              stockQuantity: increment(qty) 
            });
          } else {
            // Create new product
            await setDoc(docRef, {
              ...payload,
              displayOrder: mergedProducts.length + i
            });
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing ${articleId}:`, error);
          errorCount++;
        }
      }

      setIsBulkProcessing(false);
      toast({
        title: "Bulk Upload Finished",
        description: `Processed ${successCount} articles. Errors: ${errorCount}. Registry updated.`,
      });
      if (bulkUploadRef.current) bulkUploadRef.current.value = "";
    };
    reader.readAsText(file);
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

  const handleUpdateOrderItem = (itemId: string, field: string, value: string) => {
    if (!editingOrder) return;
    const updatedItems = editingOrder.items.map((item: any) => {
      if (item.id === itemId) {
        const val = parseFloat(value) || 0;
        const updatedItem = { ...item, [field]: val };
        
        if (field === 'discount') {
          const discountAmount = (updatedItem.mrp * val) / 100;
          updatedItem.price = updatedItem.mrp - discountAmount;
        }
        
        return updatedItem;
      }
      return item;
    });

    const newTotal = updatedItems.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0);
    setEditingOrder({ ...editingOrder, items: updatedItems, totalAmount: newTotal });
  };

  const handleApproveOrder = () => {
    if (!editingOrder) return;
    const orderRef = doc(db, "Orders", editingOrder.id);
    
    updateDocumentNonBlocking(orderRef, {
      items: editingOrder.items,
      totalAmount: editingOrder.totalAmount,
      status: "Approved",
      updatedAt: new Date().toISOString()
    });

    if (editingOrder.status !== "Approved") {
      editingOrder.items.forEach((orderItem: any) => {
        const product = mergedProducts?.find(p => p.id === orderItem.id);
        if (product) {
          const productRef = doc(db, "Products", product.id);
          const currentStock = product.stockQuantity || 0;
          const newStock = Math.max(0, currentStock - orderItem.quantity);
          
          setDocumentNonBlocking(productRef, {
            ...product,
            stockQuantity: newStock,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      });
    }

    setEditingOrder(null);
    toast({ title: "Order Approved" });
  };

  const handleRejectOrder = () => {
    if (!editingOrder) return;
    const orderRef = doc(db, "Orders", editingOrder.id);

    if (editingOrder.status === "Approved") {
      editingOrder.items.forEach((orderItem: any) => {
        const product = mergedProducts?.find(p => p.id === orderItem.id);
        if (product) {
          const productRef = doc(db, "Products", product.id);
          const currentStock = product.stockQuantity || 0;
          const newStock = currentStock + orderItem.quantity;
          
          setDocumentNonBlocking(productRef, {
            ...product,
            stockQuantity: newStock,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      });
    }

    updateDocumentNonBlocking(orderRef, {
      status: "Rejected",
      updatedAt: new Date().toISOString()
    });

    setEditingOrder(null);
    toast({ variant: "destructive", title: "Order Rejected" });
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const orderRef = doc(db, "Orders", orderToDelete);
    deleteDocumentNonBlocking(orderRef);
    setOrderToDelete(null);
    toast({ title: "Order Deleted", description: "The record has been purged from the registry." });
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    if (!editingProduct.id) {
      toast({ variant: "destructive", title: "Missing ID" });
      return;
    }

    const mrp = parseFloat(editingProduct.mrp) || 0;
    const margin = parseFloat(editingProduct.margin) || 0;
    const calculatedPrice = mrp * (1 - (margin / 100));

    const productRef = doc(db, "Products", editingProduct.id);
    
    setDocumentNonBlocking(productRef, {
      ...editingProduct,
      price: calculatedPrice,
      mrp: mrp,
      margin: margin,
      hsn: editingProduct.hsn || "6403",
      stockQuantity: parseInt(editingProduct.stockQuantity) || 0,
      displayOrder: parseInt(editingProduct.displayOrder) || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    setEditingProduct(null);
    toast({ title: "Inventory Updated" });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm(`Delete article ${productId}?`)) {
      const productRef = doc(db, "Products", productId);
      deleteDocumentNonBlocking(productRef);
      toast({ title: "Article Deleted" });
    }
  };

  const handleMoveProduct = (product: any, direction: 'up' | 'down') => {
    const currentIndex = mergedProducts.findIndex(p => p.id === product.id);
    if (direction === 'up' && currentIndex > 0) {
      const targetProduct = mergedProducts[currentIndex - 1];
      const currentOrder = product.displayOrder || (currentIndex + 1);
      const targetOrder = targetProduct.displayOrder || currentIndex;

      updateDocumentNonBlocking(doc(db, "Products", product.id), { displayOrder: targetOrder });
      updateDocumentNonBlocking(doc(db, "Products", targetProduct.id), { displayOrder: currentOrder });
    } else if (direction === 'down' && currentIndex < mergedProducts.length - 1) {
      const targetProduct = mergedProducts[currentIndex + 1];
      const currentOrder = product.displayOrder || (currentIndex + 1);
      const targetOrder = targetProduct.displayOrder || (currentIndex + 2);

      updateDocumentNonBlocking(doc(db, "Products", product.id), { displayOrder: targetOrder });
      updateDocumentNonBlocking(doc(db, "Products", targetProduct.id), { displayOrder: currentOrder });
    }
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
      imageUrl: "",
      displayOrder: mergedProducts.length + 1
    });
  };

  const handleAddNewSlide = () => {
    setEditingSlide({
      id: crypto.randomUUID(),
      title: "",
      description: "",
      imageUrl: "",
      ctaText: "Explore Now",
      ctaLink: "/catalog",
      order: (slides?.length || 0) + 1
    });
  };

  const handleSaveSlide = () => {
    if (!editingSlide) return;
    const slideRef = doc(db, "app_assets", "homepage", "carousel", editingSlide.id);
    setDocumentNonBlocking(slideRef, editingSlide, { merge: true });
    setEditingSlide(null);
    toast({ title: "Carousel Updated" });
  };

  const handleDeleteSlide = (id: string) => {
    if (confirm("Delete this slide?")) {
      const slideRef = doc(db, "app_assets", "homepage", "carousel", id);
      deleteDocumentNonBlocking(slideRef);
      toast({ title: "Slide Removed" });
    }
  };

  const handleMoveSlide = (slide: any, direction: 'up' | 'down') => {
    if (!slides) return;
    const currentIndex = slides.findIndex(s => s.id === slide.id);
    if (direction === 'up' && currentIndex > 0) {
      const target = slides[currentIndex - 1];
      updateDocumentNonBlocking(doc(db, "app_assets", "homepage", "carousel", slide.id), { order: target.order });
      updateDocumentNonBlocking(doc(db, "app_assets", "homepage", "carousel", target.id), { order: slide.order });
    } else if (direction === 'down' && currentIndex < slides.length - 1) {
      const target = slides[currentIndex + 1];
      updateDocumentNonBlocking(doc(db, "app_assets", "homepage", "carousel", slide.id), { order: target.order });
      updateDocumentNonBlocking(doc(db, "app_assets", "homepage", "carousel", target.id), { order: slide.order });
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'slide') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const resizedImage = await resizeImage(file, type === 'slide' ? 1200 : 400);
      if (type === 'product') {
        setEditingProduct({ ...editingProduct, imageUrl: resizedImage });
      } else {
        setEditingSlide({ ...editingSlide, imageUrl: resizedImage });
      }
      toast({ title: "Image Prepared" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = event.target?.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
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
            <TabsTrigger value="orders" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] tracking-widest">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] tracking-widest">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="carousel" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] tracking-widest">
              Media
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 md:flex-none rounded-none px-6 h-full data-[state=active]:bg-accent uppercase font-black text-[9px] tracking-widest">
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleDownloadOrdersCSV} variant="outline" size="sm" className="rounded-none h-10 px-4 uppercase font-black text-[9px] tracking-widest gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export Orders (CSV)
              </Button>
            </div>
            <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">ID</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Date</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Firm</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Amount</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOrders ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 uppercase font-black text-[10px] opacity-40">Syncing...</TableCell></TableRow>
                    ) : orders?.map((order) => (
                      <TableRow key={order.id} className="border-primary/5 hover:bg-secondary/5">
                        <TableCell className="font-mono text-[10px]">{order.id?.slice(0, 6).toUpperCase()}</TableCell>
                        <TableCell className="text-[10px] font-bold whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-black text-[10px] uppercase truncate max-w-[100px]">{getRetailerName(order.userId)}</TableCell>
                        <TableCell className="font-black text-[10px]">₹{order.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 ${
                            order.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                            order.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status || 'Wait'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingOrder(order)} className="p-1">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setOrderToDelete(order.id)} className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3 w-3" />
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
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{mergedProducts.length} Articles</div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-3 w-3 text-primary/30" />
                  <Input 
                    placeholder="Search Article ID or Name..." 
                    className="pl-9 rounded-none h-10 text-[10px] uppercase font-bold border-primary/10 w-full sm:w-64"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button onClick={handleDownloadTemplateCSV} variant="outline" className="flex-1 sm:flex-none h-12 rounded-none border-primary uppercase font-black text-[9px] tracking-widest gap-2">
                  <FileText className="h-4 w-4" /> Download Template
                </Button>
                <Button onClick={handleExportInventoryCSV} variant="outline" className="flex-1 sm:flex-none h-12 rounded-none border-primary uppercase font-black text-[9px] tracking-widest gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button onClick={() => bulkUploadRef.current?.click()} variant="outline" className="flex-1 sm:flex-none h-12 rounded-none border-primary uppercase font-black text-[9px] tracking-widest gap-2" disabled={isBulkProcessing}>
                  {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Bulk Upload
                </Button>
                <input type="file" ref={bulkUploadRef} className="hidden" accept=".csv" onChange={handleBulkUploadCSV} />
                <Button onClick={handleAddNewProduct} className="flex-1 sm:flex-none bg-primary text-background h-12 rounded-none uppercase font-black text-[9px] tracking-widest gap-2">
                  <Plus className="h-4 w-4" /> New Article
                </Button>
              </div>
            </div>
            <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px]"></TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">ID/Name</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Stock</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">MRP</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Margin</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">W/S Price</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-20 uppercase font-black text-[10px] opacity-40">Loading...</TableCell></TableRow>
                    ) : filteredProducts.map((p, idx) => (
                      <TableRow key={p.id} className="border-primary/5">
                        <TableCell>
                          <div className="flex flex-col">
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMoveProduct(p, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === filteredProducts.length - 1} onClick={() => handleMoveProduct(p, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[10px] uppercase">
                          <div className="font-black text-accent truncate max-w-[120px]">{p.id}</div>
                          <div className="opacity-60 truncate max-w-[120px]">{p.name}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">{p.stockQuantity}</TableCell>
                        <TableCell className="font-black text-[10px]">₹{p.mrp}</TableCell>
                        <TableCell className="font-black text-[10px] text-accent">{p.margin || 0}%</TableCell>
                        <TableCell className="font-black text-[10px]">₹{p.price?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(p)} className="p-1"><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="carousel" className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-primary/5">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{slides?.length || 0} Slides</div>
              <Button onClick={handleAddNewSlide} className="bg-primary text-background rounded-none uppercase font-black text-[10px] tracking-widest gap-2">
                <Plus className="h-4 w-4" /> New Slide
              </Button>
            </div>
            <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow className="border-none">
                      <TableHead className="text-background uppercase font-black text-[10px]"></TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Preview</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px]">Title</TableHead>
                      <TableHead className="text-background uppercase font-black text-[10px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slides?.map((slide, idx) => (
                      <TableRow key={slide.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMoveSlide(slide, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === (slides?.length || 0) - 1} onClick={() => handleMoveSlide(slide, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative h-8 w-16 bg-primary/5">
                            {slide.imageUrl && <Image src={slide.imageUrl} alt="" fill className="object-cover" data-ai-hint="banner" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-[10px] uppercase truncate max-w-[100px]">{slide.title}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingSlide(slide)} className="p-1"><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSlide(slide.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-none shadow-xl bg-white rounded-none">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-accent">Broadcast</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={notifType} onValueChange={setNotifType}>
                    <SelectTrigger className="rounded-none h-10 font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Update">Update</SelectItem><SelectItem value="Alert">Alert</SelectItem><SelectItem value="Promotion">Promotion</SelectItem></SelectContent>
                  </Select>
                  <Input placeholder="Title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="rounded-none text-[10px]" />
                  <Textarea placeholder="Message" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} className="rounded-none text-[10px] min-h-[100px]" />
                  <Button onClick={handleSendNotification} className="w-full h-12 bg-primary text-background rounded-none uppercase font-black text-[10px] tracking-widest"><Send className="h-4 w-4 mr-2" /> Send</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-none overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary">
                      <TableRow className="border-none"><TableHead className="text-background uppercase font-black text-[10px]">Title</TableHead><TableHead className="text-background uppercase font-black text-[10px]">Type</TableHead><TableHead className="text-background uppercase font-black text-[10px] text-right">Del</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications?.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-black text-[10px] uppercase truncate max-w-[150px]">{n.title}</TableCell>
                          <TableCell><Badge className="rounded-none text-[7px] font-black uppercase">{n.type}</Badge></TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(n.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-none border-none">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="uppercase font-black tracking-tighter text-xl">Purge Order</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[11px] font-medium uppercase tracking-widest leading-relaxed">
              This will permanently delete Order #{orderToDelete?.slice(0, 6).toUpperCase()} from the registry. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-none uppercase font-black text-[10px] tracking-widest h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteOrder} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-black text-[10px] tracking-widest h-12">
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialogs */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto rounded-none p-0 bg-background">
          <DialogHeader className="p-6 md:p-8 border-b border-primary/5">
            <DialogTitle className="text-xl md:text-3xl font-black uppercase">Order #{editingOrder?.id?.slice(0, 6).toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="p-4 md:p-8 space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Art</TableHead><TableHead>MRP</TableHead><TableHead>Qty</TableHead><TableHead>Disc</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {editingOrder?.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[10px] font-bold">{item.name}</TableCell>
                      <TableCell className="text-[10px]">₹{item.mrp}</TableCell>
                      <TableCell><Input type="number" className="w-16 h-8 text-[10px]" value={item.quantity ?? ""} onChange={(e) => handleUpdateOrderItem(item.id, 'quantity', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" className="w-16 h-8 text-[10px]" value={item.discount ?? 0} onChange={(e) => handleUpdateOrderItem(item.id, 'discount', e.target.value)} /></TableCell>
                      <TableCell className="text-right font-black text-[10px]">₹{(item.price * item.quantity).toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-secondary/5 p-6">
              <div className="text-center sm:text-left"><span className="text-[10px] uppercase opacity-40">Net Total</span><p className="text-3xl font-black">₹{editingOrder?.totalAmount?.toLocaleString()}</p></div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleRejectOrder} variant="outline" className="flex-1 sm:flex-none h-12 text-[9px] uppercase font-black text-destructive">Reject</Button>
                <Button onClick={handleApproveOrder} className="flex-1 sm:flex-none h-12 text-[9px] uppercase font-black">Approve</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto rounded-none p-0 bg-background">
          <DialogHeader className="p-6 md:p-8 border-b border-primary/5"><DialogTitle className="text-xl md:text-2xl font-black uppercase">Article Entry</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative h-24 w-24 bg-primary/5 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {editingProduct?.imageUrl ? <Image src={editingProduct.imageUrl} alt="" fill className="object-cover" /> : <Upload className="h-6 w-6 opacity-20" />}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'product')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase">SKU ID (article_id)</Label>
              <Input placeholder="SKU ID" value={editingProduct?.id ?? ""} onChange={(e) => setEditingProduct({...editingProduct, id: e.target.value})} className="rounded-none text-[10px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase">Product Name</Label>
              <Input placeholder="Name" value={editingProduct?.name ?? ""} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="rounded-none text-[10px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">HSN</Label>
                <Input placeholder="HSN (e.g. 6403)" value={editingProduct?.hsn ?? "6403"} onChange={(e) => setEditingProduct({...editingProduct, hsn: e.target.value})} className="rounded-none text-[10px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">Stock Qty</Label>
                <Input type="number" placeholder="Stock" value={editingProduct?.stockQuantity ?? 0} onChange={(e) => setEditingProduct({...editingProduct, stockQuantity: e.target.value})} className="rounded-none text-[10px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/5">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">MRP (Retail)</Label>
                <Input type="number" placeholder="MRP" value={editingProduct?.mrp ?? 0} onChange={(e) => setEditingProduct({...editingProduct, mrp: e.target.value})} className="rounded-none text-[10px] font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase">Margin (%)</Label>
                <Input type="number" placeholder="Margin" value={editingProduct?.margin ?? 38} onChange={(e) => setEditingProduct({...editingProduct, margin: e.target.value})} className="rounded-none text-[10px] font-bold text-accent" />
              </div>
            </div>
            <div className="bg-primary/5 p-4 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase opacity-40">Calculated W/S Price</span>
              <span className="text-lg font-black">₹{((parseFloat(editingProduct?.mrp) || 0) * (1 - (parseFloat(editingProduct?.margin) || 0) / 100)).toFixed(2)}</span>
            </div>
            <Button onClick={handleSaveProduct} className="w-full h-12 bg-primary text-background rounded-none uppercase font-black text-[10px] tracking-widest">Save Article Registry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
