import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { createNip98Event } from "@/lib/nostr";
import { useAuthStore } from "@/store/auth";
import { Link2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleLogin() {
    setLoading(true);
    try {
      const loginUrl =
        (import.meta.env.VITE_API_URL || window.location.origin) +
        "/api/users/login";
      const event = await createNip98Event(loginUrl, "POST");
      const { token } = await api.login(event);
      login(token);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Link2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">ors.sh</CardTitle>
          <CardDescription>Short links powered by Nostr</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in with Nostr"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Requires a Nostr browser extension (e.g. Alby, nos2x)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
