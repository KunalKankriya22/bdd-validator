---
tags:
  - table
  - SBCSYS
---
# RGT_SKIP_SAMPLES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1280
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | Yes |  |  |
| 5 | SKIP_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 8 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | RESET_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RGT_SKIP_SAMPLES_IDX1_RC | NORMAL | NONUNIQUE | REASON_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_SKIP_SAMPLES_BD|RGT_SKIP_SAMPLES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_SKIP_SAMPLES_BI|RGT_SKIP_SAMPLES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_SKIP_SAMPLES_BU|RGT_SKIP_SAMPLES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
