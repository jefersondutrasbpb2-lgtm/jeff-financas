import { create } from 'zustand';

interface UiStore {
  showBalance: boolean;
  toggleBalance: () => void;
}

/** Pure client-side UI state. All financial data lives in Supabase — see lib/queries.ts. */
export const useUiStore = create<UiStore>((set) => ({
  showBalance: true,
  toggleBalance: () => set((s) => ({ showBalance: !s.showBalance })),
}));
