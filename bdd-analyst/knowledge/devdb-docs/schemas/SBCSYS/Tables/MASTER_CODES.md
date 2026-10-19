---
tags:
  - table
  - SBCSYS
---
# MASTER_CODES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1822
**Last Analyzed**: 2026-04-18 03:00:09
**Partitioned**: NO

> [!quote] Created from Entity MASTER CODE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | CODE_DESC | VARCHAR2(500) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | SORT_SEQUENCE_1 | NUMBER(3) | Yes |  |  |
| 10 | SORT_SEQUENCE_2 | NUMBER(3) | Yes |  |  |
| 11 | SORT_SEQUENCE_3 | NUMBER(3) | Yes |  |  |
| 12 | CHANGE_CONTROL_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | NUMERAL_VALUE | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MASTER_CODES_IDX_1 | NORMAL | UNIQUE | CODE_TYPE, CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/MASTER_CODES_BEFORE_DELETE|MASTER_CODES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/MASTER_CODES_INSERT_UPDATE|MASTER_CODES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
