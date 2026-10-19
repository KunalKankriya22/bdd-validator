---
tags:
  - table
  - DONSYS
---
# DRIVE_CHECKLISTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22220
**Last Analyzed**: 2026-03-07 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 4 | ACTION_CODE | VARCHAR2(5) | No |  |  |
| 5 | TARGET_DATE | DATE | Yes |  |  |
| 6 | TARGET_USER | VARCHAR2(6) | Yes |  |  |
| 7 | ACTION_DATE | DATE | Yes |  |  |
| 8 | ACTION_USER | VARCHAR2(6) | Yes |  |  |
| 9 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DRIVE_CHECKLISTS_PK**: `DRIVE_ID, CHAPTER_ID, SPONSOR_ID, ACTION_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_CHECKLISTS_IDX1 | NORMAL | NONUNIQUE | DRIVE_ID, CHAPTER_ID | VALID |
| DRIVE_CHECKLISTS_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, SPONSOR_ID, ACTION_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_CHECKLISTS_BI|DRIVE_CHECKLISTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
