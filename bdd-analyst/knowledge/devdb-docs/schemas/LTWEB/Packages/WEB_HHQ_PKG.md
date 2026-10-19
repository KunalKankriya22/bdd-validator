---
tags:
  - package
  - LTWEB
---
# WEB_HHQ_PKG

**Schema**: [[schemas/LTWEB/LTWEB|LTWEB]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "WEB_HHQ_PKG"
AUTHID CURRENT_USER AS
/* ----------------------------------------
*
||    Program Name                : web_hhq_pkg
||    Date Creation               : LT2013
||    Current Version             : 01 : Initial version
                                  : 02 : wdr_random_insert added in filter_questions routine.  IM:9859; 01/07/2014
                                  : 03 : filter_questions routine modified for SCR 20609;
                                  : 04 : donor_questionnaire.calc_qtype signature modified.
                                  : 05 : fiter_questions routine modified to fix the sort_sequence value. 12/30/2014; -- IM 10283
                                  : 01 : IM 720 (gender value is being passed incorrectly from ADF software.  Modified filter_questions
                                       : to use ID Type and Online ID to figure out the gender type.
                                  :02  : MLT 3369 (Added screener ask flag check)
*/

-------------------------------------------- */
 PROCEDURE generate_questions(don_type_in IN VARCHAR2, online_id_out OUT VARCHAR2);
 PROCEDURE gen_questions(online_id_in IN VARCHAR2);
 FUNCTION abbr_enabled RETURN BOOLEAN;
 PROCEDURE filter_questions(online_id_in IN VARCHAR2, gender_in IN VARCHAR2);
 PROCEDURE send_mail (p_to        IN VARCHAR2,
                     p_from      IN VARCHAR2,
                     p_subject   IN VARCHAR2,
                     p_text_msg  IN VARCHAR2 DEFAULT NULL,
                     p_html_msg  IN VARCHAR2 DEFAULT NULL,
                     p_smtp_host IN VARCHAR2,
                     p_smtp_port IN NUMBER DEFAULT 25);
 PROCEDURE validate_ID(id_type_in IN VARCHAR2,
                       id_in IN VARCHAR2,
                       id_dob_in IN DATE,
                       fname_out OUT VARCHAR2,
                       lname_out OUT VARCHAR2,
                       is_valid_out OUT VARCHAR2,
                       error_out OUT VARCHAR2);
END WEB_HHQ_PKG;


```
