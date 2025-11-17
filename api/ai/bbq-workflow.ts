import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BBQWorkflowRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userId?: string;
  preferences?: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, userId, preferences }: BBQWorkflowRequest = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get server-side API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured on server');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Workflow ID - OpenAI Agent Builder workflow
    const workflowId = 'wf_6918be4c124881909eef316b88fc1e46089901a8738709d8';

    console.log(
      `[BBQ Workflow] Processing ${messages.length} messages for workflow: ${workflowId}`
    );

    // Use ChatKit session-based API to communicate with the workflow
    // First, create or get a session for this user/workflow combination
    const userIdentifier = userId || 'anonymous';

    // Create ChatKit session
    const sessionResponse = await fetch(
      'https://api.openai.com/v1/chatkit/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'chatkit_beta=v1',
        },
        body: JSON.stringify({
          workflow: { id: workflowId },
          user: userIdentifier,
        }),
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error(
        'ChatKit session creation error:',
        sessionResponse.status,
        errorText
      );

      if (sessionResponse.status === 401) {
        return res.status(500).json({ error: 'Invalid OpenAI API key' });
      }
      if (sessionResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        });
      }
      if (sessionResponse.status === 403) {
        return res.status(500).json({
          error: 'Access denied. Please check your OpenAI account permissions.',
        });
      }

      throw new Error(
        `ChatKit session error: ${sessionResponse.status} ${errorText}`
      );
    }

    const sessionData = await sessionResponse.json();
    const clientSecret = sessionData.client_secret;

    // Now send messages through the ChatKit API
    // The ChatKit API handles communication with the workflow
    // We'll use the streaming/completion endpoint to send messages
    const workflowResponse = await fetch(
      'https://api.openai.com/v1/chatkit/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'chatkit_beta=v1',
        },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          // Include preferences if needed (adjust based on your workflow's input schema)
          ...(preferences && { user_preferences: preferences }),
          ...(userId && { user_id: userId }),
        }),
      }
    );

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      console.error(
        'ChatKit completion error:',
        workflowResponse.status,
        errorText
      );

      if (workflowResponse.status === 401) {
        return res.status(500).json({ error: 'Invalid client secret' });
      }
      if (workflowResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        });
      }

      throw new Error(
        `ChatKit completion error: ${workflowResponse.status} ${errorText}`
      );
    }

    const response = await workflowResponse.json();

    console.log('[BBQ Workflow] Successfully processed workflow request');

    // Return the full workflow response
    // The exact structure will need to be inspected and parsed on the client side
    return res.status(200).json(response);
  } catch (error) {
    console.error('BBQ workflow error:', error);

    if (error instanceof Error) {
      // Handle specific OpenAI API errors
      if (error.message.includes('401')) {
        return res.status(500).json({ error: 'Invalid OpenAI API key' });
      }
      if (error.message.includes('429')) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        });
      }
      if (error.message.includes('403')) {
        return res.status(500).json({
          error: 'Access denied. Please check your OpenAI account permissions.',
        });
      }
    }

    return res.status(500).json({
      error: 'Failed to call BBQ workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
