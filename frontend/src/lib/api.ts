import { useAuthStore } from "@/store/auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface Link {
  id: number;
  url: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const err = new Error(body.message || "Request failed") as Error & {
      status: number;
      retryAfterMs?: number;
    };
    err.status = res.status;
    err.retryAfterMs = body.retryAfterMs;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login(event: object) {
    return request<{ token: string }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  getLinks() {
    return request<Link[]>("/api/links");
  },
  createLink(url: string) {
    return request<Link>("/api/links", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },
  updateLink(id: number, url: string) {
    return request<Link>(`/api/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ url }),
    });
  },
  deleteLink(id: number) {
    return request<void>(`/api/links/${id}`, { method: "DELETE" });
  },
};
