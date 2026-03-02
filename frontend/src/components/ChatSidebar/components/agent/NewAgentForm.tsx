import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Search, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Context {
    id: string;
    type: 'content' | 'file' | 'search';
    content?: string;
    pecha_title?: string;
    pecha_text_id?: string;
    file?: File;
}

interface SearchResult {
    id: string;
    title: Record<string, string>;
}

const NewAgentForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        source_type: '',
        system_prompt: '',
        system_assistance: false,
    });

    const [contexts, setContexts] = useState<Context[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchStates, setSearchStates] = useState<Record<string, {
        query: string;
        results: SearchResult[];
        isSearching: boolean;
        showResults: boolean;
    }>>({});

    const handleInputChange = (
        field: keyof typeof formData,
        value: string | boolean
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addContext = (type: Context['type']) => {
        const newContext: Context = {
            id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type,
        };
        setContexts(prev => [...prev, newContext]);
    };

    const removeContext = (id: string) => {
        setContexts(prev => prev.filter(ctx => ctx.id !== id));
        setSearchStates(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const updateContext = (id: string, updates: Partial<Context>) => {
        setContexts(prev =>
            prev.map(ctx => (ctx.id === id ? { ...ctx, ...updates } : ctx))
        );
    };

    const handleFileSelect = (id: string, file: File | null) => {
        if (!file) return;
        updateContext(id, { file });
        toast.success(`File selected: ${file.name}`);
    };

    const handleSearch = async (contextId: string, query: string) => {
        if (!query.trim()) return;

        setSearchStates(prev => ({
            ...prev,
            [contextId]: {
                query,
                results: [],
                isSearching: true,
                showResults: true,
            },
        }));

        try {
            const response = await fetch(
                `/pecha/texts?limit=20&offset=0&title=${encodeURIComponent(query)}`
            );

            if (!response.ok) throw new Error('Search failed');

            const results: SearchResult[] = await response.json();

            setSearchStates(prev => ({
                ...prev,
                [contextId]: {
                    ...prev[contextId],
                    results,
                    isSearching: false,
                },
            }));
        } catch (error) {
            toast.error('Search failed. Please try again.');
            setSearchStates(prev => ({
                ...prev,
                [contextId]: {
                    ...prev[contextId],
                    results: [],
                    isSearching: false,
                },
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

        setSearchStates(prev => ({
            ...prev,
            [contextId]: {
                ...prev[contextId],
                showResults: false,
            },
        }));

        toast.success('Pecha text selected!');
    };

    const removePechaTag = (contextId: string) => {
        updateContext(contextId, {
            pecha_title: undefined,
            pecha_text_id: undefined,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.system_prompt.trim()) {
            toast.error('Name and System Prompt are required');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('system_prompt', formData.system_prompt);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('source_type', formData.source_type || '');
            formDataToSend.append('system_assistance', String(formData.system_assistance));

            const contextsData = contexts
                .filter(ctx => {
                    if (ctx.type === 'content') return ctx.content?.trim();
                    if (ctx.type === 'search') return ctx.pecha_title && ctx.pecha_text_id;
                    if (ctx.type === 'file') return ctx.file;
                    return false;
                })
                .map(ctx => {
                    if (ctx.type === 'content') {
                        return {
                            content: ctx.content,
                            pecha_title: null,
                            pecha_text_id: null,
                        };
                    }
                    if (ctx.type === 'search') {
                        return {
                            content: null,
                            pecha_title: ctx.pecha_title,
                            pecha_text_id: ctx.pecha_text_id,
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            formDataToSend.append('contexts', JSON.stringify(contextsData));

            contexts.forEach(ctx => {
                if (ctx.type === 'file' && ctx.file) {
                    formDataToSend.append('files', ctx.file);
                }
            });

            const response = await fetch('/agent/assistant', {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail?.message || error.detail || 'Request failed');
            }

            toast.success('Assistant created successfully!');

            setFormData({
                name: '',
                description: '',
                source_type: '',
                system_prompt: '',
                system_assistance: false,
            });
            setContexts([]);
            setSearchStates({});
        } catch (error) {
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContextField = (context: Context) => {
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
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                                <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                        {context.file.name}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => updateContext(context.id, { file: undefined })}
                                >
                                    Remove
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

            case 'search':
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
                                    setSearchStates(prev => ({
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
                                    onClick={() => removePechaTag(context.id)}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    placeholder="My Translation Assistant"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="What does this assistant do?"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="source_type">Source Type</Label>
                <Input
                    id="source_type"
                    placeholder="e.g. translation, summarization..."
                    value={formData.source_type}
                    onChange={(e) => handleInputChange('source_type', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                    id="system_prompt"
                    placeholder="You are a helpful translation assistant..."
                    value={formData.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    rows={4}
                    required
                />
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    id="system_assistance"
                    checked={formData.system_assistance}
                    onCheckedChange={(checked) => handleInputChange('system_assistance', checked)}
                />
                <Label htmlFor="system_assistance" className="cursor-pointer">
                    System Assistance
                </Label>
            </div>

            <div className="space-y-2">
                <Label>Contexts</Label>
                <p className="text-xs text-muted-foreground">
                    Add context for your assistant (optional)
                </p>

                <Select onValueChange={(value) => addContext(value as Context['type'])}>
                    <SelectTrigger>
                        <SelectValue placeholder="-- Add context --" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="content">Content (Text)</SelectItem>
                        <SelectItem value="file">File Upload (.pdf, .docx, .txt)</SelectItem>
                        <SelectItem value="search">Search Pecha</SelectItem>
                    </SelectContent>
                </Select>

                <div className="space-y-3 mt-3">
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

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Assistant'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default NewAgentForm;