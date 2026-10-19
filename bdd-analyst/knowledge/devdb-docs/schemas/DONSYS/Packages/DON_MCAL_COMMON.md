---
tags:
  - package
  - DONSYS
---
# DON_MCAL_COMMON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_MCAL_COMMON IS

/************************************************************************************
Developed By : 
Create Date  : 
Purpose      : 
Date Mod     : 04/15/2011
Version	     : 02	- Modified By: Hussein - Replace user by lt_sesseion_user.get_user_id
             : 03 - Modified By: Kishore - Remove "chapter_id" clause from VALID_PROC_CODES table. SCR 18384	
             : 04 - Modified by Kishore on 07/21/2014 - Check if the timeslot for the site has expired or not
                    in "open_site" procedure. IM 10073.
             : 05 - MLT 213 Modified calendar-highlights query to apply timezone on date field.
*************************************************************************************/

   PROCEDURE create_alert (p_msg in varchar2,
                           p_chapter_id in varchar2) ;
   PROCEDURE decide_day_status (from_date in date,
                                to_date in date,
                                p_chapter_id in varchar2,
                                decision_mode in varchar,
                                status_string out varchar2,
                                err_flag out varchar2,
                                err_msg out varchar2) ;
   PROCEDURE get_resource_util (curdate in date,
                              p_chapter_id in varchar2,
                              exclude_drive_id in varchar2,
                              p_resource_code in varchar2,
                              number_booked out number,
                              number_avail out number) ;
   PROCEDURE get_part_assign_drives (p_start_date in date,
                                    p_end_date in date,
                                    p_schedule_id in varchar2,
                                    p_chapter_id in varchar2,
                                    out_string out varchar2,
                                    err_flag out varchar2) ;
   PROCEDURE get_recov_staff (p_start_date in date,
                             p_end_date in date,
                             p_schedule_id in varchar2,
                             p_chapter_id in varchar2,
                             out_string out varchar2,
                             err_flag out varchar2) ;
   PROCEDURE open_site(p_site_id in varchar2,
                      p_from_date in date,
                      p_to_date in date,
                      p_chapter_id in varchar2,
                      p_donation_type_group in varchar2,
                      p_proc_code in varchar2,
                      err_flag out varchar2,
                      err_msg out varchar2)  ;
   PROCEDURE staff_weekly_hours(p_schedule_id in varchar2,
                                p_staff_no in varchar2,
                                p_chapter_id in varchar2,
                                tot_hrs out varchar2);
END DON_MCAL_COMMON ; 


```
