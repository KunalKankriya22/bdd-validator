---
tags:
  - table
  - DONSYS
---
# VALID_PHYSICAL_RULES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16595
**Last Analyzed**: 2025-09-16 03:14:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | PHYSICAL_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 9 | GENDER | VARCHAR2(1) | Yes |  |  |
| 10 | FROM_AGE | NUMBER(3) | Yes |  |  |
| 11 | TO_AGE | NUMBER(3) | Yes |  |  |
| 12 | ITEM_VALUE | VARCHAR2(10) | Yes |  |  |
| 13 | ITEM_OPERATOR | VARCHAR2(10) | Yes |  |  |
| 14 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 15 | ITEM_VALUE_MAX | VARCHAR2(10) | Yes |  |  |
| 16 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 17 | EFF_DATE | DATE | Yes |  |  |
| 18 | TERM_DATE | DATE | Yes |  |  |

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
