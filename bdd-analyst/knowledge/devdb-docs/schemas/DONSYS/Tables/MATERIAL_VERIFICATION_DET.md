---
tags:
  - table
  - DONSYS
---
# MATERIAL_VERIFICATION_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11880
**Last Analyzed**: 2025-11-14 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | VERIFICATION_TYPE | VARCHAR2(5) | No |  |  |
| 3 | CATALOG_NO | VARCHAR2(10) | Yes |  |  |
| 4 | TUBE_TYPE | VARCHAR2(10) | Yes |  |  |
| 5 | ADD_ON_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MATERIAL_VERIFICATION_DET_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MATERIAL_VERIFICATION_DET_BD|MATERIAL_VERIFICATION_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/MATERIAL_VERIFICATION_DET_BI|MATERIAL_VERIFICATION_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/MATERIAL_VERIFICATION_DET_BU|MATERIAL_VERIFICATION_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
