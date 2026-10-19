---
tags:
  - statistics
---
# Database Statistics

**Generated**: 2026-05-25 12:13:38
**Schemas Extracted**: 29

## Object Counts by Schema

| Schema | Tables | Views | Procedures | Functions | Packages | Triggers | Sequences | Types | Synonyms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [[schemas/AGMGR/AGMGR\|AGMGR]] | 21 | 0 | 0 | 0 | 6 | 1 | 0 | 0 | 0 |
| [[schemas/AMICUS/AMICUS\|AMICUS]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/BCADMN/BCADMN\|BCADMN]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/BCDSEQ/BCDSEQ\|BCDSEQ]] | 0 | 0 | 0 | 0 | 1 | 0 | 45 | 0 | 0 |
| [[schemas/BCNITOR/BCNITOR\|BCNITOR]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/CELHUN/CELHUN\|CELHUN]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/DBADMN/DBADMN\|DBADMN]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/DONSYS/DONSYS\|DONSYS]] | 371 | 2 | 0 | 2 | 43 | 0 | 9 | 0 | 0 |
| [[schemas/EILTOY/EILTOY\|EILTOY]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/GSMROOTUSER/GSMROOTUSER\|GSMROOTUSER]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/GTSHIP/GTSHIP\|GTSHIP]] | 9 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| [[schemas/LTAPI/LTAPI\|LTAPI]] | 96 | 0 | 0 | 0 | 16 | 0 | 1 | 0 | 0 |
| [[schemas/LTWEB/LTWEB\|LTWEB]] | 2 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 0 |
| [[schemas/NITOR1/NITOR1\|NITOR1]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_IAU/QAS_IAU\|QAS_IAU]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_IAU_APPEND/QAS_IAU_APPEND\|QAS_IAU_APPEND]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_IAU_VIEWER/QAS_IAU_VIEWER\|QAS_IAU_VIEWER]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_MDS/QAS_MDS\|QAS_MDS]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_OPSS/QAS_OPSS\|QAS_OPSS]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_STB/QAS_STB\|QAS_STB]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_UMS/QAS_UMS\|QAS_UMS]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_WLS/QAS_WLS\|QAS_WLS]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/QAS_WLS_RUNTIME/QAS_WLS_RUNTIME\|QAS_WLS_RUNTIME]] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | 370 | 6 | 0 | 2 | 47 | 0 | 16 | 0 | 0 |
| [[schemas/SFAPI/SFAPI\|SFAPI]] | 26 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| [[schemas/SRVSYS/SRVSYS\|SRVSYS]] | 110 | 33 | 0 | 1 | 7 | 0 | 1 | 0 | 0 |
| [[schemas/UTIL/UTIL\|UTIL]] | 85 | 1 | 1 | 0 | 16 | 0 | 3 | 0 | 0 |
| [[schemas/VISTA/VISTA\|VISTA]] | 6 | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 0 |
| [[schemas/WEBUTIL/WEBUTIL\|WEBUTIL]] | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| **TOTAL** | **1096** | **43** | **1** | **5** | **144** | **1** | **78** | **0** | **0** |

## Largest Tables (by estimated row count)

| # | Schema | Table | Estimated Rows |
| --- | --- | --- | --- |
| 1 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS_AUDIT\|DONOR_INTERDICTIONS_AUDIT]] | 88,781,910 |
| 2 | [[schemas/UTIL/UTIL\|UTIL]] | [[schemas/UTIL/Tables/INTERFACE_LOG_PARMS\|INTERFACE_LOG_PARMS]] | 30,722,418 |
| 3 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/UNITS_AUDIT\|UNITS_AUDIT]] | 24,041,459 |
| 4 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/INTER_TRANSACTIONS_AUDIT\|INTER_TRANSACTIONS_AUDIT]] | 12,364,662 |
| 5 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/INTER_TRANSACTIONS\|INTER_TRANSACTIONS]] | 7,148,982 |
| 6 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONATIONS_AUDIT\|DONATIONS_AUDIT]] | 4,514,117 |
| 7 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS\|DONOR_INTERDICTIONS]] | 3,491,532 |
| 8 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONORS_AUDIT\|DONORS_AUDIT]] | 3,182,869 |
| 9 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/RTURLOAD_INTERFACE\|RTURLOAD_INTERFACE]] | 3,127,331 |
| 10 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/UTRS_AUDIT\|UTRS_AUDIT]] | 1,110,848 |
| 11 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/UNIT_TEST_RESULTS\|UNIT_TEST_RESULTS]] | 728,494 |
| 12 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DRIVES_AUDIT\|DRIVES_AUDIT]] | 660,994 |
| 13 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/HEALTH_HISTORY_AUDIT\|HEALTH_HISTORY_AUDIT]] | 607,434 |
| 14 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONOR_LIST_LOG\|DONOR_LIST_LOG]] | 441,471 |
| 15 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/UTRS\|UTRS]] | 410,575 |
| 16 | [[schemas/UTIL/UTIL\|UTIL]] | [[schemas/UTIL/Tables/INTERFACE_LOG\|INTERFACE_LOG]] | 400,864 |
| 17 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/HOLDING_TESTS_AUDIT\|HOLDING_TESTS_AUDIT]] | 319,419 |
| 18 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONOR_ADDRESSES_AUDIT\|DONOR_ADDRESSES_AUDIT]] | 316,288 |
| 19 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/ONSITE_HEALTH_HISTORY\|ONSITE_HEALTH_HISTORY]] | 191,924 |
| 20 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DRIVE_EQUIP_QC_DET_ADT\|DRIVE_EQUIP_QC_DET_ADT]] | 179,439 |
| 21 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/UNIT_TEST_BASE_AUDIT\|UNIT_TEST_BASE_AUDIT]] | 174,085 |
| 22 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DONOR_COMMUNICATIONS\|DONOR_COMMUNICATIONS]] | 164,505 |
| 23 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/UNIT_INTERDICTIONS_AUDIT\|UNIT_INTERDICTIONS_AUDIT]] | 151,567 |
| 24 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/ONLINE_STATUS_AUDIT\|ONLINE_STATUS_AUDIT]] | 149,925 |
| 25 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/HEALTH_HISTORY\|HEALTH_HISTORY]] | 135,618 |
| 26 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/CENTRAL_NOTES\|CENTRAL_NOTES]] | 132,298 |
| 27 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/DRIVE_SPONSORS_AUDIT\|DRIVE_SPONSORS_AUDIT]] | 118,032 |
| 28 | [[schemas/DONSYS/DONSYS\|DONSYS]] | [[schemas/DONSYS/Tables/VALID_HH_ANSWERS_AUDIT\|VALID_HH_ANSWERS_AUDIT]] | 115,948 |
| 29 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/LT_INTERFACE_FILES\|LT_INTERFACE_FILES]] | 108,774 |
| 30 | [[schemas/SBCSYS/SBCSYS\|SBCSYS]] | [[schemas/SBCSYS/Tables/COMPONENTS_AUDIT\|COMPONENTS_AUDIT]] | 107,973 |
