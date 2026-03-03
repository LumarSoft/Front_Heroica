"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/auth/use-login";
import { LoginBranding } from "@/components/auth/LoginBranding";
import { LoginForm } from "@/components/auth/LoginForm";
import { ContactDialog } from "@/components/auth/ContactDialog";

export default function LoginPage() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const loginForm = useLogin();

  return (
    <div className="min-h-screen bg-white flex">
      <LoginBranding />
      <LoginForm
        {...loginForm}
        onOpenContact={() => setIsContactDialogOpen(true)}
      />
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
      />
    </div>
  );
}
