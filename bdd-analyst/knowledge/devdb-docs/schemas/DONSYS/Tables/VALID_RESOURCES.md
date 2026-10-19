---
tags:
  - table
  - DONSYS
---
# VALID_RESOURCES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 30
**Last Analyzed**: 2026-05-06 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESOURCE_CODE | VARCHAR2(5) | No |  |  |
| 2 | RESOURCE_TYPE | VARCHAR2(5) | No |  |  |
| 3 | RESOURCE_DESC | VARCHAR2(50) | No |  |  |
| 4 | CRITICAL_IND | VARCHAR2(1) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | SORT_SEQ | NUMBER(2) | Yes |  |  |
| 12 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| VALID_RESOURCES_UNIQUE | RESOURCE_CODE, CHAPTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_RESOURCES_UNIQUE | NORMAL | UNIQUE | RESOURCE_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_RESOURCES_BD|VALID_RESOURCES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RESOURCES_BI|VALID_RESOURCES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RESOURCES_BU|VALID_RESOURCES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
