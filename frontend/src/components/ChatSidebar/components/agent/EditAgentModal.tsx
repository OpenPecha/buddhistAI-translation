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
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAgentDetail, useUpdateAgent } from "@/api/queries/agents";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentContext } from "@/api/agent";

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
  const [contexts, setContexts] = useState<AgentContext[]>([]);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || "",
        source_type: agent.source_type || "",
        system_prompt: agent.system_prompt || "",
        system_assistance: agent.system_assistance,
      });
      setContexts(agent.contexts ?? []);
    }
  }, [agent]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveContext = (contextId: string) => {
    setContexts((prev) => prev.filter((ctx) => ctx.id !== contextId));
  };

  const handleEditContext = (contextId: string, newContent: string) => {
    setContexts((prev) =>
      prev.map((ctx) =>
        ctx.id === contextId ? { ...ctx, content: newContent } : ctx
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentId) return;

    if (!formData.name.trim() || !formData.system_prompt.trim()) {
      toast.error("Name and System Prompt are required");
      return;
    }

    const mappedContexts = contexts.map((ctx) => ({
      content: ctx.content || null,
      pecha_title: ctx.pecha_title || null,
      pecha_text_id: ctx.pecha_text_id || null,
    }));

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
          toast.success("Agent updated successfully!");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Failed to update agent: ${err.message}`);
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
            Edit Agent
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
            Failed to load agent details: {error}
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

            {contexts.length > 0 && (
              <div className="space-y-2">
                <Label>Contexts ({contexts.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contexts.map((ctx) => (
                    <div
                      key={ctx.id}
                      className="bg-muted rounded-md p-3 text-sm flex gap-2 items-start"
                    >
                      <div className="flex-1 min-w-0">
                        {ctx.pecha_title ? (
                          <>
                            <p className="whitespace-pre-wrap break-words line-clamp-3">
                              {ctx.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ctx.pecha_title}
                            </p>
                          </>
                        ) : (
                          <Textarea
                            value={ctx.content}
                            onChange={(e) =>
                              handleEditContext(ctx.id, e.target.value)
                            }
                            rows={2}
                            className="bg-background rounded-md border-none"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveContext(ctx.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Agent"
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
