import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAgents } from "@/api/queries/agents";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentDoc } from "@/hooks/useCurrentDoc";
import { useFetchLinkedResources } from "@/api/queries/openpecha_api";
import NewAgentForm from "./NewAgentForm";

interface AgentSelectorProps {
    value?: string;
    onValueChange?: (value: string) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
    value,
    onValueChange,
}) => {
    const [selectedAgent, setSelectedAgent] = useState<string | undefined>(value);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { agents, isLoading, error } = useAgents();

    const { id: documentId } = useParams<{ id: string }>();
    const { currentDoc } = useCurrentDoc(documentId);
    const textId = (currentDoc?.metadata?.textId ?? currentDoc?.metadata?.text_id) as string | undefined;
    useFetchLinkedResources(textId);

    const handleValueChange = (newValue: string) => {
        setSelectedAgent(newValue);
        onValueChange?.(newValue);
    };

    if (error) {
        return (
            <div className="flex items-center gap-2 text-destructive w-full justify-center text-sm">
                <span>Failed to load agents</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col mr-1">
            <div className="flex items-center gap-1">
                <Select value={selectedAgent} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full ">
                        <SelectValue placeholder="Choose a Skill">
                            {selectedAgent && (
                                <div className="flex items-center gap-2 truncate">
                                    <Bot className="size-4" />
                                    <span className="truncate w-35">
                                        {agents.find((a) => a.id === selectedAgent)?.name ||
                                            "Select Skill"}
                                    </span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[90vh] overflow-y-auto w-xs ">
                        {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{agent.name}</span>
                                        {agent.description && (
                                            <span className="text-xs text-muted-foreground">
                                                {agent.description}
                                            </span>
                                        )}
                                    </div>
                                    {agent.system_assistance && (
                                        <Badge variant="outline" className="text-xs">
                                            <Shield className="size-4" />
                                            System
                                        </Badge>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Plus className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className=" min-w-5xl max-md:min-w-screen" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Create New Skill</DialogTitle>
                            <DialogDescription>
                                Create a new skill with custom Prompt and Contexts.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <NewAgentForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AgentSelector;