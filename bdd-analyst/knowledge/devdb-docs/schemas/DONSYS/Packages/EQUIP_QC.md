---
tags:
  - package
  - DONSYS
---
# EQUIP_QC

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE EQUIP_QC IS

/* ---------------- Version History---------------------

Modified By         Ver          Date            Comments
=============================================================

B. Edwin             01          05/18/19    Original version created
                                  to determine if the QC is passed or failed
B. Edwin             02          09/29/19  changes to paramer logic.

B. Edwin             03          11/12/19 MLT- 2759
B. Edwin             04          07/16/20 MLT-3839
B. Edwin             05          07/20/20 MLT-3839 (fine tune to V04)
---------------------------------------------------- ------------ */
PROCEDURE CHECK_QC_STATUS (
                           pl_id_type          in varchar2,
                           pl_equip_supp_code  in varchar2,
                           pl_QC_code          in varchar2,
                           pl_qc_check_code    in varchar2,
                           pl_qc_value_date    in date,
                           pl_data_type        in varchar2,
                           pl_qc_value         in varchar2,
                           pl_chapter_id       in varchar2,
                           pl_qc_status        out varchar2
                         ) ;

 PROCEDURE CHECK_BAG_QC_STATUS (
                           pl_scan_type        in varchar2,
                           pl_bag_open_flag    in varchar2,
                           pl_bag_open_date    in date,
                           pl_bag_exp_date     in varchar2,
                           pl_qc_scan_value         in varchar2,
                           pl_qc_status        out varchar2
                         ) ;

 PROCEDURE READ_DATA (
                      pl_id_type           in varchar2,
                      pl_equip_supply_code in varchar2,
                      pl_data_type         in varchar2,
                      pl_qc_code           in varchar2,
                      pl_qc_check_code     in varchar2,
                      pl_scan_allowed      out varchar2,
                      pl_range_required    out varchar2,
                      pl_range_value       out varchar2,
                      pl_qc_accept_value   out varchar2,
                      pl_status            out varchar2
                   ) ;

t_scan_allowed    varchar2(1);
t_range_required  varchar2(1);
t_range_value     number:=0;
t_qc_accept_value varchar2(5);
t_status          varchar2(50);
local_date        date;
t_value_type      varchar2(10);
END EQUIP_QC;

```
