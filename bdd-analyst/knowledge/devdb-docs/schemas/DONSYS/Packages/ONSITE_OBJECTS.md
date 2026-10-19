---
tags:
  - package
  - DONSYS
---
# ONSITE_OBJECTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "ONSITE_OBJECTS" AS

/***********************************************************
 Package     : DON_ONSITE
 Developed By: Basker Edwin
 Purpose     : All the online related packages would be
	       incorporated
 Created Date: 07.15.02
 Modify  Date: 10/02/2013
 Version     : 04 -- SCR 11920; New parameter added;
 		  -- pABBR_ELIG_STATUS added to pass to donor card.
 		  -- ABBR_ELIG_STATUS column added to new_donor_temp table;
 		  -- Dt: 10/02/2013
************************************************************ */

  PROCEDURE POPULATE_NEW_DONOR_TEMP(
			 pLAST_NAME        in VARCHAR2,
			 pSSN              in VARCHAR2,
			 pDONOR_ID         in VARCHAR2,
			 pDATE_OF_BIRTH    in DATE,
			 pFIRST_NAME       in VARCHAR2,
			 pMIDDLE_NAME      in VARCHAR2,
			 pGENDER           in VARCHAR2,
			 pSTREET_NAME      in VARCHAR2,
			 pSUITE_APT        in VARCHAR2,
			 pCITY             in VARCHAR2,
			 pSTATE            in VARCHAR2,
			 pZIP              in VARCHAR2,
			 pADDRESS_FLAG     in VARCHAR2,
		 	 pB_AREA_CODE      in VARCHAR2,
			 pB_PHONE_NO       in VARCHAR2,
			 pH_AREA_CODE      in VARCHAR2,
			 pH_PHONE_NO       in VARCHAR2,
			 pEXTENSION        in VARCHAR2,
			 pEMAIL            in VARCHAR2,
			 pEMP_SCHOOL       in VARCHAR2,
			 pNEW_DONOR_FLAG   in VARCHAR2,
			 pETHNIC_GROUP     in VARCHAR2,
			 pINSERT_DATE      in DATE,
			 pINSERT_USER      in VARCHAR2,
			 pPROGRAM_ID       in VARCHAR2,
			 pSESSION_ID       in VARCHAR2,
			 pPRINT_STATUS     in VARCHAR2,
			 pDEFERRAL_STATUS  in VARCHAR2,
			 pPRINT_DATE       in DATE,
			 pDRIVE_ID         in VARCHAR2,
			 pUNIT_ID          in VARCHAR2,
			 pBLOOD_TYPE_DES   in VARCHAR2,
			 pHEIGHT           in VARCHAR2,
			 pWEIGHT           in NUMBER,
			 pALTERNATE_ID     in VARCHAR2,
			 pALTERNATE_ID_TYPE in VARCHAR2,
			 pSCAN_ID          in  VARCHAR2,
                         pCREDIT_SPONSOR   in VARCHAR2,
                         pLAST_SUFFIX      in VARCHAR2,
                         pALIAS            in VARCHAR2,
			 pID_VERIFIED      in VARCHAR2,
                         pintl_addr1	   in VARCHAR2,
                         pintl_addr2       in VARCHAR2,
                         pintl_addr3       in VARCHAR2,
                         pintl_addr4	   in VARCHAR2,
                         pintl_zip         in VARCHAR2,
			 pcountry          in VARCHAR2,
                         pintl_home_ph     in VARCHAR2,
                         pintl_work_ph     in VARCHAR2,
                         pintl_work_ph_ext in VARCHAR2,
                         pintl_mobile_ph   in VARCHAR2,
                         pintl_fax_no      in VARCHAR2,
                         pintl_flag        in VARCHAR2,
                         pABBR_ELIG_STATUS in VARCHAR2); -- SCR 11920

END ONSITE_OBJECTS;

```
