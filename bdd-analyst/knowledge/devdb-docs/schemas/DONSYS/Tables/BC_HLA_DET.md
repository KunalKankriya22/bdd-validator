---
tags:
  - table
  - DONSYS
---
# BC_HLA_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:10:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REC_KEY | NUMBER | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ALLELE | VARCHAR2(10) | Yes |  |  |
| 4 | RES_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | QUESTIND | VARCHAR2(2) | Yes |  |  |
| 6 | MASTER_RES | VARCHAR2(1) | Yes |  |  |
| 7 | TEST_METHOD | VARCHAR2(5) | Yes |  |  |
| 8 | RES_TYPE | VARCHAR2(10) | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_DATS | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
