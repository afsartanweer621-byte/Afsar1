
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useAuth, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, ShieldCheck, Phone, Clock, Home } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Check for an already authorized profile to prevent re-registration
  const profileRef = useMemoFirebase(() => 
    user ? doc(db, "AuthorizedUsers", user.uid) : null, 
  [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // 2. Check if a request was already submitted by this session UID
  const requestCheckRef = useMemoFirebase(() => 
    user ? doc(db, "PendingRequests", user.uid) : null, 
  [db, user]);
  const { data: existingRequest, isLoading: isRequestLoading } = useDoc(requestCheckRef);

  // Redirect if already authorized
  useEffect(() => {
    if (mounted && !isUserLoading && !isProfileLoading && profile) {
      router.push("/catalog");
    }
  }, [mounted, user, profile, isUserLoading, isProfileLoading, router]);

  // Persist the "Submitted" view if a record exists in Firestore
  useEffect(() => {
    if (existingRequest && !isSubmitted) {
      setIsSubmitted(true);
    }
  }, [existingRequest, isSubmitted]);

  // Initialize Anonymous Auth on mount to secure the submission flow
  useEffect(() => {
    if (!user && !isUserLoading) {
      signInAnonymously(auth).catch((err) => {
        console.error("Registry session initialization failed:", err);
      });
    }
  }, [user, isUserLoading, auth]);

  const [form, setForm] = useState({
    firmName: "",
    gst: "",
    phone: "+91",
  });

  const handleSubmit = async () => {
    if (!form.firmName || !form.gst || !form.phone) {
      toast({ variant: "destructive", title: "Missing Fields", description: "All fields are required for wholesale verification." });
      return;
    }

    const rawPhone = form.phone.replace(/[^0-9]/g, '');
    const phoneDigitsOnly = rawPhone.startsWith('91') && rawPhone.length > 10 ? rawPhone.slice(2) : rawPhone;
    
    if (phoneDigitsOnly.length !== 10) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Phone", 
        description: "Mobile number must be exactly 10 digits." 
      });
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(form.gst.toUpperCase())) {
      toast({ 
        variant: "destructive", 
        title: "Invalid GST", 
        description: "Please enter a valid 15-digit GST number." 
      });
      return;
    }

    if (!user) {
      toast({ variant: "destructive", title: "Session Error", description: "Secure registry session not initialized. Please refresh." });
      return;
    }

    setIsLoading(true);
    try {
      const normalizedPhone = "+91" + phoneDigitsOnly;
      const requestId = user.uid;
      const requestRef = doc(db, "PendingRequests", requestId);
      
      await setDoc(requestRef, {
        id: requestId,
        firmName: form.firmName,
        gst: form.gst.toUpperCase(),
        phone: normalizedPhone,
        status: "Pending",
        openingBalance: 0,
        creditLimit: 0,
        createdAt: new Date().toISOString(),
      });

      setIsSubmitted(true);
      toast({ title: "Application Received", description: "Your details have been submitted for review." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Submission Error", description: "We encountered an error. Please check your connection." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || isUserLoading || isProfileLoading || isRequestLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-12">
        <div className="bg-amber-100 p-8 rounded-full">
          <Clock className="h-16 w-16 text-amber-600" />
        </div>
        <div className="space-y-8 max-w-md">
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-primary">Application Pending</h1>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest leading-loose">
              Thank you for applying. 
              Our team is currently verifying your business credentials (GST: {existingRequest?.gst || form.gst}). 
              We will contact you with your unique access code once approved.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full rounded-none uppercase font-black text-[10px] tracking-[0.3em] h-16 border-primary/20 hover:bg-primary hover:text-background transition-all">
                <Home className="mr-3 h-4 w-4" /> Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-20 flex items-center justify-center">
        <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-none p-12">
          <CardHeader className="text-center space-y-6 px-0 pb-12">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Wholesale Access</h1>
            <CardDescription className="text-[10px] uppercase font-black tracking-[0.4em] text-accent">Apply for a Verified Retailer Account</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">Firm Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold"
                    placeholder="e.g. Luxury Footwear Hub"
                    value={form.firmName}
                    onChange={e => setForm({...form, firmName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">GST Number</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold uppercase"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gst}
                    onChange={e => setForm({...form, gst: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || isUserLoading}
              className="w-full h-20 bg-primary text-background hover:bg-accent rounded-none uppercase font-black text-[10px] tracking-[0.4em]"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : "Submit Application"}
            </Button>
            <div className="text-center pt-8 border-t border-primary/5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Already have an access code?</p>
              <Link href="/login">
                <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-accent mt-2">
                  Login to Portal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
