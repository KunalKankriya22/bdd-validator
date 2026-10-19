---
tags:
  - table
  - DONSYS
---
# RESOURCE_EXCEPTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1340
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESOURCE_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_DATE | DATE | No |  |  |
| 4 | AVAILABLE_NUMBER | NUMBER(4) | No |  |  |
| 5 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**RESOURCE_EXCEPTIONS_PK**: `RESOURCE_CODE, CHAPTER_ID, DRIVE_DATE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESOURCE_EXCEPTIONS_PK | NORMAL | UNIQUE | RESOURCE_CODE, CHAPTER_ID, DRIVE_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/RESOURCE_EXCEPTIONS_BD|RESOURCE_EXCEPTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/RESOURCE_EXCEPTIONS_BI|RESOURCE_EXCEPTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/RESOURCE_EXCEPTIONS_BU|RESOURCE_EXCEPTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
