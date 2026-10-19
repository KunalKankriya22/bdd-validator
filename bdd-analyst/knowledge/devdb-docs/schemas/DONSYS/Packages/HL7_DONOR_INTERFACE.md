---
tags:
  - package
  - DONSYS
---
# HL7_DONOR_INTERFACE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "HL7_DONOR_INTERFACE" AS

/************************************************************************************
 Package     : HL7_DONOR_INTERFACE (Interface Engine b/w LT and Other sys)
 Developed By: Basker Edwin
 Purpose     : Will Generate HL7 messages
 Created Date: 03.15.04
 Modify  Date: 09.09.04
 Version     : 2.03.05
 Date Mod    : 04/15/2011
 Version	 : 03	Modified By: Hussein  replace user by lt_sesseion_user.get_user_id

*************************************************************************************/
  PROCEDURE GENERATE_ADT;

  PROCEDURE UPLOAD_ORU_INTO_LT(pfile in varchar2);

  PROCEDURE GENERATE_HEMOGRAM_ORM;

  FUNCTION GET_SYSPARM_VALUE(pCode in varchar2) return char;
  Procedure get_msg_seg(pMsgType in varchar2,pCtrlID in varchar2,
                        pSENDA in varchar2,pSENDF in varchar2,
		        pRECDA in varchar2,pRECDF in varchar2,
		       pOut out varchar2,pMsgSeg out varchar2);

END HL7_DONOR_INTERFACE;

```
