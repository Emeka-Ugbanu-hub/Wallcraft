export type ProjectMeta = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  format: string;
  packLabel?: string;
};

export type ProjectFile = {
  meta: ProjectMeta;
  data: Record<string, unknown>;
  version: number;
};

const RECENT_KEY = "wallcraft_recent_projects";
const MAX_RECENT = 12;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function serializeProject(meta: ProjectMeta, data: Record<string, unknown>): string {
  const file: ProjectFile = { meta, data, version: 1 };
  return JSON.stringify(file, null, 2);
}

export function deserializeProject(raw: string): ProjectFile | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.meta || !parsed.data) return null;
    return parsed as ProjectFile;
  } catch {
    return null;
  }
}

export function downloadProject(meta: ProjectMeta, data: Record<string, unknown>) {
  const json = serializeProject(meta, data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meta.name.replace(/[^a-z0-9]/gi, "_").slice(0, 32)}.wallcraft`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readProjectFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = deserializeProject(String(reader.result));
      if (result) resolve(result);
      else reject(new Error("Invalid project file"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function loadRecentProjects(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecentProject(meta: ProjectMeta) {
  const recents = loadRecentProjects();
  const filtered = recents.filter((r) => r.id !== meta.id);
  filtered.unshift(meta);
  localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
}

export function deleteRecentProject(id: string) {
  const recents = loadRecentProjects().filter((r) => r.id !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
}

export function createProjectMeta(
  name: string,
  format: string,
  packLabel?: string,
): ProjectMeta {
  const now = Date.now();
  return {
    id: uid(),
    name: name || "Untitled",
    createdAt: now,
    updatedAt: now,
    format,
    packLabel,
  };
}
