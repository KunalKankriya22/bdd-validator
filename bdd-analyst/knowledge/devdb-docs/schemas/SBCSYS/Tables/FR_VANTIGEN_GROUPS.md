---
tags:
  - table
  - SBCSYS
---
# FR_VANTIGEN_GROUPS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 91
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_GROUP | VARCHAR2(5) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | TEST_RESULT | VARCHAR2(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**FR_ANTIGEN_GROUPS_PK**: `ANTIGEN_GROUP, TEST_ID, TEST_RESULT`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TESTS_FR_VANTIGEN_GROUPS_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_VANTIGEN_GROUPS_IDX_1 | NORMAL | UNIQUE | ANTIGEN_GROUP, TEST_ID, TEST_RESULT | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_ANTG_GROUPS_BEFORE_DELETE|FR_ANTG_GROUPS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_ANTG_GROUPS_INSERT_UPDATE|FR_ANTG_GROUPS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
