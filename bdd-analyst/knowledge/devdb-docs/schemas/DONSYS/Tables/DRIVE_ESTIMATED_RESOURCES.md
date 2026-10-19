---
tags:
  - table
  - DONSYS
---
# DRIVE_ESTIMATED_RESOURCES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 69305
**Last Analyzed**: 2025-09-16 03:13:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | RESOURCE_CODE | VARCHAR2(5) | No |  |  |
| 4 | NUMBER_REQD | NUMBER(3) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | SORT_SEQ | NUMBER(2) | Yes |  |  |

## Primary Key

**DRIVE_ESTIMATED_RESOURCES_PK**: `DRIVE_ID, CHAPTER_ID, RESOURCE_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_DRIVE_EST_RESOURCE_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_ESTIMATED_RESOURCES_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, RESOURCE_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_ESTIMATED_RESOURCES_BD|DRIVE_ESTIMATED_RESOURCES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_ESTIMATED_RESOURCES_BI|DRIVE_ESTIMATED_RESOURCES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_ESTIMATED_RESOURCES_BU|DRIVE_ESTIMATED_RESOURCES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
