---
tags:
  - package
  - DONSYS
---
# DON_STD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- STANDARD (PACKAGE in SYS)
- [[schemas/DONSYS/Tables/VALID_PHYSICAL_RULES|VALID_PHYSICAL_RULES]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_PROC_CODES|VALID_PROC_CODES]] (TABLE)

## Package Specification

```plsql
PACKAGE don_std IS
/*
** This package encapsulates all stored functions identified
** forward declaration can be found here along with function
** purity declarations to make these functions as pure as possible.
** hopefully we never have to modify any package state to achieve
** WNPS and RNPS State.
** Minimum requirement of WNDS is always maintained and occassionally WNPS.
**
** VER   DATE   BY    COMMENTS
** ---------------------------------------------------------------------
** 1.0  072497  RAJ   Initial version
** 1.1  102397  RAJ   Consolidated functions
** 1.2  011499  EDWIN function modification
** 1.3  021899  EDWIN modification on claimed donations
** 4    042209  EDWIN Adding the generate_new_id function
** 5    111209  EDWIN  Adding the generate_temp_id funcation
** 6    012310  EDWIN Adding the RBC - PLASMA loss count
** 7    031210  EDWIN IM # 3089 (Regarding RBC/PLASMA loss)
** 8    031210  EDWIN IM # 5048 (Regarding RBC/PLASMA loss) added chapter parameter and local timezone for sysdate
** 9    030813  EDWIN: To lock the record if the same donor is being accessed in 2 sessions of the HHPF screen. (UPDATE_UNDER_PROCESSING_FLAG)
*****Restting the verion number for 2018********
**01    020218  ASHOK: donor_weight function added (accessed in eligibility window) -- IM 693
**02    091218  RAMP: added new function comment_req_check for Audit forms to enforce comment filling) -- MLT# 756
**03    092118  RAMP: modified to_number logic for min val and max val -- MLT# 756
**04   020419  EDWIN: Added a routine to place the male and female interdiction
**05   060319  ASHOK: donro_life_counts and donor_ytd_count modified (removed chapter id condition)
**06   04192020  ASHOK: pop_reason routine added to determine inter_code, comments_req and out_of_range calculation for PHYRULE.
**07   06302020  SYNC from LT2015R2SP1 project -- ASHOK: CHECK_OBJECT_LOCK and OBJECT_LOCK_UNLOCK added.
**08   10112023 Ashok - MLT-6334 - DUPI ids are now generated with 'DP' code instead of 'DUPLI'. 
                This allows more range of numbers for DUPLICATE set ids.
                generate_new_id routine modified.
*/ 

/*
** this function calculates various lifetime counts on donations
*/
FUNCTION donor_life_counts
         (p_what      IN varchar2,
          szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type)
          RETURN NUMBER;

/*
** Donors lifetime donations credit count is calculated and returned.
*/
FUNCTION donor_life_credit_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Donors lifetime gallon count is calculated and returned.
*/
FUNCTION donor_life_gallon_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Donors lifetime donations unit count is calculated and returned.
*/
FUNCTION donor_life_unit_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/* Added by Lakshmi on 01/19/98 as requested by Gouder
** Donors lifetime donations unit count is calculated and returned.
*/
FUNCTION donor_life_deferral_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** this function calculates various YTD counts on donations
*/
FUNCTION donor_ytd_count
         (p_what      IN varchar2,
          szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type)
          RETURN NUMBER;

/*
** This function RETURN 'TRUE' value, if donor had completed a
** pre-defined number of Apheresis procedures in the lifetime
** donations, else 'FALSE' is returned.
*/
FUNCTION active_apheresis_donor
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** Donors lifetime donations credit count for a specified procedure
** code is calculated and returned.
*/
FUNCTION donor_life_proc_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type,
          szProcCode  IN valid_proc_codes.procedure_code%type) RETURN NUMBER;

/*
** Donors YTD donations credit count is calculated and returned.
*/
FUNCTION donor_ytd_credit_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Donors YTD gallon count is calculated and returned.
*/
FUNCTION donor_ytd_gallon_count
        (szDonorID   IN donors.donor_id%type,
         szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Donors YTD donations credit count for a specified procedure
** code is calculated and returned.
*/
FUNCTION donor_ytd_proc_count
        (szDonorID   IN donors.donor_id%type,
         szChapterID IN donors.chapter_id%type,
         szProcCode  IN valid_proc_codes.procedure_code%type) RETURN NUMBER;

/*
** Donors lifetime donations unit count is calculated and returned.
*/
FUNCTION donor_ytd_unit_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Total RETURN NUMBER of donations attempts is returned, this excludes
** successful donations.
*/
FUNCTION donations_attempted
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Donor age is calculated as on SYSDATE and is returned in years
** (may be fractional).
*/
FUNCTION donor_age
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN NUMBER;

/*
** Return 'TRUE' if current donor has donated at any fixed
** site at-least once, else 'FALSE' is returned.
*/
FUNCTION fixed_site_donor
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;


/*
** Date of last successful donation is returned.
*/
FUNCTION last_donation_date
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN DATE;

/*
** Procedure code for last successful donation is returned.
*/
FUNCTION last_donation_proc_code
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** Unit ID of last successful donation is returned.
*/
FUNCTION last_donation_unit_id
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** this function is used to retrieve donor information
*/
FUNCTION donor_std_info (p_what      IN varchar2,
                         szDonorID   IN donors.donor_id%type,
                         szChapterID IN donors.chapter_id%type)
                         RETURN VARCHAR2;

/*
** City of donor residence is returned.
*/
FUNCTION donor_city
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** State of donor residence is returned.
*/
FUNCTION donor_state
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** County of donor residence is returned.
*/
FUNCTION donor_county
        (szDonorID   IN donors.donor_id%type,
         szChapterID IN donors.chapter_id%type)  RETURN VARCHAR2;

/*
** Zip code for donor address is returned.
*/
FUNCTION donor_zip
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** Area code of donor's home phone number
*/
FUNCTION donor_home_area_code
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** Area code of donor's business phone number
*/
FUNCTION donor_work_area_code
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;


/*
** Donor full name
*/
FUNCTION donor_name
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor date of birth
*/
FUNCTION donor_dob
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN DATE;

/*
** donor abo
*/
FUNCTION donor_abo
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor email
*/
FUNCTION donor_email
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor gender
*/
FUNCTION donor_sex
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor ssn
*/
FUNCTION donor_ssn
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN number;

/*
** donor weight
*/
FUNCTION donor_weight
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN number;

/*
** donor address
*/
FUNCTION donor_address
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor home phone number
*/
FUNCTION donor_home_phone
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** donor work phone number
*/
FUNCTION donor_work_phone
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type) RETURN VARCHAR2;

/*
** calculates counts for a date range
*/
FUNCTION donor_range_counts
         (p_what      IN varchar2,
          szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type,
          szStartDate IN date,
          szEndDate   IN date)
          RETURN NUMBER;

/*
** Donors date range credit count is calculated and returned.
*/
FUNCTION donor_range_credit_count
         (szDonorID   IN donors.donor_id%type,
         szChapterID  IN donors.chapter_id%type,
          szStartDate IN date,
          szEndDate   IN date) RETURN NUMBER;

/*
** Donors date range gallon count is calculated and returned.
*/
FUNCTION donor_range_gallon_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type,
          szStartDate IN date,
          szEndDate   IN date) RETURN NUMBER;


/*
** Donors date range unit count is calculated and returned.
*/
FUNCTION donor_range_unit_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type,
          szStartDate IN date,
          szEndDate   IN date) RETURN NUMBER;


/*
** Donors date range credit count for a specified procedure
** code is calculated and returned.
*/
FUNCTION donor_range_proc_count
         (szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type,
          szProcCode  IN valid_proc_codes.procedure_code%type,
          szStartDate IN date,
          szEndDate   IN date)
         RETURN NUMBER;
/* procedure to generate the new id. This is called from the
   create_ids routine from the donorlib.pll */

PROCEDURE GENERATE_NEW_ID (PARAM_ID_TYPE IN VARCHAR2,
                           NEW_ID OUT VARCHAR2,
                           ERR_FLAG OUT VARCHAR2,
                           ERR_MSG OUT VARCHAR2) ;

/* this routine will be used to generate the temp IDS from the
  laptop, for non laptop users this function will not be used
*/

PROCEDURE GENERATE_TEMP_ID (NEW_TEMP_ID OUT VARCHAR2,
                           ERR_FLAG OUT VARCHAR2,
                           ERR_MSG OUT VARCHAR2) ;

/* routine to calculate the rbc-plasma loss for the past one year */

PROCEDURE DONOR_PLASMA_RBC_LOSS(p_donor_id   IN  VARCHAR2,
                                 p_plasma    OUT NUMBER,
                                 p_rbc       out NUMBER,
				 p_chapter_id IN VARCHAR2);

/* to update the under processing flag to prevent the locking from HHPF */

PROCEDURE UPDATE_UNDER_PROCESSING_FLAG (p_donor_id  IN VARCHAR2,
                                        p_drive_id  IN VARCHAR2,
                                        p_lock_flag  IN VARCHAR2);



FUNCTION COMMENT_REQ_CHECK(P_DONATION_TYPE  IN VARCHAR2,
                                       P_PROCEDURE_CODE IN VARCHAR2,
                                       P_PHYSICAL_CODE  IN VARCHAR2,
                                       P_VALUE          IN VARCHAR2,
                                       P_GENDER         IN VARCHAR2
                                      )
RETURN VARCHAR2;

PROCEDURE INSERT_MALE_FEMALE_INTER (pl_donor      in varchar2,
                                    pl_chapter_id in varchar2,
                                    pl_gender     in varchar2,
                                    pl_trans_id   in varchar2,
                                    pl_program_id in varchar2,
                                    pl_user_id    in varchar2,
                                    pl_out        out varchar2) ;

  -- Public type declarations
    TYPE vpr_rec_type IS RECORD (
        item_value        valid_physical_rules.item_value%TYPE,
        item_value_max    valid_physical_rules.item_value_max%TYPE,
        item_operator     valid_physical_rules.item_operator%TYPE,
        comment_req_flag  valid_physical_rules.comment_req_flag%TYPE,
        inter_code        valid_physical_rules.inter_code%TYPE,
        equip_type        valid_physical_rules.equip_type%TYPE,
        from_age          NUMBER,
        to_age            NUMBER,
        age               NUMBER,
        don_equip_type    VARCHAR2(10)
    );

    TYPE vpr_tab_type IS
        TABLE OF vpr_rec_type;

  -- Public function and procedure declarations
    PROCEDURE pop_reason (
        p_transaction_id  IN   VARCHAR2,
        p_phy_code        IN   VARCHAR2,
        p_phy_value       IN   VARCHAR2,
        p_out_of_range    OUT  VARCHAR2,
        p_comment_req     OUT  VARCHAR2,
        p_inter_code      OUT  VARCHAR2,
        p_status          OUT  VARCHAR2
    );

PROCEDURE CHECK_OBJECT_LOCK (p_pkg_name     IN VARCHAR2, 
                             p_fcn_name     IN VARCHAR2, 
                             p_flag_YN      OUT VARCHAR2, 
                             p_lock_min     OUT NUMBER);

PROCEDURE OBJECT_LOCK_UNLOCK (p_pkg_name IN VARCHAR2, 
                              p_fcn_name IN VARCHAR2, 
                              p_user IN VARCHAR2, 
                              p_flag_UL IN VARCHAR2);
/*
** to keep oracle happy, and of course for correct functioning,
** we must meet the minimum purity level for all these functions
** so, here are the directives for purity level WNDS and WNPS
**
*/

PRAGMA RESTRICT_REFERENCES (active_apheresis_donor, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_life_counts, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_life_credit_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_life_gallon_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_life_proc_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_life_unit_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ytd_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ytd_credit_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ytd_gallon_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ytd_proc_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ytd_unit_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donations_attempted, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (fixed_site_donor, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (last_donation_date, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (last_donation_proc_code, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (last_donation_unit_id, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_std_info, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_age, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_city, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_county, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_state, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_zip, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_name, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_address, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_email, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_abo, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_dob, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_sex, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_ssn, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_home_phone, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_work_phone, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_home_area_code, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_work_area_code, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_range_counts, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_range_credit_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_range_gallon_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_range_proc_count, WNDS, WNPS);
PRAGMA RESTRICT_REFERENCES (donor_range_unit_count, WNDS, WNPS);

END don_std;

```
