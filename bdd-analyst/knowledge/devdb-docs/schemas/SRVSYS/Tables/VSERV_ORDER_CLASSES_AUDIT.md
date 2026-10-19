---
tags:
  - table
  - SRVSYS
---
# VSERV_ORDER_CLASSES_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 214
**Last Analyzed**: 2026-04-18 19:02:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_CLASS | VARCHAR2(2) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ORDER_PRIORITY | NUMBER(2) | Yes |  |  |
| 4 | CLASS_DESC | VARCHAR2(20) | Yes |  |  |
| 5 | PROCESS_HOURS | NUMBER(5) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | DISPLAY_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ORDER_CLASSES_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
