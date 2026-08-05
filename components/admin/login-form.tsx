"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  providers: Array<{
    id: string;
    name: string;
  }>;
  credentialsEnabled: boolean;
};

export function LoginForm({
  providers,
  credentialsEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setError("");
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/admin",
    });

    if (result?.error) {
      setError("Sign in failed.");
      return;
    }

    router.push(result?.url ?? "/admin");
    router.refresh();
  }

  return (
    <div className="grid max-w-md gap-4 border-[6px] border-foreground p-6">
      {providers
        .filter((provider) => provider.id !== "credentials")
        .map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="primary"
            onClick={() =>
              signIn(provider.id, {
                callbackUrl: searchParams.get("callbackUrl") ?? "/admin",
              })
            }
          >
            Sign in with {provider.name}
          </Button>
        ))}

      {credentialsEnabled ? (
        <form action={submit} className="grid gap-4 border-t-2 border-foreground pt-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit">Sign in with password</Button>
        </form>
      ) : null}

      {providers.length === 0 ? (
        <p className="font-bold">
          Configure GitHub or Google OAuth environment variables to enable admin
          sign-in.
        </p>
      ) : null}

      {error ? <p className="font-bold text-cmm-coral">{error}</p> : null}
    </div>
  );
}
