export type ActivityAttachment = {
  path: string;
  originalName: string;
};

export function parseActivityAttachments(value: unknown): ActivityAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ActivityAttachment =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ActivityAttachment).path === "string" &&
      typeof (item as ActivityAttachment).originalName === "string"
  );
}
