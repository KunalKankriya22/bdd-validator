---
tags:
  - table
  - DONSYS
---
# TEMP_DRIVE_SPONSORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 584
**Last Analyzed**: 2026-04-03 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEMPDR_ID | VARCHAR2(10) | No |  |  |
| 2 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PROJECTED_SHOW | NUMBER(6) | Yes |  |  |
| 5 | PROJECTED_DRAW | NUMBER(6) | Yes |  |  |
| 6 | CONTACT_ID | VARCHAR2(10) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**TEMP_DRIVE_SPONSORS_PK**: `TEMPDR_ID, SPONSOR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEMP_DRIVE_SPONSORS_PK | NORMAL | UNIQUE | TEMPDR_ID, SPONSOR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/TEMP_DRIVE_SPONSORS_BI|TEMP_DRIVE_SPONSORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
