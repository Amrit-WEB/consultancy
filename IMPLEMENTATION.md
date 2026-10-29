# Study Abroad Consultancy Website --- Implementation & Security Specification

**Document status:** Implementation baseline\
**Product:** Bilingual (English/German) study-abroad consultancy website
focused initially on Germany\
**Primary audience:** Students in India\
**Architecture:** React + Vite + Tailwind CSS, Node.js + Express,
MongoDB Atlas\
**Admin access:** One authorized administrator only; no public
registration\
**Content management:** Custom admin CMS with rich-text editing and
cloud image storage

> Security objective: minimize attack surface and prevent common
> vulnerabilities. No application can be guaranteed "risk-free." Follow
> this document, keep dependencies updated, test the deployed system,
> and review security after changes.

------------------------------------------------------------------------

## 1. Product scope

### Public website

-   Home
-   Study in Germany
-   Services
-   About Us
-   Consultation / Contact
-   FAQ
-   Privacy Policy
-   Terms and Conditions
-   Other legally required disclosures, depending on the business and
    jurisdiction
-   English and German versions, with language switching and localized
    metadata
-   Responsive layouts and accessible forms
-   WhatsApp click-to-chat links
-   Student enquiry form
-   Basic SEO and consent-aware analytics, if enabled

### Admin CMS

-   One administrator account only
-   No public sign-up, invitation, or account creation endpoint
-   Secure admin login and logout
-   Dashboard overview
-   Create, edit, publish/unpublish, and archive universities
-   University image upload and image replacement
-   Manage courses and related university details
-   Manage services and FAQs
-   Edit approved page sections and legal-page content
-   English/German content fields
-   Manage leads: view, search/filter, change status, add internal
    follow-up notes, export only if explicitly approved
-   Media management for images used by the site
-   Audit trail for sensitive admin actions where practical

### Explicitly out of scope for initial release

-   Student accounts or student dashboard
-   Public account registration
-   Payment processing
-   WhatsApp Business API automation
-   Visa/admission prediction or guarantees
-   Drag-and-drop unrestricted page builder
-   Multiple admin roles
-   Public APIs for editing content

------------------------------------------------------------------------

## 2. Proposed architecture

``` text
Browser
  ├── Public React website
  └── Admin React routes (/admin/*)
            |
            | HTTPS
            v
      Express API
        ├── Public read-only content routes
        ├── Public lead submission route
        └── Protected admin routes
            ├── Authentication and authorization
            ├── Content services
            ├── Lead management
            └── Media upload validation
            |
            ├── MongoDB Atlas (private credentials, TLS)
            ├── Transactional email provider
            └── Cloud image storage (private API credentials)
```

The public website and admin panel may live in one React/Vite
repository, but the server must enforce all permissions. Hiding admin
links or protecting routes only in React is not security.

### Suggested repository layout

``` text
study-abroad/
├── client/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── admin/
│       ├── i18n/
│       ├── services/
│       └── utils/
├── server/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       │   ├── auth/
│       │   ├── leads/
│       │   ├── universities/
│       │   ├── services/
│       │   ├── pages/
│       │   ├── faqs/
│       │   └── media/
│       ├── services/
│       ├── app.js
│       └── server.js
├── docs/
│   ├── IMPLEMENTATION.md
│   └── SECURITY_CHECKLIST.md
├── .gitignore
└── README.md
```

Use the actual project's conventions if already established; do not
blindly overwrite existing code or configuration.

------------------------------------------------------------------------

## 3. Admin identity and authentication requirements

1.  **Exactly one administrator account is supported.**
2.  Do not implement public registration, password reset by
    unauthenticated email alone, user invitation, or role selection.
3.  Bootstrap the initial admin through a one-time secure CLI/script or
    deployment process. Do not hardcode the password or commit it to
    Git.
4.  Store only a strong password hash using **Argon2id** (preferred) or
    appropriately configured bcrypt. Never store or log plaintext
    passwords.
5.  Require a long, unique admin password; support password changes
    through an authenticated flow with current-password verification.
6.  Consider mandatory MFA/TOTP for production. If not implemented for
    MVP, record this as a security limitation and use a strong unique
    password and hosting-level protections.
7.  Use server-side sessions stored in a suitable shared store (for
    example, MongoDB-backed sessions) rather than storing long-lived
    JWTs in `localStorage`.
8.  Session cookies must be `HttpOnly`, `Secure` in production, and
    `SameSite=Lax` or stricter where compatible. Set a narrow cookie
    path/domain where possible.
9.  Rotate the session ID after successful login. Destroy the session on
    logout. Apply idle and absolute session expiration.
10. Use CSRF protection for state-changing requests when cookie-based
    authentication is used. Validate `Origin`/`Referer` for
    browser-originated unsafe requests as a defense-in-depth measure.
11. Use generic login errors (for example, "Invalid credentials") so the
    endpoint does not reveal whether an admin account exists.
12. Rate-limit login attempts by IP and account identifier; apply
    progressive delays or temporary throttling. Avoid permanent lockouts
    that attackers can abuse for denial of service.
13. Never log passwords, session IDs, cookies, authorization headers,
    reset tokens, or secret values.
14. Admin routes must verify the authenticated session and authorization
    on the server on every request.
15. There must be no default credentials in production and no admin
    bootstrap endpoint exposed publicly.
16. Disable verbose stack traces and debug endpoints in production.

### Single-admin bootstrap

-   Use a one-time script or deployment command that reads credentials
    from secure environment variables or prompts securely.
-   Fail if an admin already exists; do not silently overwrite an
    existing account.
-   Remove/disable bootstrap credentials and procedures after
    provisioning.
-   Document how to rotate the admin password and recover access safely.

------------------------------------------------------------------------

## 4. Authorization and route design

### Public routes

Only expose the minimum data required by the website: -
`GET /api/public/universities` - `GET /api/public/universities/:slug` -
`GET /api/public/services` - `GET /api/public/pages/:slug` -
`GET /api/public/faqs` - `POST /api/public/leads`

Public content endpoints must return **published** content only. Never
expose internal notes, unpublished drafts, admin details, database IDs
where unnecessary, or lead records.

### Protected routes

All routes under `/api/admin/*` require a valid admin session and CSRF
validation for state-changing operations. Examples: -
`GET /api/admin/me` - `POST /api/admin/logout` - CRUD routes for
universities, services, pages, FAQs and media - Lead listing, detail,
status updates, and internal notes

Do not create public admin CRUD endpoints. Use a centralized
`requireAdmin` middleware and test every protected route for
unauthenticated access. The backend---not the frontend---must decide
authorization.

### API safety

-   Validate route parameters, query parameters, and request bodies with
    a schema library such as Zod/Joi.
-   Reject unknown fields where appropriate.
-   Use explicit allowlists for writable fields; never pass `req.body`
    directly into MongoDB updates.
-   Avoid unsafe mass assignment and MongoDB operator injection. Never
    accept client-supplied `$` operators or arbitrary MongoDB filters.
-   Set pagination limits and sorting allowlists.
-   Return consistent error responses without stack traces or sensitive
    internals.
-   Apply request body size limits and sensible timeouts.
-   Disable unnecessary HTTP methods and routes.

------------------------------------------------------------------------

## 5. Rate limiting and abuse prevention

Use `express-rate-limit` or a maintained equivalent. In production with
multiple server instances, use a shared store such as Redis; an
in-memory limiter alone is not reliable across instances or restarts.

Suggested starting limits (tune after monitoring):

  -----------------------------------------------------------------------
  Endpoint/category                   Starting limit
  ----------------------------------- -----------------------------------
  Admin login                         5 attempts per 15 minutes per IP,
                                      plus account-level throttling

  Public lead submission              5 submissions per 15 minutes per IP

  General public API                  100 requests per 15 minutes per IP

  Admin write operations              60 requests per minute per
                                      authenticated session

  Upload endpoint                     10 uploads per 10 minutes per
                                      authenticated admin
  -----------------------------------------------------------------------

Additional requirements: - Configure Express `trust proxy` only for the
known hosting proxy setup. Incorrect proxy trust can make IP-based
limits ineffective. - Add a honeypot field and minimum form-completion
time check to the public form; treat these as supplemental, not
definitive. - Add a CAPTCHA/Turnstile challenge if spam persists or
threat level requires it. - Do not rely on client-side rate limiting. -
Use payload limits, upload limits and request timeouts to reduce
resource-exhaustion risk. - Monitor repeated failures and suspicious
spikes without collecting unnecessary personal data.

------------------------------------------------------------------------

## 6. Security headers, CORS, transport and browser protections

1.  Use `helmet` and explicitly configure a Content Security Policy
    (CSP). Start with a restrictive policy and allow only the required
    script, style, image, font and connection sources. Avoid
    `unsafe-eval`; avoid `unsafe-inline` where feasible.
2.  Enforce HTTPS in production and enable HSTS only when HTTPS is
    correctly configured for the domain and subdomains.
3.  Configure CORS with the exact production frontend origin(s). Do not
    use `origin: '*'` with credentialed requests.
4.  Do not reflect arbitrary origins or allow arbitrary credentials.
5.  Set `X-Content-Type-Options: nosniff`, an appropriate
    `Referrer-Policy`, and frame protections via CSP `frame-ancestors`.
6.  Use secure cookie settings in production.
7.  Do not expose server version banners or unnecessary framework
    fingerprints.
8.  Keep frontend and API origins stable and documented.
9.  Validate all external redirect destinations against an allowlist to
    avoid open redirects.

------------------------------------------------------------------------

## 7. Rich-text editor and stored XSS protection

Rich text from the admin is still untrusted input: a compromised admin
session or pasted content could introduce malicious markup.

-   Prefer a maintained rich-text editor with a constrained set of
    supported formats.
-   Sanitize HTML on the server using a maintained sanitizer with a
    strict allowlist.
-   Allow only safe tags and attributes. Disallow scripts, event-handler
    attributes, unsafe URL schemes, embedded objects, iframes and
    arbitrary styles unless a reviewed requirement exists.
-   Validate links; allow only expected protocols such as `https:`,
    `http:` and safe relative links. Reject `javascript:` and other
    executable schemes.
-   Render plain text as text. Do not use React
    `dangerouslySetInnerHTML` with unsanitized content.
-   Sanitize on write and, where appropriate, validate again on output.
-   Test stored XSS payloads in titles, descriptions, FAQs, legal
    content, URLs and image metadata.
-   Treat translations as separate content requiring the same
    validation.

------------------------------------------------------------------------

## 8. Image upload and media security

Prefer Cloudinary or an equivalent managed image service. Keep its API
secret only on the server.

-   Allow only required raster formats (for example JPEG, PNG, WebP).
    Allow SVG only if there is a reviewed, safe sanitization strategy;
    otherwise reject it.
-   Verify file signatures/magic bytes, not just filename or
    client-supplied MIME type.
-   Enforce a file-size limit (suggested starting point: 5 MB per image)
    and dimension/pixel limits.
-   Generate server-side random object names; never trust paths or
    filenames from the client.
-   Re-encode images where practical to remove unexpected embedded
    content/metadata.
-   Restrict uploads to authenticated admin sessions and apply upload
    rate limits.
-   Store image URLs/asset IDs, not arbitrary local filesystem paths.
-   Do not allow user-supplied remote URLs to trigger server-side
    fetching (avoid SSRF).
-   Configure storage to serve assets safely; do not expose provider API
    secrets or private credentials.
-   Provide safe replacement/deletion behavior and avoid deleting assets
    still referenced by published content.

------------------------------------------------------------------------

## 9. MongoDB and secrets management

-   Use MongoDB Atlas with TLS and a dedicated database user with
    least-privilege permissions.
-   Restrict Atlas network access to the hosting provider's supported
    egress IPs where feasible; avoid `0.0.0.0/0` in production unless
    there is a documented, reviewed necessity.
-   Keep database credentials out of source code, client-side variables,
    logs, screenshots and public repositories.
-   Store secrets in hosting-provider secret/environment settings.
    Commit only `.env.example` with placeholders.
-   Validate required environment variables at startup and fail safely
    when critical values are missing.
-   Use Mongoose schema validation and explicit field allowlists.
-   Never expose MongoDB connection strings or raw database errors to
    the browser.
-   Back up the database, define retention and test restoration.
-   Separate development and production databases/credentials.
-   Do not use production personal data in local development or test
    fixtures.

Suggested environment variables (names only; never commit real values):

``` env
NODE_ENV=
PORT=
CLIENT_ORIGIN=
MONGODB_URI=
SESSION_SECRET=
EMAIL_PROVIDER_API_KEY=
LEAD_NOTIFICATION_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

If the chosen session store requires its own connection configuration,
add it securely. `SESSION_SECRET` must be cryptographically random and
sufficiently long. Never expose secrets through variables prefixed with
`VITE_`.

------------------------------------------------------------------------

## 10. Lead form and privacy controls

-   Collect only data needed to respond to a student enquiry.
-   Suggested fields: name, email, phone/WhatsApp, intended study level,
    intake, optional message, language and source.
-   Make optional fields genuinely optional and validate phone/email
    formats sensibly without rejecting legitimate international formats.
-   Show a clear privacy notice and obtain any consent required for the
    actual processing. Do not bundle marketing consent with handling the
    requested enquiry.
-   Do not collect passport copies, financial documents or sensitive
    personal documents in the initial enquiry form.
-   Apply server-side validation, payload limits, spam controls and
    duplicate-submission handling.
-   Escape or safely format user-provided values in notification emails
    to avoid email-header injection and HTML injection.
-   Do not put full lead details or sensitive data in URLs, analytics
    events, application logs or WhatsApp URLs without a clear need and
    user awareness.
-   Email notification failure must not discard an already saved lead.
    Log a safe event and provide a retry/alert path.
-   Use a reputable transactional email provider with verified sender
    configuration; do not expose email credentials in the browser.
-   Define a data-retention/deletion process and explain how students
    can contact the business about their data.
-   If analytics or non-essential cookies are used, configure them
    according to applicable consent requirements.
-   The business owner should have the Privacy Policy and other legal
    content reviewed for the countries and services involved. A website
    template is not legal advice.

------------------------------------------------------------------------

## 11. Email notification security

-   Use a transactional email provider with API credentials stored
    server-side.
-   Verify the sender domain and configure SPF, DKIM and DMARC where
    supported.
-   Keep email subject/from fields server-controlled; never accept
    arbitrary values for these headers from a form.
-   Encode user-submitted text safely in HTML email templates.
-   Avoid attaching enquiry documents or secrets to email.
-   Rate-limit and monitor notification attempts.
-   Save the lead before attempting email delivery; retry transient
    failures safely without creating duplicate leads.
-   Never report a submission as failed solely because notification
    email delivery is delayed if the lead was successfully stored.
    Explain the submission status accurately.

------------------------------------------------------------------------

## 12. Content publishing and integrity

For each managed content type, support drafts and publication status
where practical: - University: name, slug, descriptions in
English/German, approved logo/image, location, official link, courses,
status, timestamps. - Service: localized title/description, image if
needed, display order, status. - Page: fixed page/section type,
localized content, metadata, publication status. - FAQ: localized
question/answer, display order, status. - Legal page: localized body,
version/effective date, last-updated date, publication status.

Requirements: - Unique, normalized slugs. - Do not permit arbitrary
code, scripts or custom JavaScript in content. - Prevent public APIs
from returning drafts. - Confirm destructive actions; prefer
archive/soft-delete for universities and leads where appropriate. -
Record who changed content (the sole admin) and timestamps. - Keep
content schema constrained. Avoid an unrestricted "edit any JSON"
feature. - Do not promise that adding a university means it is an
official partner unless the owner has verified and approved that claim.

------------------------------------------------------------------------

## 13. Logging, monitoring and recovery

-   Use structured server logs with request IDs.
-   Never log passwords, cookies, session IDs, secrets, full
    authorization headers or unnecessary personal details.
-   Log security events such as failed logins, rate-limit triggers,
    admin content changes and upload rejections.
-   Configure production error monitoring with sensitive-data scrubbing.
-   Add uptime/health monitoring that does not reveal secrets or
    internal system details.
-   Configure database backups and test restore steps.
-   Document admin password rotation, secret rotation, incident response
    and deployment rollback.
-   Keep dependencies updated and review security advisories.
-   Ensure logs and backups have appropriate access controls and
    retention.

------------------------------------------------------------------------

## 14. Dependency and code-quality controls

-   Use supported Node.js LTS and maintained dependency versions at
    implementation time.
-   Commit a lockfile and use reproducible installs (`npm ci` in
    CI/deployment).
-   Run `npm audit` and review findings; do not blindly apply breaking
    upgrades or assume an audit proves security.
-   Use a secret scanner and keep `.env`, credential files, private keys
    and production dumps out of Git.
-   Add linting, formatting and automated tests.
-   Never run untrusted generated code or shell commands on production.
-   Review every AI-generated change before merging. Vibe coding does
    not replace code review or security testing.
-   Pin or constrain dependency versions sensibly and monitor transitive
    dependency risk.
-   Do not deploy development servers or debug configurations to
    production.

------------------------------------------------------------------------

## 15. Required test plan

### Authentication and access control

-   [ ] No public registration endpoint exists.
-   [ ] Unauthenticated requests to every `/api/admin/*` endpoint return
    `401`/`403`.
-   [ ] A non-admin session cannot access admin APIs.
-   [ ] Login uses generic failure responses and throttling.
-   [ ] Session cookie flags are correct in production.
-   [ ] Session ID rotates on login; logout invalidates the session.
-   [ ] CSRF attempts against state-changing requests are rejected.
-   [ ] Session expires according to the configured policy.
-   [ ] Admin bootstrap cannot be called over a public HTTP route.
-   [ ] No default or hardcoded credentials exist.

### Input, injection and XSS

-   [ ] Invalid/missing/oversized fields are rejected server-side.
-   [ ] MongoDB operators and unexpected fields cannot be injected
    through input.
-   [ ] Stored XSS payloads are sanitized or rendered harmless.
-   [ ] Unsafe URL schemes are rejected.
-   [ ] Email fields cannot inject headers or unsafe HTML.
-   [ ] Errors do not reveal stack traces, secrets or database details.

### Rate limiting and denial-of-service controls

-   [ ] Login, public lead, admin write and upload limits work.
-   [ ] Production rate limiting uses a shared store if multiple
    instances are deployed.
-   [ ] Proxy/IP handling is configured for the actual hosting provider.
-   [ ] Request-body, upload-size and timeout limits work.
-   [ ] Spam controls do not block normal legitimate submissions.

### File upload

-   [ ] Invalid extensions, MIME spoofing and incorrect file signatures
    are rejected.
-   [ ] Oversized and excessively large-dimension images are rejected.
-   [ ] SVG is rejected unless a reviewed safe pipeline is implemented.
-   [ ] Unauthenticated uploads are rejected.
-   [ ] Provider secrets never reach the browser.
-   [ ] Upload errors do not reveal internal paths or credentials.

### Data and privacy

-   [ ] Public APIs return published content only.
-   [ ] Public endpoints cannot read or change leads.
-   [ ] Lead notifications contain only appropriate information.
-   [ ] Failed email delivery does not lose saved leads.
-   [ ] Consent/privacy notice is visible and matches actual data
    processing.
-   [ ] Database backups and restoration have been tested.
-   [ ] Logs do not contain secrets or unnecessary personal data.

### Production readiness

-   [ ] HTTPS and security headers verified.
-   [ ] CORS allows only the intended origin(s).
-   [ ] Production environment variables are configured securely.
-   [ ] No secrets are present in the built frontend bundle.
-   [ ] English/German page routing, metadata and content are tested.
-   [ ] Mobile, keyboard navigation and form accessibility are tested.
-   [ ] Dependency audit and secret scan reviewed.
-   [ ] Production lead submission tested end to end.
-   [ ] Client has approved content and legal pages.

------------------------------------------------------------------------

## 16. Suggested implementation order

1.  Inspect the existing repository and preserve working code.
2.  Set up client/server structure, linting, environment validation and
    error handling.
3.  Configure MongoDB models and public content APIs.
4.  Build the public site with English/German routing and read-only
    published content.
5.  Build the public lead submission flow and safe email notification.
6.  Implement admin session authentication, single-admin bootstrap, CSRF
    and rate limiting before building admin CRUD.
7.  Add university, service, page, FAQ and media management.
8.  Add sanitized rich-text editing and publication workflows.
9.  Add lead management behind admin authorization.
10. Add security tests and review every route and upload path.
11. Deploy staging, test the checklist, obtain client approval, then
    deploy production.
12. Document backup/restore, secret rotation and admin access recovery.

**Git practice:** make a commit after each meaningful, tested milestone.
Never commit secrets or production data. Keep security-sensitive changes
small and reviewable.

------------------------------------------------------------------------

## 17. Definition of done

The website is not ready for production until: - All public and admin
features in the approved scope work. - Only the single provisioned admin
can authenticate. - All admin APIs are protected server-side. - Rate
limits, input validation, upload restrictions, CSRF protections and
security headers are tested. - Published content is separated from
drafts. - Enquiries are saved reliably and email failures are handled. -
No known critical/high exploitable security issue remains unresolved
without explicit risk acceptance. - Production secrets, backups,
monitoring and recovery steps are configured. - The client approves
content, privacy notices and legal disclosures.

**Final note:** These controls reduce common risks but do not guarantee
absolute security. Before handling real student data, perform a
production configuration review and, where feasible, an independent
security assessment.
