---
tags:
  - table
  - DONSYS
---
# HL7_HOLDING_TESTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 80
**Last Analyzed**: 2025-09-16 03:13:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 3 | TEST_ID | VARCHAR2(100) | Yes |  |  |
| 4 | RESULT_VALUE | VARCHAR2(10) | Yes |  |  |
| 5 | MESSAGE_ID | VARCHAR2(50) | Yes |  |  |
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
