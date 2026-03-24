import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgentDetail } from "@/api/queries/agents";
import { Badge } from "@/components/ui/badge";
import { Shield, BookOpen } from "lucide-react";

interface AgentDetailModalProps {
  agentId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agentId,
  open,
  onOpenChange,
}) => {
  const { agent, error } = useAgentDetail(agentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Assistant Details
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="py-4 text-destructive">
            Failed to load assistant details: {error}
          </div>
        )}

        {agent && (
          <div className="space-y-4 overflow-y-auto py-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{agent.name}</p>
                {agent.system_assistance && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="size-3 mr-1" />
                    System
                  </Badge>
                )}
              </div>
              {agent.description && (
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">
                Created By
              </div>
              <p className="text-sm">{agent.created_by}</p>
            </div>

            {agent.contexts && agent.contexts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="size-4" />
                  Contexts ({agent.contexts.length})
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {agent.contexts.map((context) => (
                    <div
                      key={context.id}
                      className="bg-muted rounded-md p-3 space-y-2"
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {context.content}
                      </div>
                      {(context.pecha_title || context.pecha_text_id) && (
                        <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1">
                          {context.pecha_title && (
                            <div>
                              <span className="font-medium">Title:</span>{" "}
                              {context.pecha_title}
                            </div>
                          )}
                          {context.pecha_text_id && (
                            <div>
                              <span className="font-medium">Text ID:</span>{" "}
                              {context.pecha_text_id}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailModal;
