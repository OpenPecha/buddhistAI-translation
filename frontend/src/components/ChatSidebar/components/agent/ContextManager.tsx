import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Search, Upload, FileText, Loader2, Trash } from 'lucide-react';
import { toast } from 'sonner';

export interface ContextItem {
    id: string;
    type: 'content' | 'file' | 'search';
    content?: string;
    pecha_title?: string | null;
    pecha_text_id?: string | null;
    file?: File;
}

interface SearchResult {
    id: string;
    title: Record<string, string>;
}

interface ContextManagerProps {
    contexts: ContextItem[];
    onChange: (contexts: ContextItem[]) => void;
}

function generateId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Converts API AgentContext objects into ContextItems by inferring their type.
 */
export function toContextItems(
    apiContexts: { id: string; content: string; pecha_title: string | null; pecha_text_id: string | null }[]
): ContextItem[] {
    return apiContexts.map((ctx) => ({
        id: ctx.id,
        type: ctx.pecha_text_id ? 'search' as const : 'content' as const,
        content: ctx.content || undefined,
        pecha_title: ctx.pecha_title,
        pecha_text_id: ctx.pecha_text_id,
    }));
}

/**
 * Converts ContextItems back to the shape expected by the create/update API.
 */
export function toApiContexts(items: ContextItem[]) {
    return items
        .filter((ctx) => {
            if (ctx.type === 'content') return ctx.content?.trim();
            if (ctx.type === 'search') return ctx.pecha_title && ctx.pecha_text_id;
            if (ctx.type === 'file') return ctx.file;
            return false;
        })
        .map((ctx) => {
            if (ctx.type === 'content') {
                return { content: ctx.content ?? null, pecha_title: null, pecha_text_id: null };
            }
            if (ctx.type === 'search') {
                return { content: null, pecha_title: ctx.pecha_title ?? null, pecha_text_id: ctx.pecha_text_id ?? null };
            }
            return null;
        })
        .filter(Boolean);
}

/**
 * Extracts File objects from ContextItems for FormData upload.
 */
export function getContextFiles(items: ContextItem[]): File[] {
    return items
        .filter((ctx) => ctx.type === 'file' && ctx.file)
        .map((ctx) => ctx.file!);
}

const ContextManager: React.FC<ContextManagerProps> = ({ contexts, onChange }) => {
    const [searchStates, setSearchStates] = useState<Record<string, {
        query: string;
        results: SearchResult[];
        isSearching: boolean;
        showResults: boolean;
    }>>({});

    const addContext = (type: ContextItem['type']) => {
        onChange([...contexts, { id: generateId(), type }]);
    };

    const removeContext = (id: string) => {
        onChange(contexts.filter((ctx) => ctx.id !== id));
        setSearchStates((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const updateContext = (id: string, updates: Partial<ContextItem>) => {
        onChange(contexts.map((ctx) => (ctx.id === id ? { ...ctx, ...updates } : ctx)));
    };

    const handleFileSelect = (id: string, file: File | null) => {
        if (!file) return;
        updateContext(id, { file });
        toast.success(`File selected: ${file.name}`);
    };

    const handleSearch = async (contextId: string, query: string) => {
        if (!query.trim()) return;

        setSearchStates((prev) => ({
            ...prev,
            [contextId]: { query, results: [], isSearching: true, showResults: true },
        }));

        try {
            const response = await fetch(
                `/pecha/texts?limit=20&offset=0&title=${encodeURIComponent(query)}`
            );
            if (!response.ok) throw new Error('Search failed');

            const results: SearchResult[] = await response.json();

            setSearchStates((prev) => ({
                ...prev,
                [contextId]: { ...prev[contextId], results, isSearching: false },
            }));
        } catch {
            toast.error('Search failed. Please try again.');
            setSearchStates((prev) => ({
                ...prev,
                [contextId]: { ...prev[contextId], results: [], isSearching: false },
            }));
        }
    };

    const selectSearchResult = (contextId: string, result: SearchResult) => {
        const titleText = Object.entries(result.title)
            .map(([lang, text]) => `${lang}: ${text}`)
            .join(' | ');
        const displayTitle = titleText.length > 80 ? titleText.slice(0, 80) + '...' : titleText;

        updateContext(contextId, {
            pecha_title: displayTitle,
            pecha_text_id: result.id,
        });

        setSearchStates((prev) => ({
            ...prev,
            [contextId]: { ...prev[contextId], showResults: false },
        }));

        toast.success('Pecha text selected!');
    };

    const renderContextField = (context: ContextItem) => {
        switch (context.type) {
            case 'content':
                return (
                    <Textarea
                        placeholder="Enter context content..."
                        value={context.content || ''}
                        onChange={(e) => updateContext(context.id, { content: e.target.value })}
                        rows={3}
                        className="resize-none"
                    />
                );

            case 'file':
                return (
                    <div className="space-y-2">
                        <input
                            type="file"
                            id={`file-${context.id}`}
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => handleFileSelect(context.id, e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        {context.file ? (
                            <div className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-green-600" />
                                    <span className="text-sm font-medium">
                                        {context.file.name}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateContext(context.id, { file: undefined })}
                                >
                                    <Trash className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-dashed"
                                    onClick={() => document.getElementById(`file-${context.id}`)?.click()}
                                >
                                    <Upload className="size-4 mr-2" />
                                    Choose file (.pdf, .docx, .txt)
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                            </div>
                        )}
                    </div>
                );

            case 'search': {
                const searchState = searchStates[context.id] || {
                    query: '',
                    results: [],
                    isSearching: false,
                    showResults: false,
                };

                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search Buddhist texts..."
                                value={searchState.query}
                                onChange={(e) => {
                                    setSearchStates((prev) => ({
                                        ...prev,
                                        [context.id]: {
                                            ...prev[context.id],
                                            query: e.target.value,
                                        },
                                    }));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch(context.id, searchState.query);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSearch(context.id, searchState.query)}
                                disabled={searchState.isSearching || !searchState.query.trim()}
                            >
                                {searchState.isSearching ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Search className="size-4" />
                                )}
                            </Button>
                        </div>

                        {searchState.showResults && (
                            <div className="max-h-48 overflow-y-auto border rounded-md">
                                {searchState.results.length === 0 ? (
                                    <div className="p-3 text-sm text-center text-muted-foreground">
                                        {searchState.isSearching ? 'Searching...' : 'No results found'}
                                    </div>
                                ) : (
                                    searchState.results.map((result) => (
                                        <div
                                            key={result.id}
                                            className="p-3 text-sm border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => selectSearchResult(context.id, result)}
                                        >
                                            {Object.entries(result.title).map(([lang, text]) => (
                                                <div key={lang} className="mb-1 last:mb-0">
                                                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded mr-2">
                                                        {lang}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {text.length > 100 ? text.slice(0, 100) + '...' : text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {context.pecha_title && context.pecha_text_id && (
                            <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-md">
                                <span className="text-sm text-teal-700 dark:text-teal-400 flex-1">
                                    {context.pecha_title}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateContext(context.id, { pecha_title: undefined, pecha_text_id: undefined })}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className="space-y-2 flex-1">
            <Label>Contexts</Label>
            <p className="text-xs text-muted-foreground">
                Add context for your assistant (optional)
            </p>

            <Select onValueChange={(value) => addContext(value as ContextItem['type'])}>
                <SelectTrigger>
                    <SelectValue placeholder="-- Add context --" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="content">Content (Text)</SelectItem>
                    <SelectItem value="file">File Upload (.pdf, .docx, .txt)</SelectItem>
                    <SelectItem value="search">Search Pecha</SelectItem>
                </SelectContent>
            </Select>

            <div className="space-y-3 mt-3  max-h-[40vh] overflow-y-auto">
                {contexts.map((context) => (
                    <div
                        key={context.id}
                        className="relative p-4 border rounded-md bg-card space-y-3"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeContext(context.id)}
                        >
                            <X className="size-4" />
                        </Button>

                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {context.type === 'content' && 'Content'}
                            {context.type === 'file' && 'File Upload'}
                            {context.type === 'search' && 'Search Pecha'}
                        </div>

                        {renderContextField(context)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContextManager;
