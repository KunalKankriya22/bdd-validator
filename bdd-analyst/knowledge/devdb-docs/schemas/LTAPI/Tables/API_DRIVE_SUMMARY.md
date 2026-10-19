---
tags:
  - table
  - LTAPI
---
# API_DRIVE_SUMMARY

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LT_DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 2 | EXT_REF_ID | VARCHAR2(15) | Yes |  |  |
| 3 | DRIVE_DATE | DATE | Yes |  |  |
| 4 | DRIVE_START_TIME | DATE | Yes |  |  |
| 5 | DRIVE_END_TIME | DATE | Yes |  |  |
| 6 | TOT_DONORS | NUMBER | Yes |  |  |
| 7 | TOT_FIRST_TIME_DONORS | NUMBER | Yes |  |  |
| 8 | TOT_UNITS_DRAWN | NUMBER | Yes |  |  |
| 9 | TOT_WITHOUT_VENI | NUMBER | Yes |  |  |
| 10 | TOT_NUM_REGISTERED | NUMBER | Yes |  |  |
| 11 | TOT_DEF_AT_ONREGIS | NUMBER | Yes |  |  |
| 12 | TOT_DEF_AT_HH | NUMBER | Yes |  |  |
| 13 | TOT_WITH_DOUBLE_STICK | NUMBER | Yes |  |  |
| 14 | TOT_WALK_OUTS | NUMBER | Yes |  |  |
| 15 | TOT_DEF_IDS_AT_ONSITE | NUMBER | Yes |  |  |
| 16 | TOT_TURN_AWAY_COUNTS | NUMBER | Yes |  |  |
| 17 | TOT_VOID_COUNTS | NUMBER | Yes |  |  |
| 18 | TOT_ABORH_51 | NUMBER | Yes |  |  |
| 19 | TOT_ABORH_62 | NUMBER | Yes |  |  |
| 20 | TOT_ABORH_73 | NUMBER | Yes |  |  |
| 21 | TOT_ABORH_84 | NUMBER | Yes |  |  |
| 22 | TOT_ABORH_95 | NUMBER | Yes |  |  |
| 23 | TOT_ABORH_06 | NUMBER | Yes |  |  |
| 24 | TOT_ABORH_17 | NUMBER | Yes |  |  |
| 25 | TOT_ABORH_28 | NUMBER | Yes |  |  |
| 26 | TOT_ABORH_NO | NUMBER | Yes |  |  |
| 27 | TOT_APPT_CANCEL | NUMBER | Yes |  |  |
| 28 | TOT_APPT_WALKINS | NUMBER | Yes |  |  |
| 29 | TOT_APPT_NOSHOW | NUMBER | Yes |  |  |
| 30 | TOT_APPT_CNFRM | NUMBER | Yes |  |  |
| 31 | TOT_APPT_WTLST | NUMBER | Yes |  |  |
| 32 | TOT_DONORS_SCHEDULED | NUMBER | Yes |  |  |
| 33 | TOT_QNS_COUNTS | NUMBER | Yes |  |  |
| 34 | INSERT_DATE | DATE | Yes |  |  |
| 35 | PROCESS_STATUS | VARCHAR2(1) | Yes |  |  |
| 36 | TOT_CTMND_COUNTS | NUMBER | Yes |  |  |
| 37 | TOT_DEF_AT_PF | NUMBER | Yes |  |  |

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
