---
tags:
  - table
  - DONSYS
---
# VALID_LETTERS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 986
**Last Analyzed**: 2026-05-20 03:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | LETTER_ID | VARCHAR2(10) | Yes |  |  |
| 6 | VERSION_NO | NUMBER(2) | Yes |  |  |
| 7 | LETTER_CODE | VARCHAR2(10) | Yes |  |  |
| 8 | LETTER_TITLE | VARCHAR2(100) | Yes |  |  |
| 9 | VERSION_DATE | DATE | Yes |  |  |
| 10 | DOCUMENT_NAME | VARCHAR2(50) | Yes |  |  |
| 11 | DATAFILE_NAME | VARCHAR2(50) | Yes |  |  |
| 12 | DOCUMENT_TYPE | VARCHAR2(1) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |

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
