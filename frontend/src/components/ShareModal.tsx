import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Globe,
  Lock,
  Copy,
  Trash2,
  CheckCircle,
  Send,
  AlertTriangle,
  Share,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ExportButton from "./Export";
import {
  updateProjectShareSettings,
  addCollaborator,
  updateCollaboratorAccess,
  removeCollaborator,
  searchUsers,
  type User,
} from "@/api/project";
import { useTranslation } from "react-i18next";
import { useFetchProjectShareInfo } from "@/api/queries/projects";

interface ShareModalProps {
  open: boolean;
  projectId: string;
  projectName: string;
  onOpenChange: (open: boolean) => void;
}

const generateShareableLink = (
  rootDocument: { id: string } | null | undefined
): string | null => {
  if (!rootDocument) return null;
  const baseUrl = window.location.origin;
  return `${baseUrl}/documents/public/${rootDocument.id}`;
};

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  projectId,
  projectName,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<"share" | "export">("share");
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"viewer" | "editor">("viewer");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [_, setCopied] = useState(false);

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: shareInfo, isLoading } = useFetchProjectShareInfo(projectId);

  const shareData = shareInfo?.data;

  const collaborators =
    shareData?.permissions?.filter(
      (permission) => permission.userId !== shareData?.owner?.id
    ) || [];
  const owner = shareData?.owner;

  const updateShareMutation = useMutation({
    mutationFn: ({
      isPublic,
      publicAccess,
    }: {
      isPublic: boolean;
      publicAccess: "none" | "viewer" | "editor";
    }) => updateProjectShareSettings(projectId, { isPublic, publicAccess }),
    onSuccess: (data) => {
      const message = data.data.isPublic
        ? "Document is now public and accessible via link"
        : "Document is now private";

      setSuccess(message);
      queryClient.invalidateQueries({ queryKey: ["projectShare", projectId] });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: ({
      email,
      accessLevel,
    }: {
      email: string;
      accessLevel: "viewer" | "editor";
    }) => addCollaborator(projectId, { email, accessLevel }),
    onSuccess: (data) => {
      setSuccess(data.message);
      setEmail("");
      setAccessLevel("viewer");
      setShowUserSearch(false);
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ["projectShare", projectId] });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({
      userId,
      accessLevel,
    }: {
      userId: string;
      accessLevel: "viewer" | "editor";
    }) => updateCollaboratorAccess(projectId, userId, accessLevel),
    onSuccess: () => {
      setSuccess("Access level updated");
      queryClient.invalidateQueries({ queryKey: ["projectShare", projectId] });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: (userId: string) => removeCollaborator(projectId, userId),
    onSuccess: (data) => {
      setSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: ["projectShare", projectId] });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const searchUsersMutation = useMutation({
    mutationFn: (query: string) => searchUsers(query),
    onSuccess: (data) => {
      setSearchResults(data.data);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  // Handle email input change with debounced search
  useEffect(() => {
    if (email.length > 2) {
      const timeoutId = setTimeout(() => {
        searchUsersMutation.mutate(email);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowUserSearch(false);
    }
  }, [email]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSuccess("Link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setSuccess("");
      }, 2000);
    } catch {
      setError("Failed to copy link to clipboard");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddCollaborator = (userEmail: string) => {
    addCollaboratorMutation.mutate({ email: userEmail, accessLevel });
  };

  const handleRemoveCollaborator = (userId: string) => {
    if (confirm("Are you sure you want to remove this collaborator?")) {
      removeCollaboratorMutation.mutate(userId);
    }
  };

  const handleAccessLevelChange = (
    userId: string,
    newAccessLevel: "viewer" | "editor"
  ) => {
    updateAccessMutation.mutate({ userId, accessLevel: newAccessLevel });
  };

  const handlePublicToggle = (isPublic: boolean) => {
    if (isPublic && shareData?.rootDocument) {
      const clientGeneratedLink = generateShareableLink(shareData.rootDocument);
      if (clientGeneratedLink) {
        copyToClipboard(clientGeneratedLink);
      }
    }

    updateShareMutation.mutate({
      isPublic,
      publicAccess: isPublic ? "viewer" : "none",
    });
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case "viewer":
        return "Can view";
      case "editor":
        return "Can edit";
      default:
        return "Can view";
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "viewer":
        return "bg-secondary-100 text-secondary-800";
      case "editor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center pb-2 border-b gap-2">
            <Share className="h-4 w-4" />
            {t("common.share")}
          </DialogTitle>
          <DialogDescription>
            {projectName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-2 flex items-center justify-center gap-2">
            <span>
              Loading sharing options...
            </span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex-1"
          >
            <TabsList className=" w-full">
              <TabsTrigger className="w-1/2" value="share">{t("common.share")}</TabsTrigger>
              <TabsTrigger className="w-1/2" value="export">{t("export.export")}</TabsTrigger>
            </TabsList>
            <TabsContent
              value="share"
              className="flex-1 overflow-y-auto space-y-2 py-2"
            >
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  {t("share.peopleWithAccess")}
                </div>
              </div>

              <div className="space-y-2">
                {shareData?.isOwner && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={t("share.addPeopleByEmail")}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setShowUserSearch(true);
                          }}
                          onFocus={() => setShowUserSearch(true)}
                          className="pr-10 text-sm h-8"
                        />
                      </div>

                      <Select
                        value={accessLevel}
                        onValueChange={(value) => setAccessLevel(value as any)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            {t("share.viewer")}
                          </SelectItem>
                          <SelectItem value="editor">
                            {t("share.editor")}
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => handleAddCollaborator(email)}
                        disabled={!email || addCollaboratorMutation.isPending}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>

                    {showUserSearch && searchResults.length > 0 && (
                      <Card className="p-1 rounded-none bg-background">
                        <div className="max-h-20 overflow-y-auto">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-2 p-1 cursor-pointer"
                              onClick={() => {
                                setEmail(user.email);
                                setShowUserSearch(false);
                              }}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.picture} />
                                <AvatarFallback className="text-xs">
                                  {user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {user.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {owner && (
                  <div className="flex items-center gap-2 p-2 dark:bg-zinc-800 bg-zinc-300 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">
                        {owner.username}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                        {owner.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-300 text-xs px-2 py-0"
                    >
                      {t("share.owner")}
                    </Badge>
                  </div>
                )}

                {collaborators.length > 0 && (
                  <div className="space-y-1">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={collaborator.user.picture} />
                          <AvatarFallback className="text-xs">
                            {collaborator.user.username
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {collaborator.user.username}
                          </p>
                          <p className="text-xs text-neutral-800 dark:text-neutral-100 truncate">
                            {collaborator.user.email}
                          </p>
                        </div>

                        {shareData?.isOwner ? (
                          <div className="flex items-center gap-1">
                            <Select
                              value={collaborator.accessLevel}
                              onValueChange={(value) =>
                                handleAccessLevelChange(
                                  collaborator.userId,
                                  value as any
                                )
                              }
                              disabled={updateAccessMutation.isPending}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">
                                  {t("share.viewer")}
                                </SelectItem>
                                <SelectItem value="editor">
                                  {t("share.editor")}
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveCollaborator(collaborator.userId)
                              }
                              disabled={removeCollaboratorMutation.isPending}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            className={`${getAccessLevelColor(
                              collaborator.accessLevel
                            )} text-xs px-2 py-0`}
                          >
                            {getAccessLevelLabel(collaborator.accessLevel)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {collaborators.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs">{t("share.noCollaboratorsYet")}</p>
                  </div>
                )}
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-neutral-800 dark:text-neutral-100" />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {t("share.generalAccess")}
                    </span>
                  </div>

                  {shareData?.isOwner ? (
                    <Select
                      value={shareData?.isPublic ? "public" : "private"}
                      onValueChange={(value) =>
                        handlePublicToggle(value === "public")
                      }
                      disabled={updateShareMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-sm w-auto min-w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3" />
                            <span>{t("share.private")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            <span>{t("share.public")}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-sm h-8 px-3">
                      {shareData?.isPublic
                        ? t("share.public")
                        : t("share.private")}
                    </Badge>
                  )}
                </div>

                {shareData?.isPublic && shareData?.rootDocument && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Input
                        value={generateShareableLink(shareData.rootDocument) || ""}
                        readOnly
                        onFocus={(e) => e.target.select()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = generateShareableLink(
                            shareData.rootDocument
                          );
                          if (link) copyToClipboard(link);
                        }}
                        className="h-8 px-3 shrink-0"
                        title={t("share.copyLink")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {(error || success) && (
                  <div className="text-sm">
                    {error && (
                      <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-800 border border-red-200 dark:border-red-400 p-3 rounded-md">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded-md">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{success}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="export" className="flex-1">
              <ExportButton projectId={projectId} projectName={projectName} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
