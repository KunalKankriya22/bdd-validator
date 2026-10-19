---
tags:
  - package
  - SRVSYS
---
# LT_PLASMA_CSL_FILE_GENERATOR

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE  LT_PLASMA_CSL_FILE_GENERATOR AS

/*****************************************************************************
Developed By : Basker Edwin
Create Date  : 06.10.2002
Purpose      : This procedure will generate CSL format file as per the
               specification
Version      : 01  (Initial version)- Edwin 03/31/14
             : 02  IM: 9942 - Edwin 4/7/14
             : 03  IM: 9943 - Edwin (4/8/14)
             : 04  IM: 9944, 9945 - Edwin (4/9/14)
             : 05  IM: 9946, 9947   -Edwin (4/10/14)
             : 06  IM: 9951   - Edwin (4/14/14)
             : 07  IM: 9955  - Edwin 4/17/14
             : 08  IM: 9965  - Edwin 4/23/14
**************************************************************************** */

   PROCEDURE GEN_CSL_FILE (pl_ship_no in varchar2,p_dl in varchar2,
                            pl_Status out varchar2);

END LT_PLASMA_CSL_FILE_GENERATOR;
```
