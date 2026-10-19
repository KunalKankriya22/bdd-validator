---
tags:
  - table
  - SBCSYS
---
# TEST_KIT_CLASS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 12
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | TEST_KIT_CLASS | VARCHAR2(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**TEST_KIT_CLASS_PK**: `TEST_CHAPTER_ID, TEST_ID, TEST_KIT_CLASS`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_KIT_CLASS_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_KIT_CLASS_IDX_1 | NORMAL | UNIQUE | TEST_CHAPTER_ID, TEST_ID, TEST_KIT_CLASS | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_KIT_CLASS_DEL|TEST_KIT_CLASS_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_KIT_CLASS_INS_UPD|TEST_KIT_CLASS_INS_UPD]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
