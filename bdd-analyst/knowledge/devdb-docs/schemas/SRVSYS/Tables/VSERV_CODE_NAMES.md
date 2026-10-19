---
tags:
  - table
  - SRVSYS
---
# VSERV_CODE_NAMES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 123
**Last Analyzed**: 2026-04-21 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | APPL_CUSTODY | VARCHAR2(2) | No |  |  |
| 3 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 4 | CODE_TYPE_DESC | VARCHAR2(50) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CODE_NAMES_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, APPL_CUSTODY, CODE_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_CODE_NAMES_BEFORE_DEL|VSERV_CODE_NAMES_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CODE_NAMES_BEFORE_INSERT|VSERV_CODE_NAMES_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CODE_NAMES_BEFORE_UP|VSERV_CODE_NAMES_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
