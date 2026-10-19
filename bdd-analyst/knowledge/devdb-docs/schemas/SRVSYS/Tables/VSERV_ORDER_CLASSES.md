---
tags:
  - table
  - SRVSYS
---
# VSERV_ORDER_CLASSES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 91
**Last Analyzed**: 2026-05-06 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_CLASS | VARCHAR2(2) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ORDER_PRIORITY | NUMBER(2) | No |  |  |
| 4 | CLASS_DESC | VARCHAR2(20) | Yes |  |  |
| 5 | PROCESS_HOURS | NUMBER(5) | Yes |  |  |
| 6 | DISPLAY_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ORDER_CLASSES_IDX_1 | NORMAL | UNIQUE | ORDER_CLASS, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_ORDER_CLASSES_BD|VSERV_ORDER_CLASSES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ORDER_CLASSES_BI|VSERV_ORDER_CLASSES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ORDER_CLASSES_BU|VSERV_ORDER_CLASSES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
