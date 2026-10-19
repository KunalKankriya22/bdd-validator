---
tags:
  - table
  - SBCSYS
---
# EQUIP_MASTER_CODES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 158
**Last Analyzed**: 2025-09-17 03:00:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | CODE_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | RESTRICT_EDIT | VARCHAR2(6) | Yes |  |  |

## Primary Key

**EQUIP_MASTER_CODES_PK**: `CODE_TYPE, CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_MASTER_CODES_PK | NORMAL | UNIQUE | CODE_TYPE, CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/EQUIP_MASTER_CODES_BD|EQUIP_MASTER_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/EQUIP_MASTER_CODES_INS_UPD|EQUIP_MASTER_CODES_INS_UPD]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
