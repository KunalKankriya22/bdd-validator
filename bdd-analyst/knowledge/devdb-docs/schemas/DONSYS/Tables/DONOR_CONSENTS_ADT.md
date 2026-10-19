---
tags:
  - table
  - DONSYS
---
# DONOR_CONSENTS_ADT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 6555
**Last Analyzed**: 2025-09-25 03:00:26
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER(38) | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ACTION_CODE | VARCHAR2(1) | No |  |  |
| 6 | COLUMN_NAME | VARCHAR2(50) | No |  |  |
| 7 | OLD_VALUE | VARCHAR2(240) | Yes |  |  |
| 8 | NEW_VALUE | VARCHAR2(240) | Yes |  |  |
| 9 | OLD_BLOB | BLOB | Yes |  |  |
| 10 | NEW_BLOB | BLOB | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| NEW_BLOB | SYS_LOB0000078093C00010$$ | BC_DATA | YES | NO |
| OLD_BLOB | SYS_LOB0000078093C00009$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
