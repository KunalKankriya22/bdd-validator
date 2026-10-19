---
tags:
  - table
  - DONSYS
---
# VPHR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2027
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PHYSICAL_CODE | VARCHAR2(5) | No |  |  |
| 2 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 3 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | GENDER | VARCHAR2(1) | Yes |  |  |
| 6 | FROM_AGE | NUMBER(3) | Yes |  |  |
| 7 | TO_AGE | NUMBER(3) | Yes |  |  |
| 8 | ITEM_VALUE | VARCHAR2(10) | Yes |  |  |
| 9 | ITEM_OPERATOR | VARCHAR2(10) | Yes |  |  |
| 10 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | ITEM_VALUE_MAX | VARCHAR2(10) | Yes |  |  |
| 12 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 13 | EFF_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | INSERT_DATE | DATE | No |  |  |
| 17 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |

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
