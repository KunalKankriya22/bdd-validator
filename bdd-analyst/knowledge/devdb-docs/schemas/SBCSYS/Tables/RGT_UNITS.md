---
tags:
  - table
  - SBCSYS
---
# RGT_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 53
**Last Analyzed**: 2025-09-16 03:14:37
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | PROFILE_TESTS | VARCHAR2(1) | Yes |  |  |
| 6 | STAT_TESTS | VARCHAR2(1) | Yes |  |  |
| 7 | UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | COLL_DATE | DATE | Yes |  |  |
| 9 | COLLECTION_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**RGT_UNITS_PK**: `CHAPTER_ID, CONTRACT_ID, BATCH_ID, UNIT_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RGT_UNITS_PK | NORMAL | UNIQUE | CHAPTER_ID, CONTRACT_ID, BATCH_ID, UNIT_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_UNITS_BD|RGT_UNITS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_UNITS_BI|RGT_UNITS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_UNITS_BU|RGT_UNITS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
