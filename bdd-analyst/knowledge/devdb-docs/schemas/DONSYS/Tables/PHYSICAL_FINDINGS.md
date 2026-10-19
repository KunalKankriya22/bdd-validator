---
tags:
  - table
  - DONSYS
---
# PHYSICAL_FINDINGS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 87185
**Last Analyzed**: 2025-11-14 04:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PHYSICAL_CODE | VARCHAR2(5) | No |  |  |
| 4 | PHYSICAL_VALUE | VARCHAR2(10) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | PHYSICAL_VALUE_REPEAT | VARCHAR2(10) | Yes |  |  |
| 13 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 14 | EQUIP_REFERENCE_REPEAT | VARCHAR2(9) | Yes |  |  |

## Primary Key

**PHYSICAL_FINDINGS_PK**: `TRANSACTION_ID, CHAPTER_ID, PHYSICAL_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DONAT_PHYSICAL_FINDINGS_FK | TRANSACTION_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DONATIONS\|DONSYS.DONATIONS]] (TRANSACTION_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PHYSICAL_FINDINGS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| PHYSICAL_FINDINGS_PK | NORMAL | UNIQUE | TRANSACTION_ID, CHAPTER_ID, PHYSICAL_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_BD|PHYSICAL_FINDINGS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_BI|PHYSICAL_FINDINGS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_BU|PHYSICAL_FINDINGS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
