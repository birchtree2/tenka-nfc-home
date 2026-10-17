# Connect umi-cv.com to GitHub Pages

GitHub Pages is already configured for `umi-cv.com`. The domain currently has no apex A/AAAA records, so the page will not resolve there until the DNS records below are added in Cloudflare.

Add these records at the apex (`@`):

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

Set the records to **DNS only** (gray cloud) while GitHub issues the certificate. I left any existing `www` DNS record untouched. If `www.umi-cv.com` should also point to this page and is not in use elsewhere, add a `CNAME` record `www` → `birchtree2.github.io`.

DNS changes can take up to 24 hours to propagate and for HTTPS to become available. After DNS resolves to GitHub Pages, enable **Enforce HTTPS** under the repository's Settings → Pages. See [GitHub's custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-your-custom-domain-for-your-github-pages-site) for the official record values and verification steps.
