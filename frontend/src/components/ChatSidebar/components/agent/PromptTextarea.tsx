import React, { useCallback, useMemo } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { FileText, BookOpen, Languages, Loader2 } from 'lucide-react';
import type { LinkedResource } from '@/api/openpecha';
import './prompt-mentions.css';

const MentionsInputComponent = MentionsInput as any;
const MentionComponent = Mention as any;

const ALL_PREFIX = '__all_';

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
    const resourcesByType = useMemo(() => {
        const grouped: Record<string, LinkedResource[]> = {};
        for (const r of linkedResources) {
            (grouped[r.relationship] ??= []).push(r);
        }
        return grouped;
    }, [linkedResources]);

    const mentionData: SuggestionData[] = useMemo(() => {
        const allEntries: SuggestionData[] = Object.entries(resourcesByType)
            .filter(([, resources]) => resources.length > 1)
            .map(([type, resources]) => ({
                id: `${ALL_PREFIX}${type}__`,
                display: `All ${type} (${resources.length})`,
                relationship: type,
                language: '',
            }));

        const individualEntries: SuggestionData[] = linkedResources.map((r) => ({
            id: r.instance_id,
            display: getResourceTitle(r),
            relationship: r.relationship,
            language: r.metadata.language,
        }));

        return [...allEntries, ...individualEntries];
    }, [linkedResources, resourcesByType]);

    const resourceMap = useMemo(
        () =>
            new Map(
                linkedResources.map((r) => [r.instance_id, r])
            ),
        [linkedResources]
    );

    const expandAllMentions = useCallback(
        (newValue: string): string => {
            const allPattern = new RegExp(
                `\\{\\{${ALL_PREFIX}(\\w+)__\\}\\}`,
                'g'
            );
            return newValue.replace(allPattern, (_match, type: string) => {
                const resources = resourcesByType[type];
                if (!resources?.length) return '';
                return resources.map((r) => `{{${r.instance_id}}}`).join(' ');
            });
        },
        [resourcesByType]
    );

    const handleChange = useCallback(
        (_: any, newValue: string) => {
            onChange(expandAllMentions(newValue));
        },
        [onChange, expandAllMentions]
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
                onChange={handleChange}
                placeholder={placeholder}
                className="prompt-mentions"
                allowSuggestionsAboveCursor
            >
                <MentionComponent
                    trigger="{{"
                    markup="{{__id__}}"
                    data={mentionData}
                    displayTransform={(mentionId: string) => {
                        if (mentionId.startsWith(ALL_PREFIX)) {
                            const type = mentionId.slice(
                                ALL_PREFIX.length,
                                -2
                            );
                            const count = resourcesByType[type]?.length ?? 0;
                            return `{{All ${type} (${count})}}`;
                        }
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
                        const isAllEntry = suggestion.id.startsWith(ALL_PREFIX);

                        if (isAllEntry) {
                            return (
                                <div
                                    className={`flex items-center gap-2 py-0.5 border-border ${focused ? 'text-accent-foreground' : ''
                                        }`}
                                >
                                    {RELATIONSHIP_ICONS[suggestion.relationship]}
                                    <span className="font-medium text-sm">
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
                                        className={`font-medium leading-snug line-clamp-1 text-sm ${focused
                                            ? 'text-accent-foreground'
                                            : ''
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
            {hintContent}
        </div>
    );
};

export default PromptTextarea;
