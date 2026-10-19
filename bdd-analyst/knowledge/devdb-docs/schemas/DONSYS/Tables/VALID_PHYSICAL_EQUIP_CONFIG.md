---
tags:
  - table
  - DONSYS
---
# VALID_PHYSICAL_EQUIP_CONFIG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 23
**Last Analyzed**: 2025-09-30 03:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PHYSICAL_CODE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | EQUIP_TYPE | VARCHAR2(5) | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_PHYSICAL_EQUIP_CONFIG**: `PHYSICAL_CODE, EQUIP_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PHYSICAL_EQUIP_CONFIG | NORMAL | UNIQUE | PHYSICAL_CODE, EQUIP_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_EQUIP_CONFIG_BD|VALID_PHYSICAL_EQUIP_CONFIG_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_EQUIP_CONFIG_BI|VALID_PHYSICAL_EQUIP_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_EQUIP_CONFIG_BU|VALID_PHYSICAL_EQUIP_CONFIG_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
