import { DataProviderError, type ApiErrorPayload } from "@/types/domain";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${DEFAULT_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }
    throw new DataProviderError(
      payload?.message || `Erro na requisição (${response.status}).`,
      payload?.status ?? response.status,
      payload?.fieldErrors
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
