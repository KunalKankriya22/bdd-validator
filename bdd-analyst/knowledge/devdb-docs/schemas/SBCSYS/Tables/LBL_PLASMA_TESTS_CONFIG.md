---
tags:
  - table
  - SBCSYS
---
# LBL_PLASMA_TESTS_CONFIG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16
**Last Analyzed**: 2026-04-18 11:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | INSERT_DATE | DATE | No |  |  |
| 3 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**LBL_PLASMA_TESTS_CONFIG_PK**: `TEST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LBL_PLASMA_TESTS_CONFIG_PK | NORMAL | UNIQUE | TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/LBL_PLASMA_TESTS_CONFIG_BI|LBL_PLASMA_TESTS_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
