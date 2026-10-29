# Bright Data root CA

`brightdata_root_ca_44445.crt` is Bright Data's public root certificate for proxy
port **44445** (Residential, Mobile, Unlocker and SERP APIs). It is a public CA
certificate — no secret material here.

## Why it is in the image

Bright Data terminates TLS and presents its own certificate: a request to
`https://www.google.com/` through the SERP proxy arrives with `CN=*.google.com`
signed by `Bright Data Intermediate CA <year>`. The public roots cannot validate
that chain, so the proxy scraper in `utils/scraper.ts` fails with
`unable to get local issuer certificate`.

The usual workaround is `NODE_TLS_REJECT_UNAUTHORIZED=0`, which switches off
certificate verification for the **whole Node process** — including the Google
Search Console, Google Ads and SMTP credentials those integrations send. Trusting
this one extra root instead keeps verification on everywhere else:

```
NODE_EXTRA_CA_CERTS=/app/certs/brightdata_root_ca_44445.crt
```

Deployments that use a hosted scraper API rather than the proxy do not need it;
the variable can simply be left unset.

## Provenance

| | |
|---|---|
| Source | `https://brightdata.com/static/brightdata_proxy_ca.zip` (linked from <https://docs.brightdata.com/general/account/ssl-certificate>) |
| Path in archive | `brightdata_proxy_ca/brightdata_root_ca_44445.crt` |
| Subject / issuer | `C=US, O=Bright Data, CN=Bright Data Root CA` (self-signed) |
| Valid | 2026-07-23 → 2046-07-18 |
| SHA-256 | `DB:85:48:F8:A5:B1:16:65:36:92:0C:CD:04:73:84:0F:7F:DB:AF:16:5D:ED:F9:07:B7:B5:23:61:AB:C8:7B:60` |

The intermediate is rotated yearly; this root is not, so the file needs no
periodic refresh. Check it before trusting a replacement:

```sh
openssl x509 -in certs/brightdata_root_ca_44445.crt -noout -subject -dates -fingerprint -sha256
```

The archive also carries `legacy/brightdata_root_ca_33335.crt` for the older port
33335. It is not shipped here.
