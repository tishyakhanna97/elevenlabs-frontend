const DEFAULT_WEBHOOK = 'https://mattferoz.app.n8n.cloud/webhook/eleven-labs-conversation';

export type AgentResponse = {
  transcription?: string;
  responseText?: string;
  audioUrl?: string;
  conversation_id?: string;
  session_id?: string;
  [key: string]: any;
};

const WEBHOOK_URL = import.meta.env.VITE_AGENT_WEBHOOK_URL || DEFAULT_WEBHOOK;

export const getWebhookUrl = () => WEBHOOK_URL;

export async function sendAgentMessage({
  message,
  conversationId,
  contextId,
  extra,
}: {
  message: string;
  conversationId?: string | null;
  contextId?: string;
  extra?: Record<string, unknown>;
}): Promise<AgentResponse> {
  const body = {
    message,
    ...(conversationId ? { conversation_id: conversationId } : {}),
    ...(contextId ? { context_id: contextId } : {}),
    ...(extra || {}),
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent request failed (${response.status}): ${text}`);
  }

  try {
    return await response.json();
  } catch (error) {
    const text = await response.text().catch(() => '');
    throw new Error(`Agent request failed: invalid JSON response${text ? ` - ${text}` : ''}`);
  }
}

export async function sendAgentAudio({
  audio,
  conversationId,
  contextId,
  sessionId,
  extra,
}: {
  audio: Blob;
  conversationId?: string | null;
  contextId?: string;
  sessionId?: string | null;
  extra?: Record<string, unknown>;
}): Promise<AgentResponse> {
  const formData = new FormData();
  formData.append('audio', audio);
  if (conversationId) formData.append('conversation_id', conversationId);
  if (contextId) formData.append('context_id', contextId);
  if (sessionId) formData.append('session_id', sessionId);

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent audio request failed (${response.status}): ${text}`);
  }

  try {
    return await response.json();
  } catch (error) {
    const text = await response.text().catch(() => '');
    throw new Error(`Agent audio request failed: invalid JSON response${text ? ` - ${text}` : ''}`);
  }
}
