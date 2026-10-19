---
tags:
  - package
  - LTWEB
---
# FTRAK_STD

**Schema**: [[schemas/LTWEB/LTWEB|LTWEB]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE FTRAK_STD
AUTHID CURRENT_USER AS
/* ----------------------------------------
*
||    Program Name                : FTRAK_STD
||    Date Creation               : 01/07/2020
||    Current Version             : 01 : Ashok:  Initial version (took LTWEB.WEB_HHQ_PKG latest version and applied changes on top of it)
                                  : 02 : Ashok:  01/14/2020 gen_barcode_string and process_barcode_string routines added.
                                  : 03 : Ashok: 01/23/2020 download_web_responses routine added.
                                  : 04 : Ashok: 01/27/2020 gender_in parameter removed from gen_questions..
                                  : 05 : Ashok: 01/28/2020 download_web_responses routine paramters modified - removed unnecsssary paramters.
                                  : 06 : Ashok: 01/31/2020 download_web_responses modified to add new parameter online_id and donor_web_responded check added
                                  : 07 : Ashok: 02/03/2020 validate_donor_info check moved earlier to donor_web_responded check;
                                  : 08 : Ashok: 02/10/2020 DONOR_HHQ_HISTORY table issue - MLT 3016
                                  : 09 : Ashok: 10/15/2020 gen_questions routine modified - MLT 3731 (Search for V09)
                                  : 10 : Ashok: 05/03/2021 (search for V10) - update flag in online_status when responses are downloaded (used for survey)
                                  : 11 : Ashok: 05/11/2021 (search for V11) - gender_out parameter added to validate_id 2019R2SP6 for new FastTrak
-------------------------------------------- */
 FUNCTION abbr_enabled RETURN BOOLEAN;
 /*
  -- Call the procedure
      ftrak_std.gen_questions(online_id_in => :online_id_in,
                              gender_in => :gender_in);
  -- i/p parameters:
     -- online_id_in is required.
     -- gender_in is optional.
 */
 PROCEDURE gen_questions(online_id_in IN VARCHAR2);

 /*
  -- Call the procedure
  ftrak_std.validate_id(id_type_in => :id_type_in,
                        id_in => :id_in,
                        id_dob_in => :id_dob_in,
                        fname_out => :fname_out,
                        lname_out => :lname_out,
                        is_valid_out => :is_valid_out,
                        error_out => :error_out);
  -- i/p parameters:
     -- id_type_in is required.
     -- id_in is required.
     -- id_dob_in is required.

  -- o/p parameters
     -- fname_out
     -- lname_out
     -- is_valid_out  - varchar2 (holds VALID or INVALID)
     -- error_out   -- varchar2 (holds NULL or error message)
*/
 PROCEDURE validate_ID(id_type_in IN VARCHAR2,
                       id_in IN VARCHAR2,
                       id_dob_in IN DATE,
                       fname_out OUT VARCHAR2,
                       lname_out OUT VARCHAR2,
                       gender_out   OUT VARCHAR2,
                       is_valid_out OUT VARCHAR2,
                       error_out OUT VARCHAR2);

 PROCEDURE gen_barcode_string(online_id_in IN VARCHAR2,
                              string_out   OUT VARCHAR2,
                              status_out   OUT VARCHAR2);

 PROCEDURE process_barcode_string(string_in IN VARCHAR2,
                                   online_id_out OUT VARCHAR2,
                                   status_out   OUT VARCHAR2);
  /*
  -- Use this routine to download donor web responses to ONSITE system.
  ftrak_std.download_web_responses(session_id_in => :session_id_in,
                                   scan_in => :scan_in,
                                   transaction_id_in => :transaction_id_in,
                                   screener_id_in => :screener_id_in,
                                   prog_name_in => :prog_name_in,
                                   abbr_flag_out => :abbr_flag_out,
                                   hh_comp_flag_out => :hh_comp_flag_out,
                                   status_out => :status_out);
  -- i/p parameters:
     -- scan_in is required: either 14 char ONLINE ID or BARCODE STRING (encrypted)
     -- transaction_id_in is required: Donation transaction
     -- screener_id_in is required: User ID

  -- o/p parameters
     -- status_out -- 'OK' for success OR error message for failure;
*/
  PROCEDURE download_web_responses(scan_in           IN VARCHAR2,
                                   online_id_in      IN VARCHAR2,
                                   transaction_id_in IN VARCHAR2,
                                   screener_id_in    IN VARCHAR2,
                                   status_out        OUT VARCHAR2);

  FUNCTION disable_online_button(transaction_id_in IN VARCHAR2) RETURN BOOLEAN;
END FTRAK_STD;
```
