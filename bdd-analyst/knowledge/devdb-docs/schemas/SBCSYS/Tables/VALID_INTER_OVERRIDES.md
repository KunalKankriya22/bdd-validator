---
tags:
  - table
  - SBCSYS
---
# VALID_INTER_OVERRIDES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 134
**Last Analyzed**: 2026-04-23 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | DONOR_DECISION_CODE | VARCHAR2(1) | No |  |  |
| 3 | INTER_CODE | VARCHAR2(4) | No |  |  |
| 4 | INTER_TYPE | VARCHAR2(1) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INTER_OVERRIDES_IDX1 | NORMAL | UNIQUE | PRODUCT_TYPE, DONOR_DECISION_CODE, INTER_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_BD|VALID_INTER_OVERRIDES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_BI|VALID_INTER_OVERRIDES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_BU|VALID_INTER_OVERRIDES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
