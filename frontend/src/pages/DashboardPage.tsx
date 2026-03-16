import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type Link } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Copy, ExternalLink, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function useCountdown(ms: number | null) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ms == null || ms <= 0) {
      setRemaining(0);
      return;
    }
    const end = Date.now() + ms;
    setRemaining(ms);
    intervalRef.current = setInterval(() => {
      const left = end - Date.now();
      if (left <= 0) {
        setRemaining(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setRemaining(left);
      }
    }, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ms]);

  return remaining;
}

const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

function shortUrl(id: number) {
  return `${BASE_URL}/${id}`;
}

export function DashboardPage() {
  const logout = useAuthStore((s) => s.logout);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [editLink, setEditLink] = useState<Link | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteLink, setDeleteLink] = useState<Link | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rateLimitMs, setRateLimitMs] = useState<number | null>(null);
  const countdown = useCountdown(rateLimitMs);

  const fetchLinks = useCallback(async () => {
    try {
      const data = await api.getLinks();
      setLinks(data);
    } catch {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  function handleRateLimit(retryAfterMs: number) {
    setRateLimitMs(retryAfterMs);
    toast.error(`Rate limited - try again in ${Math.ceil(retryAfterMs / 1000)}s`);
  }

  async function handleCreate() {
    setCreateLoading(true);
    try {
      const link = await api.createLink(createUrl);
      setLinks((prev) => [link, ...prev]);
      setCreateOpen(false);
      setCreateUrl("");
      toast.success(`Short link created: ors.sh/${link.id}`);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; retryAfterMs?: number };
      if (e.status === 429 && e.retryAfterMs) {
        handleRateLimit(e.retryAfterMs);
      } else {
        toast.error(e.message || "Failed to create link");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit() {
    if (!editLink) return;
    setEditLoading(true);
    try {
      const updated = await api.updateLink(editLink.id, editUrl);
      setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditLink(null);
      toast.success("Link updated");
    } catch (err: unknown) {
      const e = err as Error & { status?: number; retryAfterMs?: number };
      if (e.status === 429 && e.retryAfterMs) {
        handleRateLimit(e.retryAfterMs);
      } else {
        toast.error(e.message || "Failed to update link");
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteLink) return;
    setDeleteLoading(true);
    try {
      await api.deleteLink(deleteLink.id);
      setLinks((prev) => prev.filter((l) => l.id !== deleteLink.id));
      setDeleteLink(null);
      toast.success("Link deleted");
    } catch (err: unknown) {
      const e = err as Error & { status?: number; retryAfterMs?: number };
      if (e.status === 429 && e.retryAfterMs) {
        handleRateLimit(e.retryAfterMs);
      } else {
        toast.error(e.message || "Failed to delete link");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  const isRateLimited = countdown > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">ors.sh</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Your links</h2>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={isRateLimited}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRateLimited
              ? `Wait ${Math.ceil(countdown / 1000)}s`
              : "New link"}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">No links yet. Create one!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short URL</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">ors.sh/{link.id}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(shortUrl(link.id));
                          toast.success("Copied!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline max-w-xs truncate"
                    >
                      {link.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isRateLimited}
                        onClick={() => {
                          setEditLink(link);
                          setEditUrl(link.url);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isRateLimited}
                        onClick={() => setDeleteLink(link)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create short link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-url">Target URL</Label>
              <Input
                id="create-url"
                type="url"
                placeholder="https://example.com"
                value={createUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUrl(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !createUrl}
            >
              {createLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editLink} onOpenChange={(open: boolean) => !open && setEditLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit link /{editLink?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Target URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={editUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUrl(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editLoading || !editUrl}>
              {editLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteLink}
        onOpenChange={(open: boolean) => !open && setDeleteLink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete link /{deleteLink?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the short link pointing to{" "}
              <strong>{deleteLink?.url}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
