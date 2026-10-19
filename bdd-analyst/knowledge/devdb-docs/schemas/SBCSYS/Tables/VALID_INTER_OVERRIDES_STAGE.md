---
tags:
  - table
  - SBCSYS
---
# VALID_INTER_OVERRIDES_STAGE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 153
**Last Analyzed**: 2026-04-25 03:00:11
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
| 8 | MOVE_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INTER_OVER_STAGE_IDX1 | NORMAL | UNIQUE | PRODUCT_TYPE, DONOR_DECISION_CODE, INTER_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_STAGE_BD|VALID_INTER_OVERRIDES_STAGE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_STAGE_BI|VALID_INTER_OVERRIDES_STAGE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTER_OVERRIDES_STAGE_BU|VALID_INTER_OVERRIDES_STAGE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
