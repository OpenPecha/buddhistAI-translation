import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAgentDetail, useUpdateAgent } from "@/api/queries/agents";
import { Skeleton } from "@/components/ui/skeleton";
import ContextManager, {
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
          toast.success("Assistant updated successfully!");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Failed to update assistant: ${err.message}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Assistant
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="py-4 text-destructive">
            Failed to load assistant details: {error}
          </div>
        )}

        {agent && (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-system-prompt">System Prompt</Label>
              <Textarea
                id="edit-system-prompt"
                value={formData.system_prompt}
                onChange={(e) =>
                  handleInputChange("system_prompt", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-prompt">User Prompt *</Label>
              <PromptTextarea
                id="edit-user-prompt"
                placeholder="You are a helpful translation assistant..."
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

            <div className="flex items-center gap-2">
              <Switch
                id="edit-system-assistance"
                checked={formData.system_assistance}
                onCheckedChange={(checked) =>
                  handleInputChange("system_assistance", checked)
                }
              />
              <Label htmlFor="edit-system-assistance" className="cursor-pointer">
                System Assistance
              </Label>
            </div>

            <ContextManager contexts={contexts} onChange={setContexts} />

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
                  "Update Assistant"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAgentModal;
