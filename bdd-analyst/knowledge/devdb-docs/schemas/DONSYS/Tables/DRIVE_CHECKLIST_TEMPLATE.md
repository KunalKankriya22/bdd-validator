---
tags:
  - table
  - DONSYS
---
# DRIVE_CHECKLIST_TEMPLATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 100
**Last Analyzed**: 2026-05-06 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ACTION_CODE | VARCHAR2(5) | No |  |  |
| 4 | TIME_FLAG | VARCHAR2(2) | No |  |  |
| 5 | TARGET_DAYS | NUMBER(4) | No |  |  |
| 6 | SORT_SEQ | NUMBER(3) | No |  |  |
| 7 | ACTION_FLAG | VARCHAR2(1) | No |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**DRIVE_CKLIST_TEMPLATE_PK**: `SPONSOR_ID, CHAPTER_ID, ACTION_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_CHECKLIST_TEMPLATE_IDX1 | NORMAL | NONUNIQUE | SPONSOR_ID, CHAPTER_ID | VALID |
| DRIVE_CKLIST_TEMPLATE_PK | NORMAL | UNIQUE | SPONSOR_ID, CHAPTER_ID, ACTION_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_CHECKLIST_TEMPLATE_BD|DRIVE_CHECKLIST_TEMPLATE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_CHECKLIST_TEMPLATE_BI|DRIVE_CHECKLIST_TEMPLATE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_CHECKLIST_TEMPLATE_BU|DRIVE_CHECKLIST_TEMPLATE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
