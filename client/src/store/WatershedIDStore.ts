import { create } from "zustand";

type WatershedIDState = {
    id: string | null;
    setId: (id: string | null) => void;
};

export const useWatershedIDStore = create<WatershedIDState>((set) => ({
    id: null,
    setId: (id) => set({ id }),
}));