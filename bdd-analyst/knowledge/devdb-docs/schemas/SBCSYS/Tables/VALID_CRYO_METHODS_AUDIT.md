---
tags:
  - table
  - SBCSYS
---
# VALID_CRYO_METHODS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 80
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | THAW_METHOD | VARCHAR2(4) | Yes |  |  |
| 3 | METHOD_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 5 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 6 | MIN_WS_FREEZE_TIME | NUMBER(5,2) | Yes |  |  |
| 7 | MAX_WS_FREEZE_TIME | NUMBER(5,2) | Yes |  |  |
| 8 | MIN_SEP_FREEZE_TIME | NUMBER(5,2) | Yes |  |  |
| 9 | MAX_SEP_FREEZE_TIME | NUMBER(5,2) | Yes |  |  |
| 10 | EFF_DATE | DATE | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 16 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_CRYO_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
