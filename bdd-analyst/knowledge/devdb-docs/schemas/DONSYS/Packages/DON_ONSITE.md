---
tags:
  - package
  - DONSYS
---
# DON_ONSITE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_ONSITE" AS

/***********************************************************
 Package     : DON_ONSITE
 Developed By: Basker Edwin
 Purpose     : All the online related packages would be
	       incorporated
 Date        : 07.15.02
************************************************************ */

  PROCEDURE GENERATE_NEW_ID (PARAM_ID_TYPE IN VARCHAR2,
                           NEW_ID OUT VARCHAR2,
                           ERR_FLAG OUT VARCHAR2,
                           ERR_MSG OUT VARCHAR2) ;

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
			 pALTERNATE_ID_TYPE in VARCHAR2);

END DON_ONSITE;

```
