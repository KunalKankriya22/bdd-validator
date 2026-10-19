---
tags:
  - table
  - DONSYS
---
# HL7_IERROR_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | MESSAGE_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | STATUS | VARCHAR2(1) | Yes |  |  |
| 4 | ERROR_TEXT | VARCHAR2(2000) | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |

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
