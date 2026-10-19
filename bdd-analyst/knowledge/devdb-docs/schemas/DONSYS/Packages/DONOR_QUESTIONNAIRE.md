---
tags:
  - package
  - DONSYS
---
# DONOR_QUESTIONNAIRE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "DONOR_QUESTIONNAIRE" 
/*-----------------------------------------------------------------------------
PACKAGE		  :Donor Questionnaire
PURPOSE   	:	Package to calcuate if the donor is eligible to use the abbreviated donor history form.
DEVELOPER 	:	Ashok Vardhan
DEV. DATE 	:	25 Jun 2013
NOTES     	:	Initial version.
VER       	:	01
COMMENTS    : SCR 20692 is misspelled in modification history - should have been 20609

Modification History
-------------------------------------------------------------------------------
Modified by	 |     on	      |	   Version	  |  Remarks
-------------------------------------------------------------------------------
Ashok        |  06/25/2013  |     01        |  SCR 11942 - Abbreviated Questionnaire for Onsite Module.
Ashok        |  06/25/2013  |     02        |  IM 9657 - Added code to check if any donation history is missing
                                            |  in abbreviated_questionnaire_history table and to update the missing records.
Ashok        |  06/25/2013  |     03        |  IM 9693 - Modified program logic to not consider a deferral as a succesful donation
Ashok	     |  11/04/2013  |     04        |  Modified donor_questionnaire_history to donor_hhq_history (Mobile PC issue in creating api table)
Ashok	     |  12/02/2013  | 	  05	    | Version numbers issue - took an old version and rechecked in.
Ashok	     |  07/17/2014  | 	  06	    | V06, don_6M_cnt CURSOR commented out.
Ashok	     |  08/08/2014  | 	  07	    | V07, SCR 20692; valid_don_types routine added, calc_qtype signature modified.
Ashok	     |  08/11/2014  | 	  08	    | V08, SCR 20692; calc_qtype (check_elig_criteria) modified.
Ashok	     |  08/14/2014  | 	  08	    | V08, SCR 20692; calc_qtype (check_elig_criteria) modified and still working on it.
Ashok	     |  09/09/2014  | 	  08	    | V08, SCR 20692; missing_donation_cur modified.
Ashok      |  09/09/2014  |     09      | V09, SCR 20692; check_elig_criteria modified to also consider backoffice registrations where donor responses
                                          -- are not recorded in donor_responses and health_history tables.  Use donations - coll_date and donation type
                                          -- to determine the template effective dates.
Ashok      |  09/11/2014  |     09      | V09, SCR 20692; donor_hhq_history table to go back and bring all the previous donations
                                          -- instead of just 24months.
Ashok      |  09/12/2014  |     09      | V09, SCR 20692; Removed hardcoding of 'atleast one donation within a timeframe' criteria.
Ashok      |  09/17/2014  |     09      | V09, SCR 20692; Modified valid_don_types cursor stmt to incluse eff_date and term_date checks for valid_don_types.
Ashok      |  02/19/2015  |     10      | V10, IM 10398;
Ashok      |  03/09/2016  |     11      | V11, IM 213
Ashok      |  02/19/2019  |     12      | V12 -- MLT   1796 (generate_questions added for ONSITE)*************
Ashok      |  05/24/2019  |     13      | V13 -- MLT   2165 (generate_questions - insert dummy donor response)
Ashok      |  07/01/2019  |     14      | V14 -- MLT   2293 (generate_questions - 'AL' hardcoding removed)
Ashok      |  07/05/2019  |     15      | V15 -- MLT   2299 (generate_questions - new column read_more_flag added to onsite_donor_responses)
Ashok      |  07/17/2019  |     16      | V16 -- ODR Routine queries modified to look at timezone.
Ashok      |  07/22/2019  |     17      | V17 -- generate_questions routine modified to only generate the screener ask D questions. -- MLT 2386.
Ashok      |  07/24/2019  |     18      | V18 -- MLT 2285 - new column added to onsite_donor_respones and populated (QUESTION_DELAY_SECONDS)
Ashok      |  08/01/2019  |     19      | V19 -- MLT 2426 QUES_dESC_ABBR added, all questions are inserted into odr table.  Based on the response from user,
                                              -- either all questions are administered or only abrreviated.
Ashok      |  09/20/2019  |     20      | V20 -- MLT 2597 PARENT_RESP_FLAG column added to onsite_donor_responses table.
Ashok      |  10/15/2020  |     21      | V21 -- MLT 3688 GENERATE_QUESTIONS routine modified to implement differnt seq for aDHQ. Search for V21.
Ashok      |  10/19/2020  |     22      | V22 -- MLT 3752 calc_qtype routine modified to remove the hardcoding of 2 for template modification scenario.
Ashok      |  10/19/2020  |     23      | V23 -- Removed a check where only one backoffice registration is captured in donor_hhq_history table.
-----------------------------------------------------------------------------*/
AS


PROCEDURE calc_qtype(donor_id_in IN VARCHAR2, coll_date_in IN DATE, don_type_in IN VARCHAR2, qtype_out OUT VARCHAR2, comments_out OUT VARCHAR2, reset_flag_out OUT VARCHAR2, err_out OUT VARCHAR2);
FUNCTION freqType RETURN VARCHAR2;
FUNCTION freqValue RETURN NUMBER;
FUNCTION freqDefValue RETURN NUMBER;
FUNCTION addFreq(source_date_in IN DATE, freq_for_in IN VARCHAR2 DEFAULT NULL) RETURN DATE;
FUNCTION subFreq(source_date_in IN DATE, freq_for_in IN VARCHAR2 DEFAULT NULL) RETURN DATE;
PROCEDURE valid_don_types (in_donTypeList IN VARCHAR2, out_donTypeList OUT VARCHAR2, out_ErrDonType OUT VARCHAR2);  -- Called from ADHQ screen (VDIABBRQ)
PROCEDURE generate_questions(p_transaction_id IN VARCHAR2, p_selected_qtype IN VARCHAR2, p_abbr_flag OUT VARCHAR2, p_status OUT VARCHAR2) ;

END donor_questionnaire;


```
