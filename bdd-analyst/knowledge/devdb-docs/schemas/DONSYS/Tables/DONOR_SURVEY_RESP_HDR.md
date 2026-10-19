---
tags:
  - table
  - DONSYS
---
# DONOR_SURVEY_RESP_HDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 359
**Last Analyzed**: 2026-04-08 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SURVEY_ID | VARCHAR2(30) | No |  |  |
| 2 | TEMPLATE_ID | VARCHAR2(10) | No |  |  |
| 3 | SURVEY_START | DATE | Yes |  |  |
| 4 | SURVEY_END | DATE | Yes |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 10 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 11 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 12 | TYPE_OF_SURVEY | VARCHAR2(5) | Yes |  |  |
| 13 | SURVEY_DATE | DATE | Yes |  |  |
| 14 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_SURVEY_RESP_HDR_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_HDR_BD|DONOR_SURVEY_RESP_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_HDR_BI|DONOR_SURVEY_RESP_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_HDR_BU|DONOR_SURVEY_RESP_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
