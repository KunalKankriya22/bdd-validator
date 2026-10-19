---
tags:
  - table
  - SRVSYS
---
# RETURN_ADVICES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 534
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RETURN_ADVICE_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 4 | RETURN_DATE | DATE | No |  |  |
| 5 | RETURN_USER_ID | VARCHAR2(10) | No |  |  |
| 6 | RETURNED_BY | VARCHAR2(50) | Yes |  |  |
| 7 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 8 | ADVICE_STATUS | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RETURN_ADVICES_IDX_1 | NORMAL | UNIQUE | RETURN_ADVICE_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
