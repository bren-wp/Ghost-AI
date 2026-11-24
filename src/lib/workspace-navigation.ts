// Ghost AI by Brendigo
/** A background-created empty draft must not dismiss the reference Home screen.
 * Explicit conversation actions still switch to Conversations immediately.
 */
export function isReferenceWorkspace(section: string): boolean {
  return ['home', 'agents', 'documents', 'providers', 'settings'].includes(section)
}

export function sectionAfterConversationChange(
  section: string,
  previousId: string | undefined,
  nextId: string | undefined,
  draftId: string | undefined
): string {
  if (previousId === nextId) return section
  // A document session opens the same real draft and transcript, not a separate data store.
  if (section === 'documents' && nextId && nextId === draftId) return section
  if (isReferenceWorkspace(section) && (!nextId || (!previousId && nextId === draftId))) return section
  if (isReferenceWorkspace(section) || ['translation', 'contacts', 'library'].includes(section)) return 'conversations'
  return section
}
