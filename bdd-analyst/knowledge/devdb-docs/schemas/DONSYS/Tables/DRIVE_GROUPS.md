---
tags:
  - table
  - DONSYS
---
# DRIVE_GROUPS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 686
**Last Analyzed**: 2025-09-16 03:13:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_GROUP_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 4 | DRIVE_GROUP_TYPE | VARCHAR2(5) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**DRIVE_GROUPS_PK**: `DRIVE_GROUP_ID, CHAPTER_ID, DRIVE_ID, DRIVE_GROUP_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_GROUPS_PK | NORMAL | UNIQUE | DRIVE_GROUP_ID, CHAPTER_ID, DRIVE_ID, DRIVE_GROUP_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_GROUPS_BI|DRIVE_GROUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
