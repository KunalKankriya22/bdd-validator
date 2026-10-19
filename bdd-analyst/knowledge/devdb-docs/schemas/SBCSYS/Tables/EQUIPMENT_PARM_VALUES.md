---
tags:
  - table
  - SBCSYS
---
# EQUIPMENT_PARM_VALUES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 173
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | ARRANGE_BY | NUMBER(4) | Yes |  |  |
| 4 | REF_NUMBER | NUMBER(4) | No |  |  |
| 5 | PARM_DESC | VARCHAR2(50) | No |  |  |
| 6 | PARM_VALUE | VARCHAR2(50) | Yes |  |  |
| 7 | REQUIRED_FLAG | VARCHAR2(1) | No |  |  |
| 8 | VALID_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | TYPE_OF_DATA | VARCHAR2(8) | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EQUIP_EQUIP_PARM_VAL_FK | EQUIP_REFERENCE | [[schemas/SBCSYS/Tables/EQUIPMENT\|SBCSYS.EQUIPMENT]] (EQUIP_REFERENCE) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_PARM_VALUE_PK | NORMAL | UNIQUE | EQUIP_REFERENCE, REF_NUMBER, PARM_VALUE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
