export const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;
export const MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_TYPES = [
  "Legal / Land",
  "Technical / Drawings",
  "Environmental / Safety",
  "Financial / Identity",
  "General",
] as const;
export const LICENSE_TIERS = [
  ["registration", "FSSAI Registration"],
  ["state_license", "FSSAI State licence"],
  ["central_license", "FSSAI Central licence"],
] as const;

/** Returns an error message, or "" when the file is acceptable. Mirrors the server's limits. */
export function validateFile(file: File | null): string {
  if (!file) return "Choose a file to upload.";
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type))
    return "Only PDF, PNG or JPG files are accepted.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_BYTES) return "File must be 5 MB or smaller.";
  return "";
}
