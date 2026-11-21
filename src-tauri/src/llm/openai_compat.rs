//! Re-exported from `ghost_ai_agent_core`.
//!
//! The OpenAI Chat Completions-compatible `CompletionModel` - with custom
//! `reasoning_content` streaming support (MiniMax/DeepSeek reasoning dedup) -
//! lives in the shared agent core so desktop and iOS use the same
//! implementation. Mirrors the `thinking_parser` re-export pattern.

pub use ghost_ai_agent_core::openai_compat::*;
