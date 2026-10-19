---
tags:
  - package
  - UTIL
---
# EMAIL_UTIL

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package email_util as
/* ************************************************************
  Name              : EMAIL_UTIL.pkg
  Created By        : Ashok
  Date Of Creation  : 02/20/2023
  Purpose           : Email utility to send emails..
  Pre-Req           : 1) Network ACL must be setup for UTL user
                      2) UTL_MAIL pkg must be installed.
                      3) SMTP_OUT_SERVER parameter (localhost:25)
                      4) Tested with POSTFIX mail relay on DB server with GMAIL
                        account using APP password.
                      5) VALID_MAIL_CONFIG, VALID_MAIL_USERS, VALID_MOBILE_PROVIDERS
                      6) Any errors are logged to EMAIL_UTIL.log in LOGDR.

  Version History

  Date         Version  Description
  --------------------------------------------------------------------
  02/20/2023   01       Initial Developement

 **********************************************************************   */

  /*
    Routine to send email. Uses UTL_MAIL pkg to send email.
  */
    PROCEDURE send_email
        (   fcn_code_in     IN VARCHAR2,
            msg_text_in     IN VARCHAR2,
            att_text_in     IN VARCHAR2,
            att_fname_in    IN VARCHAR2,
            status_out      OUT VARCHAR2
        ) ;

    /*
      Called after MAIN UPLOAD JOB completion.
    */
    PROCEDURE send_main_upload_status(upload_id_in IN VARCHAR2);

    /*
      Called after API UPLOAD JOB completion.
    */
    PROCEDURE send_api_upload_status(upload_id_in IN VARCHAR2);

END email_util;

```
