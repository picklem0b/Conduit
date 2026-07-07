import type {
   ProviderCategory,
   ModelCapability
} from "@providers/provider.types";

// ── Capability descriptors ────────────────────────────────────────────────────

export interface CapabilityDescriptor {
   id: string;
   label: string;
   description: string;
   category: ProviderCategory;
}

/**
 * Full capability registry. Every known capability across all provider
 * categories is described here so the tester interface can render rich,
 * human-readable explanations rather than raw capability strings.
 */
export const CAPABILITY_DESCRIPTORS: Record<string, CapabilityDescriptor> = {
   chat: {
      id: "chat",
      label: "Text Chat",
      description: "Send and receive text messages in a conversation.",
      category: "chat"
   },
   vision: {
      id: "vision",
      label: "Vision / Image Input",
      description: "Attach images and ask questions about them.",
      category: "chat"
   },
   function_calling: {
      id: "function_calling",
      label: "Function Calling",
      description: "The model can call structured functions you define.",
      category: "chat"
   },
   json_mode: {
      id: "json_mode",
      label: "JSON Mode",
      description: "Force the model to respond with valid JSON output.",
      category: "chat"
   },
   streaming: {
      id: "streaming",
      label: "Streaming",
      description:
         "Responses stream token-by-token instead of waiting for the full reply.",
      category: "chat"
   },
   image_generation: {
      id: "image_generation",
      label: "Image Generation",
      description: "Generate images from text prompts.",
      category: "image"
   },
   web_search: {
      id: "web_search",
      label: "Web Search",
      description: "Search the live web and return ranked results.",
      category: "search"
   },
   code_execution: {
      id: "code_execution",
      label: "Code Execution",
      description: "Run code in a sandboxed environment and return the output.",
      category: "code"
   }
};

export function describeCapabilities(
   capabilities: ModelCapability[]
): CapabilityDescriptor[] {
   return capabilities
      .map(cap => CAPABILITY_DESCRIPTORS[cap])
      .filter((d): d is CapabilityDescriptor => d !== undefined);
}

export function summarizeCapabilities(capabilities: ModelCapability[]): string {
   const labels = describeCapabilities(capabilities).map(d => d.label);
   if (labels.length === 0) return "No detected capabilities";
   if (labels.length === 1) return labels[0]!;
   return labels.slice(0, -1).join(", ") + " and " + labels.at(-1);
}
