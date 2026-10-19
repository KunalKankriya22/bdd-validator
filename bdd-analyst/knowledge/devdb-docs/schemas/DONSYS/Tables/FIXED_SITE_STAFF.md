---
tags:
  - table
  - DONSYS
---
# FIXED_SITE_STAFF

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 244
**Last Analyzed**: 2025-09-16 03:13:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SITE_ID | VARCHAR2(10) | No |  |  |
| 2 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**FIXED_SITE_STAFF_PK**: `SITE_ID, CHAPTER_ID, STAFF_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FIXED_SITE_STAFF_PK | NORMAL | UNIQUE | SITE_ID, CHAPTER_ID, STAFF_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/FIXED_SITE_STAFF_BD|FIXED_SITE_STAFF_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/FIXED_SITE_STAFF_BI|FIXED_SITE_STAFF_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/FIXED_SITE_STAFF_BU|FIXED_SITE_STAFF_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
