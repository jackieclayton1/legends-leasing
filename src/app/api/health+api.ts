const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** A small in-app endpoint used by the web and native clients. */
export function GET() {
  return Response.json(
    {
      message: 'Hello from the Legends Leasing API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
