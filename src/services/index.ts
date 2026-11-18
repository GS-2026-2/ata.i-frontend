import { ApiDataProvider } from "@/services/api/api-provider";
import type { DataProvider } from "@/services/data-provider";
import { MockDataProvider } from "@/services/mock/mock-provider";

const mode = process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";

let cachedProvider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!cachedProvider) {
    cachedProvider =
      mode === "api" ? new ApiDataProvider() : new MockDataProvider();
  }
  return cachedProvider;
}
