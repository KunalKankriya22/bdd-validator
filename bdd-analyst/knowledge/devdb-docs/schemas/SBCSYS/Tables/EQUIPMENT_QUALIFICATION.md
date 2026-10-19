---
tags:
  - table
  - SBCSYS
---
# EQUIPMENT_QUALIFICATION

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 160
**Last Analyzed**: 2025-09-26 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | QUALIFICATION_DATE | DATE | No |  |  |
| 3 | QUALIFIED_BY | VARCHAR2(6) | No |  |  |
| 4 | FIRST_PRODUCTION_DATE | DATE | Yes |  |  |
| 5 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**EQUIP_QUALIFICATION_PK**: `EQUIP_REFERENCE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EQUIP_EQUIP_QUALIF_FK | EQUIP_REFERENCE | [[schemas/SBCSYS/Tables/EQUIPMENT\|SBCSYS.EQUIPMENT]] (EQUIP_REFERENCE) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QUALIFICATION_PK | NORMAL | UNIQUE | EQUIP_REFERENCE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
