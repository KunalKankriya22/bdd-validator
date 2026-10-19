---
tags:
  - table
  - SBCSYS
---
# TEST_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 172
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | PARM_TYPE | VARCHAR2(5) | No |  |  |
| 3 | SEQUENCE | NUMBER | Yes |  |  |
| 4 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 5 | ACCEPT_MIN | NUMBER | Yes |  |  |
| 6 | ACCEPT_MAX | NUMBER | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | TECH1_REQD | VARCHAR2(1) | Yes |  |  |
| 13 | TECH2_REQD | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_PARMS_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| TEST_PARM_UK | TEST_ID, PARM_TYPE, PARM_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_PARMS_IDX_1 | NORMAL | UNIQUE | TEST_ID, PARM_TYPE, PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
