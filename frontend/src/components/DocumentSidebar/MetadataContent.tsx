import { useTranslation } from "react-i18next";
import { useFetchDocument } from "@/api/queries/documents";
import { ScrollArea } from "@/components/ui/scroll-area";

// Metadata content component for sidebar
const MetadataContent = ({ documentId }: { documentId: string }) => {
  const { t } = useTranslation();

  const { data: document, isLoading, error } = useFetchDocument(documentId);

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-xs text-red-600 dark:text-red-400">
        Error loading document information
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-3 text-xs text-gray-500">
        No document information available
      </div>
    );
  }

  const metadata = document?.metadata;
  const openpechaData = metadata?.openpecha;
  const currentVersion = document?.currentVersion;
  const rootProject = document?.rootProject;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <div>
          <p className="font-medium text-lg border-b pb-1  mb-2 text-neutral-800 dark:text-neutral-200">
            {t(`meta.basicInfo`)}
          </p>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`meta.name`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300 break-words">
                {document.name || "Untitled Document"}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`common.language`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {document.language || "Not specified"}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`meta.type`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {document.isRoot ? "Root Document" : "Translation"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="font-medium text-lg border-b pb-1 mb-2 text-neutral-800 dark:text-neutral-200">
            {t(`meta.timeline`)}
          </p>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`meta.created`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {formatDate(document.createdAt)}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`meta.lastUpdated`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {formatDateTime(document.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Version Information */}
        {currentVersion && (
          <div>
            <p className="font-medium text-lg border-b pb-1 mb-2 text-neutral-800 dark:text-neutral-200">
              {t(`meta.currentVersion`)}
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.label`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {currentVersion.label || "No label"}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.versionUpdated`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {formatDateTime(currentVersion.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Information */}
        {rootProject && (
          <div>
            <p className="font-medium text-lg border-b pb-1 mb-2 text-neutral-800 dark:text-neutral-200">
              {t(`meta.project`)}
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.name`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300 break-words">
                  {rootProject.name || "Unnamed Project"}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.visibility`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {rootProject.isPublic ? "Public" : "Private"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OpenPecha Information */}
        {openpechaData && (
          <div>
            <p className="font-medium text-lg border-b pb-1 mb-2 text-neutral-800 dark:text-neutral-200">
              OpenPecha
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.origin`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {openpechaData.template ? "Yes" : "No"}
                </div>
              </div>
              {openpechaData.expression_id && (
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t(`meta.expressionId`)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-mono text-xs break-all">
                    {openpechaData.expression_id}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IDs */}
        <div>
          <p className="font-medium text-lg border-b pb-1 mb-2 text-neutral-800 dark:text-neutral-200">
            {t(`meta.identifiers`)}
          </p>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {t(`meta.documentId`)}
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-mono text-xs break-all">
                {document.id}
              </div>
            </div>
            {document.identifier && (
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`meta.identifier`)}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {document.identifier}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default MetadataContent;
