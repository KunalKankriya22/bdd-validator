---
tags:
  - table
  - SBCSYS
---
# VALID_BAND_RESULTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 2 | RESULT | VARCHAR2(2) | Yes |  |  |
| 3 | RESULT_SEQ | NUMBER(2) | Yes |  |  |
| 4 | RESULT_DESC | VARCHAR2(50) | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER(10) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 8 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
