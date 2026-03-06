'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { toast } from "@/hooks/use-toast";

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error.message,
    });
  });
}

/** Initiate password reset (non-blocking). */
export function initiatePasswordReset(authInstance: Auth, email: string): void {
  sendPasswordResetEmail(authInstance, email).then(() => {
    toast({
      title: "Reset Email Sent",
      description: `A password reset link has been sent to ${email}.`,
    });
  }).catch((error) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
  });
}
