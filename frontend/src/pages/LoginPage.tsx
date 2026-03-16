import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { createNip98Event, createNip98EventFromPrivkey } from "@/lib/nostr";
import { useAuthStore } from "@/store/auth";
import { Link2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPrivkey, setShowPrivkey] = useState(false);
  const [nsecValue, setNsecValue] = useState("");
  const [privkeyLoading, setPrivkeyLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const loginUrl =
    (import.meta.env.VITE_API_URL || window.location.origin) +
    "/api/users/login";

  async function handleLogin() {
    setLoading(true);
    try {
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

  async function handlePrivkeyLogin() {
    setPrivkeyLoading(true);
    try {
      const event = createNip98EventFromPrivkey(
        loginUrl,
        "POST",
        nsecValue.trim(),
      );
      const { token } = await api.login(event);
      login(token);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPrivkeyLoading(false);
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
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in with Nostr"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Requires a Nostr browser extension (e.g. Alby, nos2x)
          </p>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setShowPrivkey((v) => !v)}
            >
              {showPrivkey
                ? "Hide private key option"
                : "Use private key (insecure)"}
            </button>
          </div>
          {showPrivkey && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-destructive font-medium">
                Warning: entering your private key in a browser is insecure.
                Only use this for development or testing.
              </p>
              <Input
                type="password"
                placeholder="nsec1..."
                value={nsecValue}
                onChange={(e) => setNsecValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePrivkeyLogin();
                }}
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={handlePrivkeyLogin}
                disabled={privkeyLoading || !nsecValue.trim()}
              >
                {privkeyLoading ? "Signing in..." : "Sign in with private key"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
