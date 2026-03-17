import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
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
import { Brain, Loader2, FileText, BookOpen, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { agentsKeys } from '@/api/queries/agents';
import { getIdToken } from '@/lib/auth';
import { ModelName, TARGET_LANGUAGES, type TargetLanguage } from '@/api/translate';
import ContextManager, {
    type ContextItem,
    toApiContexts,
    getContextFiles,
} from './ContextManager';
import { useModels } from '@/api/queries/models';
import { useCurrentDoc } from '@/hooks/useCurrentDoc';
import { useFetchLinkedResources } from '@/api/queries/openpecha_api';
import type { LinkedResource } from '@/api/openpecha';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


const RELATIONSHIP_ICONS: Record<string, React.ReactNode> = {
    commentary: <BookOpen className="size-3.5 shrink-0" />,
    translation: <Languages className="size-3.5 shrink-0" />,
};

function getResourceTitle(resource: LinkedResource): string {
    const titleObj = resource.metadata.title;
    return Object.values(titleObj)[0] ?? resource.instance_id;
}

const NewAgentForm = () => {
    const queryClient = useQueryClient();
    const { models } = useModels();
    const { id: documentId } = useParams<{ id: string }>();
    const { currentDoc } = useCurrentDoc(documentId);
    const textId = (currentDoc?.metadata?.textId ?? currentDoc?.metadata?.text_id) as string | undefined;
    const { data: linkedResources, isLoading: isLoadingResources } = useFetchLinkedResources(textId);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        user_prompt: '',
        target_language: 'english' as TargetLanguage,
        model_name: '' as ModelName,
        language: '' as TargetLanguage,
    });

    const [contexts, setContexts] = useState<ContextItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (
        field: keyof typeof formData,
        value: string | boolean
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.user_prompt.trim()) {
            toast.error('Name and User Prompt are required');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('user_prompt', formData.user_prompt);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('target_language', formData.target_language);
            formDataToSend.append('model_name', formData.model_name);
            formDataToSend.append('language', formData.language);
            formDataToSend.append('contexts', JSON.stringify(toApiContexts(contexts)));

            getContextFiles(contexts).forEach((file) => {
                formDataToSend.append('files', file);
            });

            const accessToken = await getIdToken();
            const response = await fetch('/agent/assistant', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail?.message || error.detail || 'Request failed');
            }

            toast.success('Assistant created successfully!');
            await queryClient.invalidateQueries({ queryKey: agentsKeys.lists() });

            setFormData({
                name: '',
                description: '',
                user_prompt: '',
                target_language: 'english',
                model_name: '' as ModelName,
                language: '' as TargetLanguage,
            });
            setContexts([]);
        } catch (error) {
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex max-md:flex-col h-full'>
                <div className="space-y-4 flex-1 h-[70vh]  overflow-y-auto">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Translation Assistant"
                            value={formData.name}
                            className='w-fit'
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="What does this assistant do?"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user_prompt">User Prompt *</Label>
                        <Textarea
                            id="user_prompt"
                            placeholder="You are a helpful translation assistant..."
                            value={formData.user_prompt}
                            onChange={(e) => handleInputChange('user_prompt', e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                    <div className='flex items-center gap-2'>

                        <div className='space-y-2 '>
                            <Label className="text-sm font-medium flex items-center gap-2">
                                Language
                            </Label>
                            <Select
                                value={formData.language}
                                onValueChange={(value: TargetLanguage) =>
                                    handleInputChange('language', value)
                                }
                            >
                                <SelectTrigger className="h-9 w-fit">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TARGET_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2 w-full'>
                            <Label className="text-sm font-medium flex items-center gap-2">
                                Model
                            </Label>
                            <Select
                                value={formData.model_name}
                                onValueChange={(value: ModelName) =>
                                    handleInputChange('model_name', value)
                                }
                            >
                                <SelectTrigger className="h-9 w-fit" disabled={isSubmitting}>
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.value} value={model.value}>
                                            {model.is_thinking && <Brain className="size-4" />}
                                            {model.name}
                                            <span className="text-xs text-gray-500">{model.provider}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <ContextManager contexts={contexts} onChange={setContexts} />
                </div>
                <div className='flex-1 space-y-2 px-2'>
                    <Label>Linked Resources</Label>
                    <div className="border rounded-md h-[65vh] overflow-y-auto">
                        {!textId && (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                No text linked to this document
                            </div>
                        )}
                        {isLoadingResources && (
                            <div className="space-y-2 p-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        )}
                        {linkedResources && linkedResources.length === 0 && (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                No linked resources found
                            </div>
                        )}
                        {linkedResources && linkedResources.length > 0 && (
                            <ul className="divide-y">
                                {linkedResources.map((resource) => (
                                    <li key={resource.instance_id} className="flex items-start gap-3 p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-snug line-clamp-2">
                                                {getResourceTitle(resource)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs capitalize gap-1">
                                                    {RELATIONSHIP_ICONS[resource.relationship] ?? <FileText className="size-3" />}
                                                    {resource.relationship}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground uppercase">
                                                    {resource.metadata.language}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" className=' w-full bg-secondary-600 hover:bg-secondary-700 text-white' disabled={isSubmitting}>
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
        </form >
    );
};

export default NewAgentForm;
