import React, { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Import, Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useAgentDetail, useUpdateAgent } from "@/api/queries/agents";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ContextItem,
  toContextItems,
  toApiContexts,
} from "./ContextManager";
import PromptTextarea from "./PromptTextarea";
import { extractPromptVariables } from "./utils";
import { useParams } from "react-router-dom";
import { useCurrentDoc } from "@/hooks/useCurrentDoc";
import { useFetchLinkedResources } from "@/api/queries/openpecha_api";
import { useModels } from "@/api/queries/models";
import { ModelName, TARGET_LANGUAGES, type TargetLanguage } from "@/api/translate";
import { useMutation } from "@tanstack/react-query";
import { enhanceSystemPrompt } from "@/api/agent";

interface EditAgentModalProps {
  agentId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditAgentModal: React.FC<EditAgentModalProps> = ({
  agentId,
  open,
  onOpenChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { agent, isLoading, error } = useAgentDetail(agentId);
  const updateMutation = useUpdateAgent();
  const { models } = useModels();
  const { id: documentId } = useParams<{ id: string }>();
  const { currentDoc } = useCurrentDoc(documentId);
  const textId = (currentDoc?.metadata?.textId ?? currentDoc?.metadata?.text_id) as string | undefined;
  const { data: linkedResources, isLoading: isLoadingResources } = useFetchLinkedResources(textId);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    user_prompt: "",
    language: "" as TargetLanguage,
    model_name: "" as ModelName,
    system_assistance: false,
  });
  const [contexts, setContexts] = useState<ContextItem[]>([]);

  useEffect(() => {
    if (agent && open) {
      setFormData({
        name: agent.name,
        description: agent.description || "",
        system_prompt: agent.system_prompt || "",
        user_prompt: agent.user_prompt || "",
        language: (agent.language || "") as TargetLanguage,
        model_name: (agent.model || "") as ModelName,
        system_assistance: agent.system_assistance,
      });
      setContexts(toContextItems(agent.contexts ?? []));
    }
  }, [agent, open]);

  const handleImportSkill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        setFormData(prev => ({ ...prev, system_prompt: content.trim() }));
        toast.info('No frontmatter found — imported file content as System Prompt.');
        return;
      }

      const rawFrontmatter = match[1];
      const body = match[2];
      const nameMatch = rawFrontmatter.match(/name:\s*(.+)/i);
      const descMatch = rawFrontmatter.match(/description:\s*(.+)/i);

      setFormData(prev => ({
        ...prev,
        name: nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, '') : prev.name,
        description: descMatch ? descMatch[1].trim().replace(/^['"]|['"]$/g, '') : prev.description,
        system_prompt: body.trim(),
      }));

      toast.success('Skill file imported!');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentId) return;

    if (!formData.name.trim() || !formData.system_prompt.trim()) {
      toast.error("Name and System Prompt are required");
      return;
    }

    const mappedContexts = toApiContexts(contexts) as {
      content: string | null;
      pecha_title: string | null;
      pecha_text_id: string | null;
    }[];

    const variables = extractPromptVariables(formData.user_prompt, linkedResources);

    updateMutation.mutate(
      {
        agentId,
        data: {
          name: formData.name,
          description: formData.description,
          system_prompt: formData.system_prompt,
          user_prompt: formData.user_prompt,
          language: formData.language,
          model: formData.model_name,
          contexts: mappedContexts,
          system_assistance: formData.system_assistance,
          ...(variables.length > 0 && { variables }),
        },
      },
      {
        onSuccess: () => {
          toast.success("Skill updated successfully!");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Failed to update skill: ${err.message}`);
        },
      }
    );
  };

  const enhanceMutation = useMutation({
    mutationFn: (prompt: string) => enhanceSystemPrompt(prompt),
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, system_prompt: data.enhanced_prompt }));
      toast.success('System Prompt enhanced!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to enhance System Prompt: ${error.message}`);
    },
  });

  const handleGenerateSystemPrompt = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    enhanceMutation.mutate(formData.system_prompt);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Skill</SheetTitle>
          <SheetDescription>
            Update your skill's behavior, prompts, and settings.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          {isLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <div className="py-4 text-destructive">
              Failed to load skill details: {error}
            </div>
          )}

          {agent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                className="hidden"
                onChange={handleImportSkill}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 w-fit"
                onClick={() => fileInputRef.current?.click()}
              >
                <Import className="size-4" />
                Import Skill
              </Button>
              <div className="flex max-md:flex-col gap-x-2 overflow-y-auto">
                <div className="space-y-4 flex-2">

                  <div className="flex gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-fit"
                        required
                      />
                    </div>

                    <div className="space-y-2 w-full">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        placeholder="What does this skill do?"
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <Label htmlFor="edit-system-prompt">System Prompt</Label>
                      <Button
                        onClick={handleGenerateSystemPrompt}
                        variant="outline"
                        size="icon"
                        disabled={formData.system_prompt.trim() === '' || enhanceMutation.isPending}
                      >
                        {enhanceMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <WandSparkles className="text-gray-500 dark:text-gray-300" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="edit-system-prompt"
                      placeholder="Define the Skill's behavior and role..."
                      value={formData.system_prompt}
                      onChange={(e) =>
                        handleInputChange("system_prompt", e.target.value)
                      }
                      rows={7}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-user-prompt">User Prompt *</Label>
                    <PromptTextarea
                      id="edit-user-prompt"
                      placeholder="Select a commentary / translation from .."
                      value={formData.user_prompt}
                      onChange={(val) => handleInputChange("user_prompt", val)}
                      linkedResources={linkedResources}
                      isLoadingResources={isLoadingResources}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Language
                      </Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value: TargetLanguage) =>
                          handleInputChange("language", value)
                        }
                      >
                        <SelectTrigger className="h-9 w-fit">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 w-full">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Model
                      </Label>
                      <Select
                        value={formData.model_name}
                        onValueChange={(value: ModelName) =>
                          handleInputChange("model_name", value)
                        }
                      >
                        <SelectTrigger className="h-9 w-fit" disabled={updateMutation.isPending}>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.is_thinking && <Brain className="size-4" />}
                              {model.name}
                              <span className="text-xs text-gray-500">{model.provider}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>
                {/* <ContextManager contexts={contexts} onChange={setContexts} /> */}

              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Skill"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditAgentModal;
