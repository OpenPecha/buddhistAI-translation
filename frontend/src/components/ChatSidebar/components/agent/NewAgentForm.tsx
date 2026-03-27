import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { agentsKeys } from '@/api/queries/agents';
import { enhanceSystemPrompt } from '@/api/agent';
import { getAccessToken } from '@/lib/auth';
import { ModelName, TARGET_LANGUAGES, type TargetLanguage } from '@/api/translate';
import ContextManager, {
    type ContextItem,
    toApiContexts,
    getContextFiles,
} from './ContextManager';
import { useModels } from '@/api/queries/models';
import { useCurrentDoc } from '@/hooks/useCurrentDoc';
import { useFetchLinkedResources } from '@/api/queries/openpecha_api';
import PromptTextarea from './PromptTextarea';
import { extractPromptVariables } from './utils';


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
        system_prompt: '',
        user_prompt: '',
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
            const variables = extractPromptVariables(formData.user_prompt, linkedResources);
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('system_prompt', formData.system_prompt);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('language', formData.language);
            formDataToSend.append('model', formData.model_name);
            formDataToSend.append('user_prompt', formData.user_prompt);
            if (variables.length > 0) {
                formDataToSend.append('variables', JSON.stringify(variables));
            }
            formDataToSend.append('system_assistance', 'false');
            formDataToSend.append('contexts', JSON.stringify(toApiContexts(contexts)));

            getContextFiles(contexts).forEach((file) => {
                formDataToSend.append('files', file);
            });

            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Authentication token unavailable. Please log in again.');
            }
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
                system_prompt: '',
                user_prompt: '',
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

    const enhanceMutation = useMutation({
        mutationFn: (prompt: string) => enhanceSystemPrompt(prompt),
        onSuccess: (data) => {
            setFormData(prev => ({ ...prev, system_prompt: data.enhanced_prompt }));
            toast.success('System prompt enhanced!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to enhance prompt: ${error.message}`);
        },
    });

    const handleGenerateSystemPrompt = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        enhanceMutation.mutate(formData.system_prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex max-md:flex-col  gap-x-2 overflow-y-auto'>
                <div className="space-y-4 flex-2">
                    <div className='flex gap-2'>
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
                        <div className="space-y-2 w-full">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="What does this assistant do?"
                                value={formData.description}
                                className='w-full'
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className='flex items-center justify-between gap-2 w-full'>
                            <Label htmlFor="system_prompt">System Prompt</Label>
                            <Button onClick={handleGenerateSystemPrompt} variant="outline" size="icon" disabled={formData.system_prompt.trim() === '' || enhanceMutation.isPending}>
                                {enhanceMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <WandSparkles className='text-gray-500 dark:text-gray-300' />
                                )}
                            </Button>
                        </div>
                        <Textarea
                            id="system_prompt"
                            placeholder="Define the assistant's behavior and role..."
                            value={formData.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                            rows={7}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user_prompt">User Prompt *</Label>
                        <PromptTextarea
                            id="user_prompt"
                            placeholder="You are a helpful translation assistant..."
                            value={formData.user_prompt}
                            onChange={(val) => handleInputChange('user_prompt', val)}
                            linkedResources={linkedResources}
                            isLoadingResources={isLoadingResources}
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
                </div>
                <ContextManager contexts={contexts} onChange={setContexts} />
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
