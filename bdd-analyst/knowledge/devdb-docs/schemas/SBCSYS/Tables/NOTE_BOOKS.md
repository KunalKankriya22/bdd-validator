---
tags:
  - table
  - SBCSYS
---
# NOTE_BOOKS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1866
**Last Analyzed**: 2025-09-16 03:14:32
**Partitioned**: NO

> [!quote] Created from Entity NOTE BOOK by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | NOTE_ID | NUMBER(10) | No |  |  |
| 2 | NOTE | VARCHAR2(1500) | No |  |  |
| 3 | AUDIT_KEY | NUMBER | Yes |  |  |
| 4 | NOTE_SEQ | NUMBER(3) | Yes |  |  |
| 5 | NOTES_TABLE | VARCHAR2(50) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | NOTES_TYPE | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| NOTE_BOOKS_IDX_1 | NORMAL | UNIQUE | NOTE_ID, NOTE_SEQ | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/NOTE_BOOKS_BEFORE_DELETE|NOTE_BOOKS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/NOTE_BOOKS_BEFORE_UPDATE|NOTE_BOOKS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/NOTE_BOOKS_BI|NOTE_BOOKS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
