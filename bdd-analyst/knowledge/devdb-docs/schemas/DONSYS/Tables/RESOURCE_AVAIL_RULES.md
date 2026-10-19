---
tags:
  - table
  - DONSYS
---
# RESOURCE_AVAIL_RULES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 250
**Last Analyzed**: 2026-04-07 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESOURCE_CODE | VARCHAR2(5) | No |  |  |
| 2 | WEEK_DAY | VARCHAR2(3) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | MAX_AVAILABLE | NUMBER(4) | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**RESOURCE_AVAIL_RULES_PK**: `RESOURCE_CODE, WEEK_DAY, CHAPTER_ID, EFF_DATE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESOURCE_AVAIL_RULES_PK | NORMAL | UNIQUE | RESOURCE_CODE, WEEK_DAY, CHAPTER_ID, EFF_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/RESOURCE_AVAIL_RULES_BD|RESOURCE_AVAIL_RULES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/RESOURCE_AVAIL_RULES_BI|RESOURCE_AVAIL_RULES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/RESOURCE_AVAIL_RULES_BU|RESOURCE_AVAIL_RULES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
