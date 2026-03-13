import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { agentsKeys } from '@/api/queries/agents';
import ContextManager, {
    type ContextItem,
    toApiContexts,
    getContextFiles,
} from './ContextManager';

const NewAgentForm = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        source_type: '',
        system_prompt: '',
        system_assistance: false,
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

            formDataToSend.append('contexts', JSON.stringify(toApiContexts(contexts)));

            getContextFiles(contexts).forEach((file) => {
                formDataToSend.append('files', file);
            });

            const accessToken = sessionStorage.getItem('id_token');
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
                source_type: '',
                system_prompt: '',
                system_assistance: false,
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
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
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
                        placeholder="e.g. root text , commentary text, etc."
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

                <ContextManager contexts={contexts} onChange={setContexts} />
            </div>
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
        </form>
    );
};

export default NewAgentForm;
