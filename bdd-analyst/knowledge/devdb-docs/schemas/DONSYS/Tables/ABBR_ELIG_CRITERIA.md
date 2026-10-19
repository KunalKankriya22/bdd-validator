---
tags:
  - table
  - DONSYS
---
# ABBR_ELIG_CRITERIA

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2026-04-23 03:00:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FREQ_BETWEEN_DONATIONS | NUMBER | Yes |  |  |
| 2 | FREQ_TYPE | VARCHAR2(1) | Yes |  |  |
| 3 | NO_OF_DONATIONS | NUMBER | Yes |  |  |
| 4 | INTER_WRONG_QUESTION | VARCHAR2(5) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | DHQ_DON_TYPES | VARCHAR2(500) | Yes |  |  |
| 12 | DEFERRAL_PERIOD | NUMBER | No |  |  |
| 13 | MIN_DONATIONS | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/ABBR_ELIG_CRITERIA_BD|ABBR_ELIG_CRITERIA_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/ABBR_ELIG_CRITERIA_BI|ABBR_ELIG_CRITERIA_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/ABBR_ELIG_CRITERIA_BU|ABBR_ELIG_CRITERIA_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
