---
tags:
  - table
  - DONSYS
---
# BC_STUDY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CONSENT_DATE | DATE | Yes |  |  |
| 4 | CONSENT_CURRENT | DATE | Yes |  |  |
| 5 | PARTICIPANT_ID | VARCHAR2(10) | Yes |  |  |
| 6 | STUDY_ID | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 8 | INSERT_DATS | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BC_STUDY_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, STUDY_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
