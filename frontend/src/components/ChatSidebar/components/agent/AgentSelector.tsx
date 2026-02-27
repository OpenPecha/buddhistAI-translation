import React, { useState } from "react";
import { useAgents } from "@/api/queries/agents";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot } from "lucide-react";

interface AgentSelectorProps {
    value?: string;
    onValueChange?: (value: string) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
    value,
    onValueChange,
}) => {
    const [selectedAgent, setSelectedAgent] = useState<string | undefined>(value);
    const { agents, isLoading, error } = useAgents();

    const handleValueChange = (newValue: string) => {
        setSelectedAgent(newValue);
        onValueChange?.(newValue);
    };

    if (error) {
        return (
            <div className="flex items-center gap-2 text-destructive text-sm">
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
        <div className="flex flex-col gap-2">
            <Select value={selectedAgent} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an agent">
                        {selectedAgent && (
                            <div className="flex items-center gap-2">
                                <Bot className="size-4" />
                                <span>
                                    {agents.find((a) => a.id === selectedAgent)?.name ||
                                        "Select agent"}
                                </span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                                <Bot className="size-4" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{agent.name}</span>
                                    {agent.description && (
                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                            {agent.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default AgentSelector;