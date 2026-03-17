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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAgentDetail, useUpdateAgent } from "@/api/queries/agents";
import { Skeleton } from "@/components/ui/skeleton";
import ContextManager, {
  type ContextItem,
  toContextItems,
  toApiContexts,
} from "./ContextManager";

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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source_type: "",
    system_prompt: "",
    system_assistance: false,
  });
  const [contexts, setContexts] = useState<ContextItem[]>([]);

  useEffect(() => {
    if (agent && open) {
      setFormData({
        name: agent.name,
        description: agent.description || "",
        source_type: agent.source_type || "",
        system_prompt: agent.system_prompt || "",
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

    updateMutation.mutate(
      {
        agentId,
        data: {
          name: formData.name,
          source_type: formData.source_type,
          description: formData.description,
          system_prompt: formData.system_prompt,
          contexts: mappedContexts,
          system_assistance: formData.system_assistance,
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
              <Label htmlFor="edit-source-type">Source Type</Label>
              <Input
                id="edit-source-type"
                value={formData.source_type}
                onChange={(e) =>
                  handleInputChange("source_type", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-system-prompt">System Prompt *</Label>
              <Textarea
                id="edit-system-prompt"
                value={formData.system_prompt}
                onChange={(e) =>
                  handleInputChange("system_prompt", e.target.value)
                }
                rows={4}
                required
              />
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
