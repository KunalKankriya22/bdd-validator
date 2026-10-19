---
tags:
  - table
  - UTIL
---
# LT_DOCUMENT_LIBRARY

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 201
**Last Analyzed**: 2026-05-22 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | DOC_NAME | VARCHAR2(50) | Yes |  |  |
| 3 | DOC_TYPE | VARCHAR2(10) | Yes |  |  |
| 4 | DOC_FILE | BLOB | Yes |  |  |
| 5 | DOC_LINKED_TABLE | VARCHAR2(30) | Yes |  |  |
| 6 | DOC_LINKED_COLUMN | VARCHAR2(30) | Yes |  |  |
| 7 | DOC_LINKED_DESC | VARCHAR2(100) | Yes |  |  |
| 8 | DOC_ID | VARCHAR2(30) | Yes |  |  |
| 9 | SESSION_ID | VARCHAR2(25) | Yes |  |  |
| 10 | DOC_CREATION_DATE | DATE | Yes |  |  |
| 11 | EFF_DATE | DATE | Yes |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/LT_DOCUMENT_LIBRARY_BI|LT_DOCUMENT_LIBRARY_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DOC_FILE | SYS_LOB0000076614C00004$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
