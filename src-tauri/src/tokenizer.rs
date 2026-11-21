// Ghost AI by Brendigo
// CJK-aware tokenizer for the local FTS message index, shared with the
// other platforms through `ghost-ai-agent-core` so `messages_fts` content
// and `MATCH` queries segment identically everywhere.

pub use ghost_ai_agent_core::tokenizer::{tokenize_for_search, tokenize_query};
