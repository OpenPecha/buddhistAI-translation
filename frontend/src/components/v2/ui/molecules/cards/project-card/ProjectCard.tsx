import { Link } from "react-router-dom";
import { Eye, Pen } from "lucide-react";

interface ProjectOwner {
    username: string;
    picture?: string;
}

interface Project {
    id: string;
    name: string;
    roots: { id: string }[];
    owner?: ProjectOwner;
    publicAccess: 'viewer' | 'editor';
}

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    const rootDocument = project.roots?.[0];

    const getAccessIcon = () => {
        switch (project.publicAccess) {
            case 'viewer':
                return <Eye className="w-4 h-4 text-blue-500" />;
            case 'editor':
                return <Pen className="w-4 h-4 text-orange-500" />;
        }
    };

    return (
        <Link
            to={rootDocument ? `/documents/${rootDocument.id}` : "#"}
            className="group flex flex-col dark:bg-[#1c1c1c] bg-white rounded-sm overflow-hidden"
        >
            <div className="hidden md:flex bg-gradient-to-t from-blue-100  to-blue-300 dark:from-zinc-500 dark:to-zinc-600 h-20" />
            <div className="p-2 space-y-2 flex justify-between flex-col bg-muted/30 h-full  text-muted-foreground">
                <span className="text-sm capitalize text-foreground text-left line-clamp-2 min-h-[2.5rem]" title={project.name}>
                    {project.name}
                </span>
                <div className="flex text-xs items-center justify-between w-full">
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                        {project.owner?.picture ? (
                            <img
                                src={project.owner.picture}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                                alt={project.owner.username}
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        )}
                        <span className="truncate">{project.owner?.username || "Unknown"}</span>
                    </div>
                    <div
                        className="flex items-center gap-1 bg-background px-1.5 py-0.5 rounded-sm border"
                        title={`Access: ${project.publicAccess}`}
                    >
                        {getAccessIcon()}
                    </div>
                </div>
            </div>
        </Link>
    );
};