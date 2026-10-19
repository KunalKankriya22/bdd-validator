---
tags:
  - table
  - DONSYS
---
# CENTRAL_NOTES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 132298
**Last Analyzed**: 2026-04-10 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | NOTE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | NOTE_SEQUENCE | NUMBER(3) | No |  |  |
| 4 | NOTE | VARCHAR2(240) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**CENTRAL_NOTES_PK**: `NOTE_ID, CHAPTER_ID, NOTE_SEQUENCE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CENTRAL_NOTES_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| CENTRAL_NOTES_IDX2 | NORMAL | NONUNIQUE | INSERT_DATE | VALID |
| CENTRAL_NOTES_PK | NORMAL | UNIQUE | NOTE_ID, CHAPTER_ID, NOTE_SEQUENCE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CENTRAL_NOTES_BI|CENTRAL_NOTES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| GENBDR | PACKAGE | DONSYS |
