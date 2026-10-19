---
tags:
  - package
  - DONSYS
---
# DON_COST_ANALYSIS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_COST_ANALYSIS" AS
    PROCEDURE calc_act_cpu(p_drive_id in varchar2,
                           p_chapter_id in varchar2,
                           act_cpu out number,
                           err_flag out varchar2,
                           err_msg out varchar2) ;
    PROCEDURE calc_proj_cost (param_drive_id in varchar2,
                             param_loc_id in varchar2,
                             stup_bkdown in number,
                             proj_cost out number,
                             err_flag out varchar2) ;
END DON_COST_ANALYSIS ;

```
