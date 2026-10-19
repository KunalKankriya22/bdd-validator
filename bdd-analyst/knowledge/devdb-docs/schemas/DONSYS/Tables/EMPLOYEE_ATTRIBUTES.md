---
tags:
  - table
  - DONSYS
---
# EMPLOYEE_ATTRIBUTES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 379
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(5) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | ATTRIB_VALUE1 | VARCHAR2(20) | Yes |  |  |
| 10 | ATTRIB_VALUE2 | VARCHAR2(20) | Yes |  |  |

## Primary Key

**EMPLOYEE_ATTRIBUTES_PK**: `STAFF_NO, CHAPTER_ID, ATTRIB_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EMPLOYEE_ATTRIBUTES_PK | NORMAL | UNIQUE | STAFF_NO, CHAPTER_ID, ATTRIB_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/EMPLOYEE_ATTRIBUTES_BI|EMPLOYEE_ATTRIBUTES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
