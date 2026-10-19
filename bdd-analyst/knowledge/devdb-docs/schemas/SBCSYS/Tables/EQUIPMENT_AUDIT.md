---
tags:
  - table
  - SBCSYS
---
# EQUIPMENT_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1477
**Last Analyzed**: 2025-09-16 03:14:27
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | EQUIP_ID | VARCHAR2(4) | Yes |  |  |
| 5 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 6 | SERIAL_NUMBER | VARCHAR2(12) | Yes |  |  |
| 7 | LOCATION | VARCHAR2(5) | Yes |  |  |
| 8 | STATUS | VARCHAR2(4) | Yes |  |  |
| 9 | IN_SERVICE_DATE | DATE | Yes |  |  |
| 10 | OUT_SERVICE_DATE | DATE | Yes |  |  |
| 11 | MANUFACTURER | VARCHAR2(50) | Yes |  |  |
| 12 | SERVICE_CONTACT | VARCHAR2(50) | Yes |  |  |
| 13 | SERVICE_PHONE | VARCHAR2(20) | Yes |  |  |
| 14 | SERVICE_START_DATE | DATE | Yes |  |  |
| 15 | SERVICE_END_DATE | DATE | Yes |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 18 | MODIFIED_BY | VARCHAR2(20) | Yes |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 22 | AUDIT_INSERT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
