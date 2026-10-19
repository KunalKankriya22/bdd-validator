---
tags:
  - table
  - DONSYS
---
# VALID_MASTER_CODES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2814
**Last Analyzed**: 2026-05-13 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | DESCRIPTION | VARCHAR2(240) | Yes |  |  |
| 4 | NUMERAL_VALUE | NUMBER | Yes |  |  |
| 5 | SORT_SEQUENCE_1 | NUMBER | Yes |  |  |
| 6 | SORT_SEQUENCE_2 | NUMBER | Yes |  |  |
| 7 | SORT_SEQUENCE_3 | NUMBER | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | CHANGE_CONTROL_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_MASTER_CODES_PK**: `CODE_TYPE, CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_MASTER_CODES_PK | NORMAL | UNIQUE | CODE_TYPE, CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_MASTER_CODES_BD|VALID_MASTER_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_MASTER_CODES_BI|VALID_MASTER_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_MASTER_CODES_BU|VALID_MASTER_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| DON_INFO | FUNCTION | DONSYS |
