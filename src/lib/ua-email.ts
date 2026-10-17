const UA_EMAIL_DOMAINS = ['ua.edu', 'crimson.ua.edu'] as const;

export function isUaEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@').at(-1);
  return domain !== undefined && UA_EMAIL_DOMAINS.includes(domain as (typeof UA_EMAIL_DOMAINS)[number]);
}

export const uaEmailPlaceholder = 'you@ua.edu or you@crimson.ua.edu';
