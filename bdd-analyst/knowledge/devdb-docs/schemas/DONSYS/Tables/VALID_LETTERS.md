---
tags:
  - table
  - DONSYS
---
# VALID_LETTERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 250
**Last Analyzed**: 2026-05-21 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LETTER_ID | VARCHAR2(10) | No |  |  |
| 2 | VERSION_NO | NUMBER(2) | Yes |  |  |
| 3 | LETTER_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | LETTER_TITLE | VARCHAR2(100) | Yes |  |  |
| 5 | VERSION_DATE | DATE | Yes |  |  |
| 6 | DOCUMENT_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | DATAFILE_NAME | VARCHAR2(50) | Yes |  |  |
| 8 | DOCUMENT_TYPE | VARCHAR2(1) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | LETTER_CONTENT | CLOB | Yes |  |  |

## Primary Key

**VALID_LETTERS_PK**: `LETTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_LETTERS_PK | NORMAL | UNIQUE | LETTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_LETTERS_BD|VALID_LETTERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LETTERS_BI|VALID_LETTERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LETTERS_BU|VALID_LETTERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| LETTER_CONTENT | SYS_LOB0000076593C00015$$ | BC_DATA | YES | NO |

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
| DON_COMMON_PACK | PACKAGE | DONSYS |
| GENBDR | PACKAGE | DONSYS |
