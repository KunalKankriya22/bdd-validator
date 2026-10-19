---
tags:
  - table
  - SBCSYS
---
# FR_VRARITY_MATRIX_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 38
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MATRIX_ID | NUMBER | No |  |  |
| 2 | RARITY_PERCENT | NUMBER(5,3) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**FR_VRAR_MTRX_HDR_PK**: `MATRIX_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/FR_VRARITY_MATRIX_DET\|SBCSYS.FR_VRARITY_MATRIX_DET]] | HDR_FR_VRARITY_MTX_DET_FK | MATRIX_ID → MATRIX_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_VRARITY_MATRIX_HDR_IDX_1 | NORMAL | UNIQUE | MATRIX_ID, RARITY_PERCENT | VALID |
| FR_VRAR_MTRX_HDR_PK | NORMAL | UNIQUE | MATRIX_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_RARITY_MATHDR_BEFORE_DELETE|FR_RARITY_MATHDR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_RARITY_MATHDR_INSERT_UPDATE|FR_RARITY_MATHDR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
