/**
 * Conversation Persistence Layer
 *
 * Handles saving and retrieving Dr. Luna Clearwater conversations
 * from Supabase database for session persistence and longitudinal learning.
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationThread {
  id: string;
  user_id: string;
  persona: string;
  title?: string;
  status: 'active' | 'completed' | 'archived';
  evaluation_report_id?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ConversationMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ConversationWithMessages extends ConversationThread {
  messages: ConversationMessage[];
  message_count?: number;
}

// ============================================================================
// CONVERSATION THREAD OPERATIONS
// ============================================================================

/**
 * Create a new conversation thread
 */
export const createConversationThread = async (
  userId: string,
  persona: string = 'drLunaClearwater',
  title?: string
): Promise<ConversationThread> => {
  try {
    const { data, error } = await supabase
      .from('conversation_threads')
      .insert({
        user_id: userId,
        persona,
        title: title || `Conversation - ${new Date().toLocaleDateString()}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation thread:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    console.log('Conversation thread created:', data.id);
    return data;
  } catch (error) {
    console.error('Error in createConversationThread:', error);
    throw error;
  }
};

/**
 * Update conversation thread
 */
export const updateConversationThread = async (
  threadId: string,
  updates: Partial<
    Pick<ConversationThread, 'title' | 'status' | 'evaluation_report_id'>
  >
): Promise<ConversationThread> => {
  try {
    const { data, error } = await supabase
      .from('conversation_threads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation thread:', error);
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateConversationThread:', error);
    throw error;
  }
};

/**
 * Get conversation thread by ID
 */
export const getConversationThread = async (
  threadId: string
): Promise<ConversationThread | null> => {
  try {
    const { data, error } = await supabase
      .from('conversation_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error getting conversation thread:', error);
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getConversationThread:', error);
    throw error;
  }
};

/**
 * Get all conversation threads for a user
 */
export const getUserConversationThreads = async (
  userId: string,
  status?: 'active' | 'completed' | 'archived'
): Promise<ConversationThread[]> => {
  try {
    let query = supabase
      .from('conversation_threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user conversations:', error);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserConversationThreads:', error);
    throw error;
  }
};

/**
 * Delete conversation thread (and all messages via CASCADE)
 */
export const deleteConversationThread = async (
  threadId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('conversation_threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      console.error('Error deleting conversation thread:', error);
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }

    console.log('Conversation thread deleted:', threadId);
  } catch (error) {
    console.error('Error in deleteConversationThread:', error);
    throw error;
  }
};

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Save a message to a conversation thread
 */
export const saveMessage = async (
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, unknown>
): Promise<ConversationMessage> => {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        thread_id: threadId,
        role,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      throw new Error(`Failed to save message: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    throw error;
  }
};

/**
 * Save multiple messages in batch
 */
export const saveMessagesBatch = async (
  messages: Array<{
    threadId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<ConversationMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert(
        messages.map((msg) => ({
          thread_id: msg.threadId,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata || {},
        }))
      )
      .select();

    if (error) {
      console.error('Error saving messages batch:', error);
      throw new Error(`Failed to save messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in saveMessagesBatch:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation thread
 */
export const getConversationMessages = async (
  threadId: string,
  limit?: number
): Promise<ConversationMessage[]> => {
  try {
    let query = supabase
      .from('conversation_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    throw error;
  }
};

/**
 * Get conversation with all messages
 */
export const getConversationWithMessages = async (
  threadId: string
): Promise<ConversationWithMessages | null> => {
  try {
    const thread = await getConversationThread(threadId);
    if (!thread) return null;

    const messages = await getConversationMessages(threadId);

    return {
      ...thread,
      messages,
      message_count: messages.length,
    };
  } catch (error) {
    console.error('Error in getConversationWithMessages:', error);
    throw error;
  }
};

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Resume a conversation (get thread and messages)
 */
export const resumeConversation = async (
  threadId: string
): Promise<ConversationWithMessages | null> => {
  try {
    const conversation = await getConversationWithMessages(threadId);

    if (conversation && conversation.status === 'archived') {
      // Reactivate archived conversation
      await updateConversationThread(threadId, { status: 'active' });
      conversation.status = 'active';
    }

    return conversation;
  } catch (error) {
    console.error('Error in resumeConversation:', error);
    throw error;
  }
};

/**
 * Link conversation to evaluation report
 */
export const linkConversationToReport = async (
  threadId: string,
  reportId: string
): Promise<void> => {
  try {
    await updateConversationThread(threadId, {
      evaluation_report_id: reportId,
      status: 'completed',
    });

    console.log('Conversation linked to report:', { threadId, reportId });
  } catch (error) {
    console.error('Error in linkConversationToReport:', error);
    throw error;
  }
};

/**
 * Archive old conversations (mark as archived)
 */
export const archiveOldConversations = async (
  userId: string,
  daysOld: number = 30
): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('conversation_threads')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .lt('updated_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('Error archiving conversations:', error);
      throw new Error(`Failed to archive conversations: ${error.message}`);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in archiveOldConversations:', error);
    throw error;
  }
};

/**
 * Get conversation history summary for AI context
 * Returns recent conversations with key information
 */
export const getConversationHistorySummary = async (
  userId: string,
  limit: number = 5
): Promise<
  Array<{
    id: string;
    title?: string;
    created_at: string;
    message_count: number;
    has_evaluation: boolean;
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('conversation_threads_with_counts')
      .select('id, title, created_at, message_count, evaluation_report_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting conversation history:', error);
      throw new Error(`Failed to get conversation history: ${error.message}`);
    }

    return (data || []).map((conv) => ({
      id: conv.id,
      title: conv.title,
      created_at: conv.created_at,
      message_count: conv.message_count || 0,
      has_evaluation: !!conv.evaluation_report_id,
    }));
  } catch (error) {
    console.error('Error in getConversationHistorySummary:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format conversation messages for AI context
 */
export const formatMessagesForAI = (
  messages: ConversationMessage[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

/**
 * Extract evaluation report JSON from conversation messages
 */
export const extractEvaluationReportFromConversation = (
  messages: ConversationMessage[]
): string | null => {
  // Look for assistant messages containing JSON code blocks
  for (const message of messages.reverse()) {
    if (message.role === 'assistant') {
      const jsonMatch = message.content.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
      );
      if (jsonMatch) {
        return jsonMatch[1];
      }
    }
  }
  return null;
};

/**
 * Count total messages by user
 */
export const getUserMessageStats = async (
  userId: string
): Promise<{
  total_conversations: number;
  total_messages: number;
  active_conversations: number;
}> => {
  try {
    // Get conversation counts
    const { data: threads, error: threadsError } = await supabase
      .from('conversation_threads')
      .select('id, status')
      .eq('user_id', userId);

    if (threadsError) throw threadsError;

    const totalConversations = threads?.length || 0;
    const activeConversations =
      threads?.filter((t) => t.status === 'active').length || 0;

    // Get message counts
    const { count, error: countError } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .in('thread_id', threads?.map((t) => t.id) || []);

    if (countError) throw countError;

    return {
      total_conversations: totalConversations,
      total_messages: count || 0,
      active_conversations: activeConversations,
    };
  } catch (error) {
    console.error('Error getting user message stats:', error);
    throw error;
  }
};
