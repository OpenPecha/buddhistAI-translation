import React, { useMemo } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { FileText, BookOpen, Languages, Loader2 } from 'lucide-react';
import type { LinkedResource } from '@/api/openpecha';
import './prompt-mentions.css';

const MentionsInputComponent = MentionsInput as any;
const MentionComponent = Mention as any;

const PLACEHOLDER_LOADING = '__loading__';
const PLACEHOLDER_EMPTY = '__empty__';

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

const isPlaceholder = (id: string) =>
    id === PLACEHOLDER_LOADING || id === PLACEHOLDER_EMPTY;

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

    const displayData: SuggestionData[] = useMemo(() => {
        if (isLoadingResources) {
            return [{
                id: PLACEHOLDER_LOADING,
                display: 'Loading linked resources…',
                relationship: '',
                language: '',
            }];
        }
        if (mentionData.length === 0) {
            return [{
                id: PLACEHOLDER_EMPTY,
                display: 'No linked resources available',
                relationship: '',
                language: '',
            }];
        }
        return mentionData;
    }, [isLoadingResources, mentionData]);

    return (
        <div className="space-y-1">
            <MentionsInputComponent
                id={id}
                value={value}
                onChange={(_: any, newValue: string) => {
                    if (
                        newValue.includes(`{{${PLACEHOLDER_LOADING}}}`) ||
                        newValue.includes(`{{${PLACEHOLDER_EMPTY}}}`)
                    ) {
                        return;
                    }
                    onChange(newValue);
                }}
                placeholder={placeholder}
                className="prompt-mentions"
                allowSuggestionsAboveCursor
            >
                <MentionComponent
                    trigger="{{"
                    markup="{{__id__}}"
                    data={displayData}
                    displayTransform={(mentionId: string) => {
                        if (isPlaceholder(mentionId)) return '';
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
                    ) => {
                        if (suggestion.id === PLACEHOLDER_LOADING) {
                            return (
                                <div className="prompt-mention-placeholder flex items-center gap-2 py-1 px-1">
                                    <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {suggestion.display}
                                    </span>
                                </div>
                            );
                        }
                        if (suggestion.id === PLACEHOLDER_EMPTY) {
                            return (
                                <div className="prompt-mention-placeholder flex items-center gap-2 py-1 px-1">
                                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {suggestion.display}
                                    </span>
                                </div>
                            );
                        }
                        return (
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
                        );
                    }}
                />
            </MentionsInputComponent>
            <p className="text-xs text-muted-foreground">
                Type{' '}
                <code className="bg-muted px-1 rounded text-xs">{'{{'}</code>{' '}
                to insert a linked resource variable
            </p>
        </div>
    );
};

export default PromptTextarea;
