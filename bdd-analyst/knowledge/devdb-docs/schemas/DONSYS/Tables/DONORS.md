---
tags:
  - table
  - DONSYS
---
# DONORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 90438
**Last Analyzed**: 2026-05-19 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | GENDER | VARCHAR2(1) | No |  |  |
| 4 | DATE_OF_BIRTH | DATE | No |  |  |
| 5 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 6 | SSN | NUMBER(9) | Yes |  |  |
| 7 | LAST_NAME_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 8 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 9 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 10 | SALUTATION | VARCHAR2(5) | Yes |  |  |
| 11 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | EMPLOYER_ID | VARCHAR2(10) | Yes |  |  |
| 13 | TITLE | VARCHAR2(10) | Yes |  |  |
| 14 | ETHNIC_GROUP | VARCHAR2(5) | Yes |  |  |
| 15 | STATUS | VARCHAR2(5) | Yes |  |  |
| 16 | SOUNDEX_KEY | VARCHAR2(10) | Yes |  |  |
| 17 | PREVIOS_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 18 | ALIAS | VARCHAR2(15) | Yes |  |  |
| 19 | CLAIMED_DONATION | NUMBER(5) | Yes |  |  |
| 20 | ALTERNATE_ID | VARCHAR2(20) | Yes |  |  |
| 21 | MIGRATED_UNIT | NUMBER(4) | Yes |  |  |
| 22 | MIGRATED_ADDR1 | VARCHAR2(32) | Yes |  |  |
| 23 | MIGRATED_ADDR2 | VARCHAR2(32) | Yes |  |  |
| 24 | MIGRATED_ADDR3 | VARCHAR2(32) | Yes |  |  |
| 25 | MIGRATED_ZIP | VARCHAR2(5) | Yes |  |  |
| 26 | MIGRATED_STATUS | VARCHAR2(1) | Yes |  |  |
| 27 | MIGRATED_CITY | VARCHAR2(40) | Yes |  |  |
| 28 | LANG | VARCHAR2(15) | Yes |  |  |
| 29 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 30 | CONV_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 31 | PREV_BLOOD_CENTER | VARCHAR2(30) | Yes |  |  |
| 32 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 33 | INSERT_DATE | DATE | No |  |  |
| 34 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 35 | AUDIT_KEY | NUMBER | No |  |  |
| 36 | MIGRATED_STATE | VARCHAR2(30) | Yes |  |  |
| 37 | FIRST_NAME_SNDX | VARCHAR2(4) | Yes |  |  |
| 38 | LIFE_DONATIONS | NUMBER | Yes |  |  |
| 39 | YTD_DONATIONS | NUMBER | Yes |  |  |
| 40 | LAST_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 41 | LAST_COLL_DATE | DATE | Yes |  |  |
| 42 | LAST_DON_TYPE | VARCHAR2(5) | Yes |  |  |
| 43 | LAST_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 44 | MIGRATED_DONOR_ID | VARCHAR2(15) | Yes |  |  |
| 45 | LIFE_CREDIT | NUMBER | Yes |  |  |
| 46 | YTD_CREDIT | NUMBER | Yes |  |  |
| 47 | HEIGHT | VARCHAR2(10) | Yes |  |  |
| 48 | ALTERNATE_ID_TYPE | VARCHAR2(5) | Yes |  |  |
| 49 | SCAN_ID | VARCHAR2(20) | Yes |  |  |
| 50 | DONOR_WEIGHT | NUMBER(6) | Yes |  |  |
| 51 | GENOTYPE | VARCHAR2(500) | Yes |  |  |

## Primary Key

**DONORS_PK**: `CHAPTER_ID, DONOR_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EMPLOYER_DONOR_FK | EMPLOYER_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DONOR_EMPLOYERS\|DONSYS.DONOR_EMPLOYERS]] (EMPLOYER_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/HLA_RBC_MATCH_TEMP\|DONSYS.HLA_RBC_MATCH_TEMP]] | DONOR_HLA_RBC_MATCH_TEMP_FK | CHAPTER_ID, DONOR_ID → CHAPTER_ID, DONOR_ID |
| [[schemas/DONSYS/Tables/HLA_RBC_MATCH_UNITS\|DONSYS.HLA_RBC_MATCH_UNITS]] | DONOR_HLA_RBC_MATCH_UNITS_FK | CHAPTER_ID, DONOR_ID → CHAPTER_ID, DONOR_ID |
| [[schemas/DONSYS/Tables/MOBILE_SCHEDULE\|DONSYS.MOBILE_SCHEDULE]] | MOBILE_SCHEDULE_DONOR_FK | CHAPTER_ID, DONOR_ID → CHAPTER_ID, DONOR_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONORS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONORS_NI | NORMAL | NONUNIQUE | NOTE_ID | VALID |
| DONORS_PK | NORMAL | UNIQUE | CHAPTER_ID, DONOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONORS_BD|DONORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONORS_BI|DONORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONORS_BU|DONORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/DONORS_SF_UPD_INTERFACE|DONORS_SF_UPD_INTERFACE]] — AFTER EACH ROW UPDATE (ENABLED)

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
| DONOR_UPDATE | PACKAGE | DONSYS |
| DON_INFO | FUNCTION | DONSYS |
| DON_LAPTOP_UPDT | PACKAGE | DONSYS |
| DON_REF_VAL | PACKAGE | DONSYS |
| DON_STD | PACKAGE | DONSYS |
| GENBDR | PACKAGE | DONSYS |
