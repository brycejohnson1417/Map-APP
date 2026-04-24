import type { WorkspacePrimitiveId } from "@/lib/domain/workspace";

export interface PrimitiveDefinition {
  id: WorkspacePrimitiveId;
  name: string;
  description: string;
  status: "active" | "emerging" | "planned";
  configKeys: string[];
  surfaces: string[];
}
