export type Snapshot = Record<string, unknown>;

type HistoryState = {
  past: string[];
  future: string[];
};

let internal: HistoryState = { past: [], future: [] };

export function createUndoRedo(maxSize = 50) {
  return {
    get canUndo() {
      return internal.past.length > 0;
    },
    get canRedo() {
      return internal.future.length > 0;
    },
    get stackSize() {
      return internal.past.length;
    },
    push(snapshot: Snapshot) {
      internal.past.push(JSON.stringify(snapshot));
      if (internal.past.length > maxSize) internal.past.shift();
      internal.future = [];
    },
    undo(currentSnapshot: Snapshot): Snapshot | null {
      if (internal.past.length === 0) return null;
      internal.future.push(JSON.stringify(currentSnapshot));
      return JSON.parse(internal.past.pop()!);
    },
    redo(currentSnapshot: Snapshot): Snapshot | null {
      if (internal.future.length === 0) return null;
      internal.past.push(JSON.stringify(currentSnapshot));
      return JSON.parse(internal.future.pop()!);
    },
    reset() {
      internal = { past: [], future: [] };
    },
  };
}
