# Architecture rules

- Vercel deployments must serve index.html for extensionless application routes while preserving static asset paths, so direct visits and authentication redirects reach React Router rather than a hosting 404.