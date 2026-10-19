---
tags:
  - package
  - DONSYS
---
# DON_MCAL_ROLLOVER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_MCAL_ROLLOVER" IS
 g_curdate date := trunc(sysdate) ;
 g_run_number number := 0;
 g_chapter_id varchar2(4) ;
 g_log_seq number := 1 ;
 procedure decide_rollover (parm_chapter_id in varchar2) ;
 procedure crt_drive_info(hold_reason_code in varchar2) ;
 procedure get_base_date(base_date out date) ;
 procedure get_preferences ;
 procedure estimate_resources ;
 procedure decode_preferences (i1 in number,base_date in date);
 procedure sort_dates ;
 procedure check_resources (feasible_flag out varchar2) ;
 procedure add_log_entry(sponsor_id in varchar2,
                        future_drive_date in date,
                        log_type in varchar2,
                        log_text in varchar2,
                        user_display in varchar2) ;
END DON_MCAL_ROLLOVER ;

```
