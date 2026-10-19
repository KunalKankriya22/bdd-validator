---
tags:
  - package
  - DONSYS
---
# DON_CORE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_CORE IS
/* ----------------------------------------
*
||    Program Name                : DON_CORE
||    Date Creation               : 10-03-97
||    Current Version             : 03 IM# 2000, 10-06-2008
                                  : 04 Rel 4.5.0 (SCR# 16135), 02-24-2010
                                       digit social security number
                                       modify check_resolved_duplicate routine
                                  : 05 Adding the find_donor_full_ssn routine
                                       02-16-11
  Date Mod                        : 04/15/2011
  Version	                  : 05 - Modified By: Hussein
                                       - replace user by lt_sesseion_user.get_user_id
                                  : 06 - Modified by Kishore on 08/29/2013
                                       - Add a new procedure to compare 2 strings.
                                  : 07 - FIND_DONOR routine modified to add alternate ID changes; SCR 11774    
			          : 07 - Ashok; checking in the same version. no functional changes made (just re-formatted the code).
                                  : 08 - Modified by Kishore on 10/15/2013
                                       - Modify code so that the strings are compared using a percentage 
                                       - that is defined in the VALID_PARAMETERS table for parameter code SIMMPER
                                  : 09 - find_donor_full_ssn routine also modified to add alternate ID changes; 
                                    --SCR 11774; 10/15/2013                                       
-------------------------------------------------------
Resetting to 01 starting from LT_2018

   Current Version           : 01   SCR:151756   By: Edwin  [10/20/16]
                             : 02   Ashok 12/13/2016 -- made few changes to
                                     eligibility routine (weight parameter)
                             : 03   IM: 460  LT_2018 Edwin 01/05/2017
                             : 04   IM: 470  LT_2018 Edwin 011717
                             : 05   ONS_FIND_DONOR added for dotnet ONSITE module - 01/11/2019
                             : 06   ONS_FIND_DONOR routine modified (DGM_ID added to select stmt)
                             : 07   ONS_FIND_DONOR routine modified (ALT_TYPE added to select stmt)
                             : 08   ONS_FIND_DONOR routine modified (MLT 3782 - Username passed as parameter)
			     : 09   MLT-7812 (fixing the resolve potentisl duplicate issue) 
                 : 10   MLT-8064 (ONS_FIND_DONOR routine - FKSSN and SSN_MODE removed.)
-------------------------------------------- */

   PROCEDURE find_donor
      (p_ssn                   IN      NUMBER,
       p_last_name             IN      VARCHAR2,
       p_date_of_birth         IN      DATE,
       p_first_name            IN      VARCHAR2,
       p_gender                IN      VARCHAR2,
       p_session_id            IN      VARCHAR2,
       p_grade                 IN      NUMBER,
       p_chapter_id            IN      VARCHAR2,
       p_alt_id                IN      VARCHAR2, -- SCR 11774
       p_alt_type              IN      VARCHAR2, -- SCR 11774
       p_total                 OUT     NUMBER ) ;

   PROCEDURE find_donor_full_ssn
      (p_ssn                   IN      NUMBER,
       p_last_name             IN      VARCHAR2,
       p_date_of_birth         IN      DATE,
       p_first_name            IN      VARCHAR2,
       p_gender                IN      VARCHAR2,
       p_session_id            IN      VARCHAR2,
       p_grade                 IN      NUMBER,
       p_chapter_id            IN      VARCHAR2,
       p_alt_id                IN      VARCHAR2, -- SCR 11774
       p_alt_type              IN      VARCHAR2, -- SCR 11774       
       p_total                 OUT     NUMBER ) ;

PROCEDURE check_eligibility
      (p_donor_id              IN      VARCHAR2,
       p_procedure_code        IN      VARCHAR2,
       p_donation_type         IN      VARCHAR2,
       p_coll_date             IN      DATE,
       p_donor_weight          IN      NUMBER,
       p_elig_status           OUT     VARCHAR2,
       p_deff_date             OUT     DATE,
       p_inter_type            OUT     VARCHAR2,
       p_reason                OUT     VARCHAR2);

-- Added p_chapter_id parameter. Added by Kishore on 10/15/2013
PROCEDURE compare_strings
      (p_orig_string           IN      VARCHAR2,
       p_comp_string           IN      VARCHAR2,
       p_chapter_id            IN      VARCHAR2,
       p_comp_result           OUT     VARCHAR2);

PROCEDURE calc_final_grade -- SCR 11774;  10/15/2013;
      (donor_id_in             IN VARCHAR2,  
       chapter_id_in           IN VARCHAR2,
       alt_type_in             IN VARCHAR2,
       alt_id_in               IN VARCHAR2,
       input_grade_in          IN VARCHAR2, 
       final_grade_out         OUT VARCHAR2);   

--Purpose: This wrapper routine is called from ONSITE module (C#).       
PROCEDURE ons_find_donor
   (p_user_id                  IN      VARCHAR2,
    p_ssn                      IN      NUMBER,
    p_last_name                IN      VARCHAR2,
    p_date_of_birth            IN      DATE,
    p_first_name               IN      VARCHAR2,
    p_gender                   IN      VARCHAR2,
    p_chapter_id               IN      VARCHAR2,
    p_alt_id                   IN      VARCHAR2, 
    p_alt_type                 IN      VARCHAR2, 
    p_prog_name                IN      VARCHAR2,
    p_recordset                OUT SYS_REFCURSOR ) ;       
END DON_CORE;

```
