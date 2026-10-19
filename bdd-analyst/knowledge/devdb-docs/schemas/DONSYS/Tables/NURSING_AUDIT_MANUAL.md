---
tags:
  - table
  - DONSYS
---
# NURSING_AUDIT_MANUAL

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20448
**Last Analyzed**: 2026-05-20 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(20) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ID_TYPE | VARCHAR2(20) | Yes |  |  |
| 4 | ID_VALUE | VARCHAR2(15) | Yes |  |  |
| 5 | COLL_DATE | DATE | Yes |  |  |
| 6 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 7 | STATUS | VARCHAR2(20) | Yes |  |  |
| 8 | REASON | VARCHAR2(4000) | Yes |  |  |
| 9 | EXCLUDE_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 13 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| NURSING_AUDIT_MANUAL_SSS | NORMAL | NONUNIQUE | SESSION_ID, STATUS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
| PUBLIC | ALTER | NO |
| PUBLIC | DEBUG | NO |
| PUBLIC | DELETE | NO |
| PUBLIC | FLASHBACK | NO |
| PUBLIC | INDEX | NO |
| PUBLIC | INSERT | NO |
| PUBLIC | ON COMMIT REFRESH | NO |
| PUBLIC | QUERY REWRITE | NO |
| PUBLIC | READ | NO |
| PUBLIC | REFERENCES | NO |
| PUBLIC | SELECT | NO |
| PUBLIC | UPDATE | NO |
