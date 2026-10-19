---
tags:
  - table
  - SBCSYS
---
# FR_VRARITY_MATRIX_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 182
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MATRIX_ID | NUMBER | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | TEST_RESULT | VARCHAR2(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**FR_VRAR_MTRX_DET_PK**: `MATRIX_ID, TEST_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_FR_VRARITY_MTX_DET_FK | MATRIX_ID | [[schemas/SBCSYS/Tables/FR_VRARITY_MATRIX_HDR\|SBCSYS.FR_VRARITY_MATRIX_HDR]] (MATRIX_ID) | NO ACTION |
| TESTS_FR_VRARITY_MTX_DET_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_VRARITY_MATRIX_DET_IDX_1 | NORMAL | UNIQUE | MATRIX_ID, TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_RARITY_MATDET_BEFORE_DELETE|FR_RARITY_MATDET_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_RARITY_MATDET_INSERT_UPDATE|FR_RARITY_MATDET_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
