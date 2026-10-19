---
tags:
  - package
  - DONSYS
---
# DON_STAFF_SCHEDULE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_STAFF_SCHEDULE" IS

  type paramrectyp is record (parameter_code varchar2(5),
                            parameter_value varchar2(30)) ;
  type paramtabtyp is table of paramrectyp index by binary_integer ;
  paramlist paramtabtyp ;
  type piggyrectyp is record (piggyback_drive varchar2(10),
                              piggybacked_to varchar2(10)) ;
  type piggytabtyp is table of piggyrectyp index by binary_integer ;
  piggylist piggytabtyp ;
  type emprectyp is record ( staff_no varchar2(6),
                    tl_skill number,
                    coach_driver_skill number,
                    van_driver_skill number,
                    atl_skill number ,
                    overall_skill number,
                    off_day_candidate varchar2(1),
                    assigned_curdate varchar2(1),
                    unavl_start_time varchar2(5),
                    unavl_end_time varchar2(5),
                    hours number,
                    team_id varchar2(5),
                    term_date date,
                    facility_code varchar2(5),
                    mix_team varchar2(1)) ;
  type emptabtyp is table of emprectyp index by binary_integer ;
  emplist emptabtyp ;
 type drvrectyp is record (
                   drive_id varchar2(10),
                   min_skill_rating number,
                   proj_draw number,
                   drive_type varchar2(5),
                   drive_start_time date,
                   drive_end_time date,
                   drive_facility varchar2(5),
                   staff_reqd number) ;
 type drvtabtyp is table of drvrectyp index by binary_integer ;
 drvlist drvtabtyp ;
 type faciltyp is record (
                   drive_id varchar2(10),
                   facility_code varchar2(5)) ;
 type faciltabtyp is table of faciltyp index by binary_integer ;
 facility_list faciltabtyp ;
 type empfaciltyp is record (
                   staff_no varchar2(6),
                   facility_code varchar2(5)) ;
 type empfaciltabtyp is table of empfaciltyp index by binary_integer ;
 emp_facility empfaciltabtyp ;
 type emprectemp is record (
            staff_no varchar2(6),
            hours number,
            skill_rating number,
            emplist_index number) ;
 type emptabtemp is table of emprectemp index by binary_integer ;
 type empindtyp is table of number index by binary_integer ;

PROCEDURE MAIN_PROC
 (START_DATE IN date
 ,END_DATE IN date
 ,SCHEDULE_ID IN varchar2
 ,CHAPTER_ID IN varchar2
 ,SCH_NAME IN varchar2
 );
PROCEDURE PREPARE_LOG_FILEHANDLE;
PROCEDURE WRITE_LOG
 (LOG_MSG IN varchar2
 );
PROCEDURE CREATE_HEADER_ENTRY;
PROCEDURE READ_PARAMETERS;
FUNCTION GET_PARAMETER
 (PARAMETER_CODE IN varchar2
 )
 RETURN VARCHAR2;
PROCEDURE PREPARE_DRIVE_LIST
 (CURDATE IN date
 );
PROCEDURE SORT_DRVLIST
 (SORT_COUNT IN number
 );
PROCEDURE SWAP_DRVLIST
 (FIRST_INDEX IN number
 ,SECOND_INDEX IN number
 );
PROCEDURE CREATE_EMPLOYEE_LIST;
PROCEDURE CHECK_VACATIONS
 (EMP_INDEX IN number
 );
PROCEDURE PRINT_EMPLOYEES;
PROCEDURE POTENTIAL_STAFF_OFF_DAY
 (V_JOB_CODE IN varchar2
 );
PROCEDURE SORT_EMPTEMPLIST
 (EMPTEMPLIST IN OUT emptabtemp
 ,SORT_TYPE IN varchar2
 ,SORT_COLUMN IN varchar2
 );
PROCEDURE SWAP_EMPTEMPLIST
 (EMPTEMPLIST IN OUT emptabtemp
 ,FIRST_INDEX IN number
 ,SECOND_INDEX IN number
 );
PROCEDURE GET_DRIVE_ASSIGNMENT
 (V_STAFF_NO IN varchar2
 ,CDATE IN date
 ,HOURS OUT number
 );
PROCEDURE CALC_HOURS_FOR_DRIVE
 (V_DRIVE_ID IN varchar2
 ,ACT_START_TIME OUT date
 ,ACT_END_TIME OUT date
 );
PROCEDURE DO_PRE_ASSIGNMENTS;
PROCEDURE ASSIGN_TL
 (DRIVE_INDEX IN number
 );
FUNCTION CHECK_JOB
 (EMP_INDEX IN number
 ,JOB_CODE IN varchar2
 )
 RETURN BOOLEAN;
FUNCTION CHECK_OFF_DAY_CANDIDATE
 (EMP_INDEX IN number
 )
 RETURN BOOLEAN;
FUNCTION CHECK_ASSIGN_TODAY
 (EMP_INDEX IN number
 )
 RETURN BOOLEAN;
FUNCTION CHECK_UNAVL
 (EMP_INDEX IN number
 ,DRIVE_INDEX IN number
 )
 RETURN BOOLEAN;
FUNCTION CHECK_SKILL_RATING
 (DRIVE_INDEX IN number
 ,V_STAFF_NO IN varchar2
 ,V_JOB_CODE IN varchar2
 )
 RETURN BOOLEAN;
FUNCTION CHECK_TEAM
 (DRIVE_INDEX IN number
 ,V_STAFF_NO IN varchar2
 ,TEAM_ID varchar2
 )
 RETURN BOOLEAN;
FUNCTION CHECK_RECOVERY_TIME
 (DRIVE_INDEX IN number
 ,V_STAFF_NO IN varchar2
 )
 RETURN BOOLEAN;
PROCEDURE ASSIGN_TEAM_MEMBER
 (DRIVE_INDEX IN number
 );
PROCEDURE GET_TL
 (DRIVE_INDEX IN number
 ,TL_ID OUT varchar2
 ,TL_TEAM OUT varchar2
 ,TL_INDEX OUT number
 );
PROCEDURE LIST_ELIGIBLE_STAFF
 (EMPTEMPLIST IN OUT emptabtemp
 ,TL_TEAM IN varchar2
 ,DRIVE_INDEX IN number
 ,TL_INDEX number
 );
PROCEDURE SELECT_DRIVER
 (EMPTEMPLIST IN emptabtemp
 ,TL_ID IN varchar2
 ,DRIVE_INDEX IN number
 );
PROCEDURE CHECK_TEAM_FOR_ASSIGNED_DRIVER
 (DRIVE_INDEX IN number
 ,V_TEAM_ID IN varchar2
 ,DRIVER_ASSIGNED IN OUT varchar2
 );
PROCEDURE CHK_TEAM_UNASSIGNED_DRVR
 (TEAM_ID IN varchar2
 ,DRIVE_INDEX IN number
 ,DRIVER_ASSIGNED OUT varchar2
 ,OFF_DAY_FLAG IN varchar2
 );
PROCEDURE ASSIGN_DRIVER
 (DRIVE_INDEX IN number
 ,V_STAFF_NO IN varchar2
 ,V_JOB_CODE IN varchar2
 );
PROCEDURE SELECT_OTHER_MEMBERS
 (DRIVE_INDEX IN number
 );
PROCEDURE CHECK_TEAM_FOR_MINIMUM_SKILL
 (V_TEAM_ID IN varchar2
 ,DRIVE_INDEX IN number
 );
PROCEDURE CHECK_TEAM_FOR_AVERAGE_SKILL
 (V_TEAM_ID IN varchar2
 ,DRIVE_INDEX IN number
 ,OFF_DAY_FLAG IN varchar2
 );
FUNCTION GET_AVERAGE_SKILL
 (EMPTEMPLIST IN emptabtemp
 ,EMP_INDEX IN empindtyp
 ,DRIVE_INDEX IN number
 )
 RETURN NUMBER;
FUNCTION HANDLE_UNASSIGNMENT
 (DRIVE_INDEX IN number
 ,V_STAFF_NO IN varchar2
 )
 RETURN BOOLEAN;
PROCEDURE FIND_SUITABLE_STAFF
 (V_TEAM_ID IN varchar2
 ,SUITABLE_STAFF_NO OUT varchar2
 ,SPECIAL_JOB_CODE IN varchar2
 ,DRIVE_INDEX IN number
 );
PROCEDURE ASSIGN_AND_UNASSIGN
 (DRIVE_INDEX IN number
 ,OLD_STAFF_NO IN varchar2
 ,NEW_STAFF_NO IN varchar2
 ,SPECIAL_JOB_CODE IN varchar2
 );
PROCEDURE SCHEDULE_PIGGYBACK_DRIVES;
PROCEDURE ASSIGN_STAFF_TO_DRIVE
 (V_DRIVE_INDEX IN varchar2
 ,V_STAFF_NO IN varchar2
 ,V_JOB_CODE IN varchar2
 ,V_ASSIGN_MODE IN varchar2
 );
PROCEDURE REVERSE_EMPLIST_ORDER;
PROCEDURE PRINT_ASSIGNMENT;
PROCEDURE COPY_EMP_TO_TEMP
 (EMPTEMPLIST IN OUT emptabtemp
 ,TEMP_COUNTER IN number
 ,EMPLIST IN emptabtyp
 ,EMP_COUNTER IN number
 );
PROCEDURE BOD_EOD
 (DRIVE IN varchar2
 ,JOBCODE IN varchar2
 ,BOD OUT date
 ,EOD OUT date
 );
FUNCTION MIX_FACILITY
 RETURN NUMBER;
FUNCTION MIX_TEAM
 RETURN NUMBER;
FUNCTION NO_OFF
 RETURN NUMBER;
PROCEDURE OVERTIME_UNDERTIME
 (P_OVTIM OUT number
 ,P_UNTIM OUT number
 );
FUNCTION PARTIAL_ASSIGNMENTS
 RETURN NUMBER;
FUNCTION RECOVERY_TIME
 RETURN NUMBER;
END DON_STAFF_SCHEDULE; /*-- End of package header --*/

```
