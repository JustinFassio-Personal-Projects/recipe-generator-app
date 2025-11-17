import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatKitSessionRequest {
  userId?: string;
  existingClientSecret?: string;
  workflowId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      existingClientSecret,
      workflowId: requestWorkflowId,
    }: ChatKitSessionRequest = req.body;

    console.log('[ChatKit Session] Request received:', {
      hasUserId: !!userId,
      hasExistingSecret: !!existingClientSecret,
      workflowId: requestWorkflowId,
    });

    // Get server-side API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(
        '[ChatKit Session] OpenAI API key not configured on server'
      );
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Workflow ID - can be passed in request or use default
    const workflowId =
      requestWorkflowId ||
      'wf_6918be4c124881909eef316b88fc1e46089901a8738709d8';

    console.log('[ChatKit Session] Using workflow ID:', workflowId);

    // If we have an existing client secret, refresh the session
    if (existingClientSecret) {
      console.log('[ChatKit Session] Refreshing existing session');
      const refreshResponse = await fetch(
        'https://api.openai.com/v1/chatkit/sessions/refresh',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'chatkit_beta=v1',
          },
          body: JSON.stringify({
            client_secret: existingClientSecret,
          }),
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('[ChatKit Session] Session refreshed successfully');
        return res
          .status(200)
          .json({ client_secret: refreshData.client_secret });
      }

      // Log refresh failure but continue to create new session
      const refreshErrorText = await refreshResponse.text();
      console.warn(
        '[ChatKit Session] Refresh failed, creating new session:',
        refreshResponse.status,
        refreshErrorText
      );
    }

    // Create new ChatKit session
    const userIdentifier = userId || 'anonymous';
    console.log(
      '[ChatKit Session] Creating new session for user:',
      userIdentifier
    );

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
        '[ChatKit Session] Session creation failed:',
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
      if (sessionResponse.status === 404) {
        return res.status(500).json({
          error: `Workflow not found. Please verify the workflow ID: ${workflowId}`,
        });
      }

      throw new Error(
        `ChatKit session error: ${sessionResponse.status} ${errorText}`
      );
    }

    const sessionData = await sessionResponse.json();
    console.log('[ChatKit Session] Successfully created session:', {
      workflowId,
      userId: userIdentifier,
      hasClientSecret: !!sessionData.client_secret,
    });

    return res.status(200).json({ client_secret: sessionData.client_secret });
  } catch (error) {
    console.error('[ChatKit Session] Unexpected error:', error);

    return res.status(500).json({
      error: 'Failed to create ChatKit session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
