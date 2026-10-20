<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# BMS-first development policy

The master product is `MarkDiamant/diamant-solutions/business-software-core/`, not M&J. M&J is the first tenant, and its fine-tuned workflows are the default BMS behaviour for every tenant. Implement all features and fixes in canonical BMS first, then synchronise this repository's `business-software-core/` mirror. Keep `components/admin/` and `lib/crm/` as thin compatibility re-exports. Do not fork default UI, Ruby, quotes, PDF or customer logic for M&J. Tenant-specific branding, industry copy, database mapping and isolated data are configuration only; deviations require explicit approval. Demo accounts use shared functionality and separate fictional data. Test both deployments after synchronisation, and never claim authenticated end-to-end success from a green build alone. Never modify real quotes or customers as a test without explicit permission.
