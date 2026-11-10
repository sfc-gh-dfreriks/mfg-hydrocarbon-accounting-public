# Hydrocarbon Accounting 360 — public demo

A static, no-login build of the **Hydrocarbon Accounting 360** app (Oil, Gas & Energy use case 11 in the
`mfg-use-cases` source repository), for GitHub Pages:

**https://sfc-gh-dfreriks.github.io/mfg-hydrocarbon-accounting-public/** (live once this repository is published)

The app answers one question: *from the wellhead to the owner check, what did we produce, what did we get paid, and where is
revenue leaking?* It follows allocated well volumes through PRA valuation, division orders and owner distribution to the
general ledger, and joins them with a land and lease system (Quorum / Enverus style), field ticketing (OpenInvoice style) and
daily market prices (Platts / Argus / NYMEX style). It reads two SAP instances, each as SAP ECC, S/4HANA, BW/4HANA or SAP BDC.
The data flows through dbt staging adapters, a canonical silver layer and gold marts on Snowflake, then to a semantic view, a
Cortex Agent and this React app.

**Data caveats**
- All data is synthetic. Pecos Ridge Energy is a fictional operator; wells, owners, purchasers and vendors are invented.
- The SAP IS-Oil upstream tables (`OIUH_*`, `OIUR_*` on ECC, `OIUX_*` on S/4HANA) are **simulated** with representative names.
  They are not the exact SAP DDIC, and their metadata is synthetic.
- SAP BDC has no data products for IS-Oil upstream (volumes, valuation, division orders, revenue distribution); with BW or BDC
  selected those objects are recorded as coverage gaps. The snapshot uses SAP A = ECC and SAP B = S/4HANA.
- Netback per BOE is computed over valued volume.

**Pages:** Ask Cortex · Executive Dashboard · Production · Revenue & Royalties · Netbacks · Lease Operating Expense ·
Division Orders · Volume-to-Revenue Recon · Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, all non-SAP sources on.
- **Filters:** every basin subset with all products is baked, and so are all basins or one basin with each single product
  (30 views per page). Other combinations fall back to the nearest baked view.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Build locally

```bash
npm ci
VITE_STATIC=1 BASE_PATH=/mfg-hydrocarbon-accounting-public/ npx vite build   # output in dist/
```

## Full deployment

Live queries, source switching and free-text Ask Cortex need the full deployment from the `mfg-use-cases` source repository
(`use_cases/11_hydrocarbon_accounting`, see its README): `tools/build_local.sh` builds the data, dbt project, semantic view and
agent in Snowflake, and `npm run dev` in `app/` starts the app.
