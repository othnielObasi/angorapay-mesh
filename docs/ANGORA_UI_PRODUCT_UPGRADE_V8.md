# Angora UI Product Upgrade V8

This upgrade replaces the older noisy static dashboard with a cleaner, production-oriented UI that keeps both product and infrastructure visible.

## Intent

Angora should not look like only an agent demo, and it should not look like only an infrastructure dashboard. The UI now separates the platform into three clear groups:

1. Product workspace
   - Agent Missions
   - Conversations
   - Use Cases

2. Infrastructure console
   - Gateway
   - Marketplace
   - Route Scorecard
   - Policy
   - Payments
   - Reconciliation
   - Proof

3. Operations and adoption
   - Traces
   - Metrics
   - Providers
   - Settings
   - Developers

## Main design principles

- Keep the landing message calm and direct.
- Show the specialist agents as the user-facing product layer.
- Keep Gateway, SDK, payment, proof, and reconciliation visible as the infrastructure foundation.
- Use a ChatGPT-style mission workspace as the primary working surface.
- Keep advanced details such as context, memory, and checkpoints inside trace/inspector areas instead of pushing them into the first screen.
- Support local preview through fallback data while using live backend APIs when the server is running.

## Updated file

- `src/dashboard/public/angora.html`

The UI remains a single static HTML file so it can be deployed inside the existing kit without requiring a frontend build step.
