---
tags:
  - table
  - SBCSYS
---
# RGT_TUBES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 12078
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | CBC_UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | TUBE_CHECK_IN_DATE | DATE | Yes |  |  |
| 6 | RED1_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | RED2_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | PURPLE1_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | PURPLE2_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 11 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 12 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | SHIPMENT_NO | VARCHAR2(50) | Yes |  |  |
| 15 | SHIPMENT_ARRIVAL_DATE | DATE | Yes |  |  |
| 16 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_TUBES_BD|RGT_TUBES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_TUBES_BI|RGT_TUBES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_TUBES_BU|RGT_TUBES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
