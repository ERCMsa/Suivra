# Architecture rules

- Vercel deployments must serve index.html for extensionless application routes while preserving static asset paths, so direct visits and authentication redirects reach React Router rather than a hosting 404.
- Supplier categories use a dedicated table and many-to-many links; save supplier details and associations through a security-invoker transaction so permissions and atomic persistence stay enforced.
- Preserve the deprecated supplier category text without deriving category records from it; category names displayed throughout the app come only from explicit links.