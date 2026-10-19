---
tags:
  - table
  - SBCSYS
---
# SAMPLE_CHECKIN_CONDITIONS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 65
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | SAMPLE_TYPE | VARCHAR2(15) | Yes |  |  |
| 3 | BOX_ID | VARCHAR2(30) | Yes |  |  |
| 4 | STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | OVR_DATE | DATE | Yes |  |  |
| 11 | OVR_USER_ID | VARCHAR2(10) | Yes |  |  |
| 12 | OVR_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 13 | OVR_NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_CHECKIN_CONDITIONS_BD|SAMPLE_CHECKIN_CONDITIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_CHECKIN_CONDITIONS_BI|SAMPLE_CHECKIN_CONDITIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_CHECKIN_CONDITIONS_BU|SAMPLE_CHECKIN_CONDITIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
