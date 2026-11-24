// Ghost AI by Brendigo
/** A background-created empty draft must not dismiss the reference Home screen.
 * Explicit conversation actions still switch to Conversations immediately.
 */
export function sectionAfterConversationChange(
  section: string,
  previousId: string | undefined,
  nextId: string | undefined,
  draftId: string | undefined
): string {
  if (previousId === nextId) return section
  if (section === 'home' && (!nextId || (!previousId && nextId === draftId))) return section
  if (['home', 'translation', 'contacts', 'library'].includes(section)) return 'conversations'
  return section
}
