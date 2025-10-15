/**
 * Simplified API client for making requests to local API endpoints.
 * This replaces the more complex queries.ts with functionality specific to the local-only use case.
 */

/**
 * Makes a POST request to a local API endpoint.
 * 
 * @param route - The API route to call (e.g., '/api/transcribe')
 * @param body - The request body to send
 * @returns The response data, or null if the request fails
 */
export async function apiCall(route: string, body?: any) {
  try {
    const response = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });

    const result = await response.json();

    if (!result) {
      console.error(`API call to ${route} returned no result`);
      return null;
    }

    if (result.error) {
      console.error(`API call to ${route} returned error:`, result.message || 'Unknown error');
      return null;
    }

    // Return the full result object for consistency with existing code
    return result;
  } catch (error) {
    console.error(`API call to ${route} failed:`, error);
    return null;
  }
}

/**
 * Legacy compatibility - getData function that matches the old interface.
 * This allows existing code to continue working without changes.
 * 
 * @deprecated Use apiCall instead for new code
 */
export async function getData({ route, body }: { route: string; key?: string; body?: any }, qualifier: string = 'data') {
  const result = await apiCall(route, body);
  
  if (!result) {
    return null;
  }

  // Check if the expected qualifier field exists
  if (!result[qualifier]) {
    return null;
  }

  return result;
}
