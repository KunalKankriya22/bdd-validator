---
tags:
  - table
  - DONSYS
---
# VALID_ATTRIBUTES_DON_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 239
**Last Analyzed**: 2026-04-23 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | ATTRIB_TABLE | VARCHAR2(30) | Yes |  |  |
| 7 | REQUIRED | VARCHAR2(1) | Yes |  |  |
| 8 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 9 | ATTRIB_DESC | VARCHAR2(50) | Yes |  |  |
| 10 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 11 | VALID_CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | DEFAULT_VALUE | VARCHAR2(10) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
