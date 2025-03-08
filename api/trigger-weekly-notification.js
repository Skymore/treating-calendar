// API handler that will be called by Vercel Cron
export default async function handler(req, res) {
  try {
    // Prevent non-Cron calls (simple validation)
    // Vercel Cron jobs set x-vercel-cron header
    const isCronJob = req.headers['x-vercel-cron'] === 'true';
    const isAuthorized = 
      req.headers.authorization === `Bearer ${process.env.CRON_SECRET}` ||
      isCronJob;
    
    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get Supabase function URL and key
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const FUNCTION_SECRET_KEY = process.env.FUNCTION_SECRET_KEY;
    
    if (!SUPABASE_URL || !FUNCTION_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Missing environment variables' 
      });
    }
    
    // Call Supabase Edge Function
    const functionUrl = `${SUPABASE_URL}/functions/v1/send-weekly-notification`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FUNCTION_SECRET_KEY}`
      },
      body: JSON.stringify({
        isScheduledExecution: true,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to trigger function: ${response.status} ${response.statusText} - ${
          JSON.stringify(errorData)
        }`
      );
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully triggered weekly notification',
      functionResponse: data
    });
  } catch (error) {
    console.error('Error triggering weekly notification:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 