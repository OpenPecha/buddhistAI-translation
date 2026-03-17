export function createEmptyTranslationFormData(rootId: string): FormData {
  const translationFormData = new FormData();
  const translationTimestamp = Date.now();
  
  translationFormData.append("name", "Empty Translation");
  translationFormData.append("identifier", `empty-translation-${translationTimestamp}`);
  translationFormData.append("isRoot", "false");
  translationFormData.append("isPublic", "false");
  translationFormData.append("language", "bo");
  translationFormData.append("rootId", rootId);
  
  return translationFormData;
}