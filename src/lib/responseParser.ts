import { z } from 'zod';

const ContentResponseSchema = z.object({
  content: z.string(),
  format: z.string().optional(),
  status: z.string().optional(),
});

export async function parseResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      // Try to validate against our expected schema
      const result = ContentResponseSchema.safeParse(data);
      if (result.success) {
        return result.data.content;
      }
      // If it doesn't match our schema but has a content field
      if (typeof data.content === 'string') {
        return data.content;
      }
      // If it's just a string
      if (typeof data === 'string') {
        return data;
      }
      throw new Error('Invalid JSON response format');
    }

    if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const content = xmlDoc.querySelector('content')?.textContent ||
                     xmlDoc.querySelector('response')?.textContent ||
                     text;
      return content;
    }

    // Handle plain text
    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error('Response parsing error:', error);
    throw new Error('Failed to parse response');
  }
}