---
tags:
  - package
  - AGMGR
---
# AG_TIETAG_LBL

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE AG_TIETAG_LBL AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Core pkg that deals with tietag labels
||              : 
|| Requirements : 
|| Call Syntax  :
|| Version
|| 01   04/22/2024  MLT-6779 - New pkg creation.
|| 02   04/30/2024  MLT-6781 - Convert ABO code, SORT_TEST_STRING routine added.
|| 03   06/16/2024  MLT-6921 - GEN_TIETAG_File modified to use bc_ttstartstop table.
||                  MLT-6961 - TieTag label layout changes. Order Antigens. 
||                           - Use AGMGR master code.
|| 04   07/01/2024  MLT-7011 - User ATEST code. Modified Unlicensed/Unapproved Testing 
||                           - query to print only unconfirmed antigens.
|| 05   07/08/2024  Phenotype query updated. Added user ID to tietag file name.
|| 06   08/06/2024  MLT-7063 - changes to 'Confirm Unlicensed/Unapproved Testing'
||                                - 1) Unconfirmed only  to Confirmed or unconfirmed.
||                                - 2) Current donation to current OR historicl.
||                             - changes to 'Current Donation'
||                                - 1) Licensed to Licensed or Unlicensed
||------2024.1.0 Release version 06----------------------------------------------------------------------------
||  
*/-----------------------------------------------------------------------------------

    TYPE print_list_vt IS TABLE OF VARCHAR2(100);


    PROCEDURE gen_tietag_file(pUnitId           IN VARCHAR2,
                              pAboCode          IN VARCHAR2,
                              pExpDate          IN DATE,
                              pPrintAgCodes     IN VARCHAR2,
                              pPrinterId        IN VARCHAR2,
                              pNoLabels         IN NUMBER,
                              pUserId           IN VARCHAR2,
                              pChapterId        IN VARCHAR2,
                              pStatus           OUT VARCHAR2); 

    PROCEDURE sort_test_string(pTestString_in          IN VARCHAR2, 
                                pSortedTestString_out   OUT VARCHAR2,
                                pStatus_out             OUT VARCHAR2);

    FUNCTION version_no RETURN VARCHAR2;

END AG_TIETAG_LBL;


```
