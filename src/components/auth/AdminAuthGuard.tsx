"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, User } from "lucide-react";

/**
 * @fileOverview A security guard for administrative routes.
 * Requires hardcoded credentials to access wrapped content.
 */

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_terminal_authorized");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Pradoventures" && password === "Sanju@123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_terminal_authorized", "true");
      setError("");
    } else {
      setError("Invalid administrative credentials.");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.5em] text-primary/20">
          Verifying Credentials...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white rounded-none p-12">
        <CardHeader className="text-center space-y-6 px-0 pb-12">
          <div className="bg-primary/5 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
            <Lock className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Terminal Lock</h1>
            <CardDescription className="text-[10px] uppercase font-black tracking-[0.4em] text-accent">Authorized Personnel Only</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    placeholder="USERNAME"
                    autoComplete="username"
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold text-[12px] tracking-widest placeholder:text-primary/20 normal-case"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-primary/20" />
                  <Input 
                    type="password"
                    autoComplete="current-password"
                    placeholder="PASSWORD"
                    className="rounded-none border-primary/10 h-14 pl-12 font-bold tracking-[0.5em] placeholder:tracking-widest placeholder:text-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <p className="text-[9px] font-black uppercase text-destructive text-center tracking-widest animate-bounce">
                  {error}
                </p>
              )}
            </div>
            <Button 
              type="submit"
              className="w-full h-20 bg-primary text-background hover:bg-accent rounded-none uppercase font-black text-[10px] tracking-[0.4em] transition-all"
            >
              Access Terminal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
