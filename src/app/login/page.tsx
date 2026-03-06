
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useAuth, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Phone, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user already has an authorized profile
  const profileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [form, setForm] = useState({
    phone: "+91",
    accessCode: "",
  });

  // Automatically redirect if already authorized
  useEffect(() => {
    if (mounted && !isUserLoading && !isProfileLoading && user && profile) {
      router.push("/catalog");
    }
  }, [mounted, user, profile, isUserLoading, isProfileLoading, router]);

  const handleLogin = async () => {
    if (!form.phone || !form.accessCode) {
      toast({ variant: "destructive", title: "Required", description: "Phone and Access Code are mandatory." });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Establish an anonymous session FIRST to satisfy security rules
      const authResult = await signInAnonymously(auth);
      const currentUser = authResult.user;

      // Normalize input phone number
      const normalizedPhone = form.phone.replace(/[^0-9+]/g, '');
      const trimmedCode = form.accessCode.trim();

      // 2. Check AuthorizedUsers collection for matching Phone + Access Code
      // Note: This collection contains the master profiles created upon approval
      const q = query(
        collection(db, "AuthorizedUsers"),
        where("phone", "==", normalizedPhone),
        where("accessCode", "==", trimmedCode)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast({ 
          variant: "destructive", 
          title: "Invalid Credentials", 
          description: "Incorrect phone number or access code." 
        });
        setIsLoading(false);
        return;
      }

      const originalDoc = snapshot.docs[0];
      const data = originalDoc.data();
      const masterRequestId = data.originalRequestId || originalDoc.id;

      // 3. Map the profile to the current session UID so the Dashboard can find it
      const profileRef = doc(db, "AuthorizedUsers", currentUser.uid);
      await setDoc(profileRef, {
        ...data,
        id: currentUser.uid,
        originalRequestId: masterRequestId,
        lastLoginAt: new Date().toISOString(),
      }, { merge: true });

      toast({ title: "Authorized Access Granted", description: "Welcome to the secure wholesale portal." });
      
      router.push("/catalog");
      
    } catch (e: any) {
      console.error("Login error:", e);
      toast({ variant: "destructive", title: "Authentication Error", description: e.message });
      setIsLoading(false);
    }
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Securing Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-20 flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white rounded-none p-12">
          <CardHeader className="text-center space-y-6 px-0 pb-12">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Wholesale Login</h1>
            <CardDescription className="text-[10px] uppercase font-black tracking-[0.4em] text-accent">Enter your unique 6-digit access code</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">Registered Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">6-Digit Access Code</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    className="rounded-none border-primary/10 h-14 pl-12 font-black tracking-[0.5em] text-center"
                    maxLength={6}
                    placeholder="000000"
                    value={form.accessCode}
                    onChange={e => setForm({...form, accessCode: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full h-20 bg-primary text-background hover:bg-accent rounded-none uppercase font-black text-[10px] tracking-[0.4em]"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : "Authorize Access"}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
            <div className="text-center pt-8 border-t border-primary/5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access code not received?</p>
              <Button variant="link" onClick={() => router.push("/register")} className="text-[10px] font-black uppercase tracking-widest text-accent mt-2">
                Apply for Wholesale Registry
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
