# Cloudflare publication

Target: https://xiaosang.cc/origami-studio/
Repository: https://github.com/holynova/origami-studio
Source branch: main
Worker: origami-studio
Account: ef7863c4de93e71c3496f940c8ab4865
Portfolio: holynova/holynova.github.io, master; Worker xiaosang-portfolio

## Initial check (2026-10-23)

- Existing Sites publication and application: checked, reused.
- Existing source history and main branch: checked, reused.
- Public GitHub repository and Homepage: missing, to complete.
- Cloudflare Worker, custom domain and deployment configuration: missing, to complete; account and xiaosang.cc zone verified; no naming conflict found.
- GitHub link, visible version and Umami: missing, to complete.
- Screenshot: existing 1280 × 720 real browser screenshot reused; core studio UI unchanged.
- QR and bilingual release README: missing, to complete.
- Portfolio and GitHub Profile entries: missing, to complete from clean upstream checkouts, preserving unrelated local commits.

## Route selection

The first custom-domain binding was rejected with Cloudflare code 100122: the zone has reached its 100 Workers custom-domain limit. The uploaded Worker remains intact. This release follows the account’s existing Fourier Atlas and Podcast Atlas path-routing convention: xiaosang.cc/origami-studio and xiaosang.cc/origami-studio/*, served by the independent origami-studio Worker. No existing domain or route is replaced. The final README, QR, Homepage, and catalog use the verified path URL.
