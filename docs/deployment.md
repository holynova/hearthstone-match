# Deployment

Canonical URL: https://hearthstone-match.xiaosang.cc/

The account currently has 100 Custom Domains. This project uses an exact Worker Route with a proxied A record to reserved documentation IP 192.0.2.1, following the existing FALLWELL deployment pattern. Wrangler stores the route in wrangler.jsonc; only dist/client is uploaded. No origin traffic is required for matching static assets.

Worker: hearthstone-match. Source: main. Build and deploy manually from the same committed source with npm run deploy.
