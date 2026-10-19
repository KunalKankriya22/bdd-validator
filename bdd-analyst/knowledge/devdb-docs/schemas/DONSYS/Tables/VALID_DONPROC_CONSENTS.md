---
tags:
  - table
  - DONSYS
---
# VALID_DONPROC_CONSENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 71
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 4 | CONSENT_CODE | VARCHAR2(10) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_DONPROC_CONSENTS_BD|VALID_DONPROC_CONSENTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DONPROC_CONSENTS_BI|VALID_DONPROC_CONSENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DONPROC_CONSENTS_BU|VALID_DONPROC_CONSENTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
