-- Keep existing UA tenant records in sync with the app's accepted UA email domains.
UPDATE tenants
SET allowed_email_domains = ARRAY['ua.edu', 'crimson.ua.edu'],
    updated_at = now()
WHERE slug = 'ua';
