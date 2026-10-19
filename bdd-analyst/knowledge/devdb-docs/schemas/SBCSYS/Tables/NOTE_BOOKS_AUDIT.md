---
tags:
  - table
  - SBCSYS
---
# NOTE_BOOKS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 240
**Last Analyzed**: 2025-09-16 03:14:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 2 | NOTE | VARCHAR2(1500) | Yes |  |  |
| 3 | AUDIT_KEY | NUMBER | Yes |  |  |
| 4 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 5 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 6 | NOTE_SEQ | NUMBER(3) | Yes |  |  |
| 7 | NOTES_TABLE | VARCHAR2(50) | Yes |  |  |
| 8 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | NOTES_TYPE | VARCHAR2(1) | Yes |  |  |

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
