---
tags:
  - table
  - SBCSYS
---
# VALID_TEST_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 31
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PARM_CODE | VARCHAR2(5) | Yes |  |  |
| 2 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 3 | DATATYPE | VARCHAR2(8) | Yes |  |  |
| 4 | RELATED_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | VOID_CODE | VARCHAR2(4) | Yes |  |  |
| 6 | RUN_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TEST_PARMS_IDX_1 | NORMAL | UNIQUE | PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
