import {
  createInitialMockState,
  MOCK_STATE_VERSION,
  type MockDatabaseState,
} from "@/services/mock/seed";

export const MOCK_STORAGE_KEY = "atai_mock_state_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadMockState(): MockDatabaseState {
  if (!isBrowser()) {
    return createInitialMockState();
  }

  try {
    const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialMockState();
      saveMockState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<MockDatabaseState>;
    if (
      !parsed ||
      parsed.version !== MOCK_STATE_VERSION ||
      !Array.isArray(parsed.escolas) ||
      !Array.isArray(parsed.usuarios) ||
      !Array.isArray(parsed.prioridades) ||
      !Array.isArray(parsed.reunioes) ||
      !Array.isArray(parsed.atas) ||
      !parsed.nextIds
    ) {
      const initial = createInitialMockState();
      saveMockState(initial);
      return initial;
    }

    return parsed as MockDatabaseState;
  } catch {
    const initial = createInitialMockState();
    saveMockState(initial);
    return initial;
  }
}

export function saveMockState(state: MockDatabaseState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falha de cota do navegador
  }
}

export function resetMockState(): MockDatabaseState {
  const initial = createInitialMockState();
  saveMockState(initial);
  return initial;
}
