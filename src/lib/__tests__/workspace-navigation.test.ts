// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import { sectionAfterConversationChange } from '@/lib/workspace-navigation'

describe('reference Home navigation', () => {
  it('keeps Home when the application initializes a background draft', () => {
    expect(sectionAfterConversationChange('home', undefined, 'draft', 'draft')).toBe('home')
  })

  it('opens an explicitly selected saved conversation from Home', () => {
    expect(sectionAfterConversationChange('home', 'draft', 'saved', 'draft')).toBe('conversations')
    expect(sectionAfterConversationChange('home', undefined, 'saved', 'draft')).toBe('conversations')
  })

  it('keeps Home if a conversation disappears or its identity is unchanged', () => {
    expect(sectionAfterConversationChange('home', 'saved', undefined, undefined)).toBe('home')
    expect(sectionAfterConversationChange('home', 'draft', 'draft', 'draft')).toBe('home')
  })

  it.each(['contacts', 'translation', 'library'])('follows a selected conversation from %s', (section) => {
    expect(sectionAfterConversationChange(section, 'previous', 'selected', undefined)).toBe('conversations')
  })

  it('keeps an explicitly opened conversation view on the same draft', () => {
    expect(sectionAfterConversationChange('conversations', undefined, 'draft', 'draft')).toBe('conversations')
  })
})
