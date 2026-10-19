---
tags:
  - table
  - DONSYS
---
# FIND_DONOR_FIELDS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3022
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | PROGRAM_NAME | VARCHAR2(10) | Yes |  |  |
| 6 | FIELD_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | NO_OF_ENTRIES | NUMBER(3) | Yes |  |  |
| 8 | REQUIRED | VARCHAR2(1) | Yes |  |  |
| 9 | PROTECTED_ENTRY | VARCHAR2(1) | Yes |  |  |
| 10 | FUNCTION_CHECK | VARCHAR2(1) | Yes |  |  |
| 11 | EFF_DATE | DATE | Yes |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |

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
