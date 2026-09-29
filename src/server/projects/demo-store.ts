import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import graph from "../../../fixtures/knowledge-graph.json";
import { createDemoProject, type DemoProject } from "@/domain/demo-project";

const dataDirectory = path.join(process.cwd(), ".data");
const projectFile = path.join(dataDirectory, "demo-project.json");
let pendingWrite: Promise<unknown> = Promise.resolve();

export function demoContentFingerprint(): string {
  return createHash("sha256").update(JSON.stringify(graph.documents)).digest("hex");
}

function isStoredProject(value: unknown): value is DemoProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<DemoProject>;
  return project.id === "demo-project-01" && project.patternVersionId === "pattern-version.everyday-blouse.0-1-0" &&
    Number.isInteger(project.currentSequence) && Array.isArray(project.revisions) &&
    (project.fabricWidthCm === 110 || project.fabricWidthCm === 140) &&
    !!project.completedStepRevision && typeof project.completedStepRevision === "object";
}

export async function getDemoProject(): Promise<DemoProject> {
  try {
    const project: unknown = JSON.parse(await readFile(projectFile, "utf8"));
    if (!isStoredProject(project)) throw new Error("The saved local demo project failed validation.");
    return project;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return createDemoProject(demoContentFingerprint());
    throw error;
  }
}

export async function updateDemoProject(change: (project: DemoProject) => DemoProject): Promise<DemoProject> {
  const result = pendingWrite.then(async () => {
    const current = await getDemoProject();
    const next = change(current);
    if (next === current) return current;
    await mkdir(dataDirectory, { recursive: true });
    const tempFile = path.join(dataDirectory, `demo-project-${process.pid}-${Date.now()}.tmp`);
    await writeFile(tempFile, JSON.stringify(next, null, 2), { encoding: "utf8", flag: "wx" });
    await rename(tempFile, projectFile);
    return next;
  });
  pendingWrite = result.then(() => undefined, () => undefined);
  return result;
}
