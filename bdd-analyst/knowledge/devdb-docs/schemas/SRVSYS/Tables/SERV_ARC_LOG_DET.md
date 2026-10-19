---
tags:
  - table
  - SRVSYS
---
# SERV_ARC_LOG_DET

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(11) | No |  |  |
| 2 | ARC_COLUMN | VARCHAR2(20) | Yes |  |  |
| 3 | COLUMN_VALUE | VARCHAR2(25) | Yes |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 5 | ARC_FLAG | VARCHAR2(1) | Yes |  |  |

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
