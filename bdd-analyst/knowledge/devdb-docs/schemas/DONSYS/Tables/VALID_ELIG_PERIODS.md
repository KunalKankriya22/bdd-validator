---
tags:
  - table
  - DONSYS
---
# VALID_ELIG_PERIODS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 90
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CURR_DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PROCEDURE_GROUP | VARCHAR2(5) | No |  |  |
| 4 | DAYS_BETWEEN | NUMBER(4) | No |  |  |
| 5 | MAX_DONATIONS | NUMBER(3) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_ELIG_PERIODS_PK**: `CURR_DONATION_TYPE, CHAPTER_ID, PROCEDURE_GROUP, DAYS_BETWEEN`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ELIG_PERIODS_PK | NORMAL | UNIQUE | CURR_DONATION_TYPE, CHAPTER_ID, PROCEDURE_GROUP, DAYS_BETWEEN | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ELIG_PERIODS_BD|VALID_ELIG_PERIODS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_PERIODS_BI|VALID_ELIG_PERIODS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_PERIODS_BU|VALID_ELIG_PERIODS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
