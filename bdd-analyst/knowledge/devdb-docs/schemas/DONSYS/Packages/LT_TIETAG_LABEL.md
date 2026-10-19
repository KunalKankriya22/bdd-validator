---
tags:
  - package
  - DONSYS
---
# LT_TIETAG_LABEL

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE LT_TIETAG_LABEL as
/*  ------------- Change History------------

 Ver: 01 - LT2018 (Ashok) - 01/18/2017 - Initial creation.
 Ver: 02 - LT2018 (Ashok) - 03/28/2017 - Label generation logic modified.
 Ver: 03 - LT2018 (Ashok) - 04/11/2017 - IM 451 BC_SP_INS table is at chapter level.
                                       - IM 508 timezone appled to print date.
 Ver:04    2019R2 (Edwin) - 06/21/2021   MLT 4386
 Ver:05    2022R3 (Ashok) - 07/14/2022 - Search for V05 GEN_ADTT_FILE routine updated. 
           MLT-5282 (DOB label added) 
 Ver:06    2022R3 (Ashok) - 08/02/2022 - V06; Use special_units chapter id instead of donations chapter id.             
------------------------------------------------ */
   procedure GEN_SPTT_FILE (pDonorID in varchar2,
                            pInterCode in varchar2,
                            pNoLabels  in number,
                            pPrinter   in varchar2,
                            pChapterID  IN VARCHAR2);

   procedure GEN_ADTT_FILE (pPatID     in varchar2,
                            pSeqNo     in varchar2,
                            pSurgID    in varchar2,
                            pSurgDate  in Date,
                            pType      in varchar2,
                            pProdTyp   in varchar2,
                            pIrr       in varchar2,
                            pHLA       in varchar2,
                            pNoLabels  in number,
                            pPrinter   in varchar2);

  function get_column(pString in varchar2, pColNo in number, pSep in varchar2)
  return varchar2;

  FUNCTION ISBT_CHK_DIGIT(pUnit in varchar2) RETURN varchar2;
end;

```
