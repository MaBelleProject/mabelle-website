import type { SectionGroup } from "@/lib/api";

/** Website sections are addressed by their code (shared by the same section across brands). */
export const sectionHref = (code: string) => `/section/${encodeURIComponent(code)}`;

/** Section codes match ignoring case and surrounding spaces (same as the API). */
export const sameSectionCode = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The website section a brand section id belongs to (e.g. for carousel links that store a section id). */
export const sectionOfId = (sections: SectionGroup[], sectionId: number) =>
  sections.find(s => s.sectionIds.includes(sectionId));
