import { createClerkClient, verifyToken } from '@clerk/backend';

export type AuthenticatedUser = {
  clerkUserId: string;
  email: string;
};

function clerkSecretKey() {
  const value = process.env.CLERK_SECRET_KEY;
  if (!value) {
    throw new Error('CLERK_SECRET_KEY is not configured.');
  }
  return value;
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) {
    throw new Response(JSON.stringify({ error: 'Authentication is required.' }), { status: 401 });
  }

  try {
    const claims = await verifyToken(token, { secretKey: clerkSecretKey() });
    if (!claims.sub) {
      throw new Error('Token did not contain a subject.');
    }

    const clerk = createClerkClient({ secretKey: clerkSecretKey() });
    const user = await clerk.users.getUser(claims.sub);
    const email = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId && address.verification?.status === 'verified',
    )?.emailAddress;

    if (!email) {
      throw new Response(JSON.stringify({ error: 'A verified email address is required.' }), {
        status: 403,
      });
    }

    return { clerkUserId: user.id, email: email.toLowerCase() };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw new Response(JSON.stringify({ error: 'Invalid or expired session.' }), { status: 401 });
  }
}
