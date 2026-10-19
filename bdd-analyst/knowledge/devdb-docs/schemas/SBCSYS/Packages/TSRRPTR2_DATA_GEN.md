---
tags:
  - package
  - SBCSYS
---
# TSRRPTR2_DATA_GEN

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "TSRRPTR2_DATA_GEN" is
  --Created By : Kishore
  --Created On : 06/30/2010
  --Purpose    : To populate the TSRRPTR2_DATA table so that the TSRRPTR2
  --	           report will access the data

  --Version    : 01 - Initial version
  --           : 02 - Modified by Kishore on 04/14/2011. SCR 17983
  --           : 03 - Modified by Kishore on 04/04/2012. IM 8163
  --           : 04 - LT2018 -- valid_interdictions to valid_interdictions_lab table.
  --           : 05 - MLT 542 (queries modified to use profile set ID for regional contracts)

  -- Added "pl_session_id" parameter to below procedure
  -- Added by Kishore on 04/04/2012. IM 8163
  procedure POP_TSRRPTR2_DATA_TABLE(pl_parm_id in varchar2,
                         	    pl_rpt_name in varchar2,
				    pl_user in varchar2,
                                    pl_session_id in varchar2,
				    p_status out varchar2);

End TSRRPTR2_DATA_GEN;

```
