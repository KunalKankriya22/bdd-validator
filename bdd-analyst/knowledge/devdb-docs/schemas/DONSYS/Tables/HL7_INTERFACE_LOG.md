---
tags:
  - table
  - DONSYS
---
# HL7_INTERFACE_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13
**Last Analyzed**: 2025-09-16 03:13:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 3 | ADT_GEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | ORM_GEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | GENERATE_DATE | DATE | Yes |  |  |
| 6 | LOCK_BY | VARCHAR2(30) | Yes |  |  |
| 7 | STOPPED_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |

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
