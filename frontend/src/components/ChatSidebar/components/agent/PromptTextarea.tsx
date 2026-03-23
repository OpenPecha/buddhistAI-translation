import React, { useMemo } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { FileText, BookOpen, Languages, Loader2 } from 'lucide-react';
import type { LinkedResource } from '@/api/openpecha';
import './prompt-mentions.css';

const MentionsInputComponent = MentionsInput as any;
const MentionComponent = Mention as any;

interface PromptTextareaProps {
    value: string;
    onChange: (value: string) => void;
    linkedResources?: LinkedResource[];
    isLoadingResources?: boolean;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    id?: string;
}

const RELATIONSHIP_ICONS: Record<string, React.ReactNode> = {
    commentary: <BookOpen className="size-3.5 shrink-0" />,
    translation: <Languages className="size-3.5 shrink-0" />,
};

function getResourceTitle(resource: LinkedResource): string {
    const titleObj = resource.metadata.title;
    return Object.values(titleObj)[0] ?? resource.instance_id;
}

interface SuggestionData {
    id: string;
    display: string;
    relationship: string;
    language: string;
}

const PromptTextarea: React.FC<PromptTextareaProps> = ({
    value,
    onChange,
    linkedResources = [],
    isLoadingResources = false,
    placeholder,
    id,
}) => {
    const mentionData: SuggestionData[] = useMemo(
        () =>
            linkedResources.map((r) => ({
                id: r.instance_id,
                display: getResourceTitle(r),
                relationship: r.relationship,
                language: r.metadata.language,
            })),
        [linkedResources]
    );

    const resourceMap = useMemo(
        () =>
            new Map(
                linkedResources.map((r) => [r.instance_id, r])
            ),
        [linkedResources]
    );

    const hintContent = isLoadingResources ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Loading linked resources…
        </p>
    ) : linkedResources.length === 0 ? (
        <p className="text-xs text-muted-foreground">
            No linked resources available
        </p>
    ) : (
        <p className="text-xs text-muted-foreground">
            Type{' '}
            <code className="bg-muted px-1 rounded text-xs">{'{{'}</code>{' '}
            to insert a linked resource variable
        </p>
    );

    return (
        <div className="space-y-1">
            <MentionsInputComponent
                id={id}
                value={value}
                onChange={(_: any, newValue: string) => onChange(newValue)}
                placeholder={placeholder}
                className="prompt-mentions"
                allowSuggestionsAboveCursor
            >
                <MentionComponent
                    trigger="{{"
                    markup="{{__id__}}"
                    data={mentionData}
                    displayTransform={(mentionId: string) => {
                        const resource = resourceMap.get(mentionId);
                        const title = resource
                            ? getResourceTitle(resource)
                            : mentionId;
                        return `{{${title}}}`;
                    }}
                    className="prompt-mention-highlight"
                    appendSpaceOnAdd
                    renderSuggestion={(
                        suggestion: SuggestionData,
                        _search: string,
                        _highlightedDisplay: React.ReactNode,
                        _index: number,
                        focused: boolean
                    ) => (
                        <div className="flex items-start gap-2">
                            {RELATIONSHIP_ICONS[suggestion.relationship] ?? (
                                <FileText className="size-3.5 mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`font-medium leading-snug line-clamp-1 text-sm ${focused ? 'text-accent-foreground' : ''
                                        }`}
                                >
                                    {suggestion.display}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {suggestion.id}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                                {suggestion.relationship}
                            </span>
                        </div>
                    )}
                />
            </MentionsInputComponent>
            {hintContent}
        </div>
    );
};

export default PromptTextarea;
