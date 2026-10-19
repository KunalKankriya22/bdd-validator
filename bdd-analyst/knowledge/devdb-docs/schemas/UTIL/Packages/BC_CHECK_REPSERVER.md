---
tags:
  - package
  - UTIL
---
# BC_CHECK_REPSERVER

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE BC_Check_RepServer
AUTHID CURRENT_USER
IS
     /*-------------------------------------------------------------------
     PACKAGE     :  BC_Check_RepServer
     PURPOSE     :  Get Report server that has least active jobs and get report server URL.
     DEVELOPER   :  Ashok Vardhan
     DEV. DATE   :  04/11/2012
     NOTES       :  Initial version.
     Ver         :  03

     Modification History
     -----------------------------------------------------------------------
     Modified by    on    Version  Remarks
     ---------------Version Reset for 2018---------------------------------

     Ashok   08/20/2018   01  (old version was 03)  get_reports_url modified
                              update_repsrv_status and set_debug_mode
                              routines added.

     Edwin   09/19/2018   02  Changing the package to make it as generic
                              for donor and lab

     Ashok   02/04/2025   03  get_reports_server routine modified. MLT-7611
     ----------------------------------------------------------------------
     */
   -- This routine is used to return least active jobs server name.

  PROCEDURE get_reports_server (
      out_server_name   OUT   VARCHAR2,
      out_error_msg     OUT   VARCHAR2
   );

   -- This routine is used to return the URL link for the reports server on which the input job id was submitted.
   PROCEDURE get_reports_url (
      in_server_name   IN       VARCHAR2,
      out_server_url   OUT      VARCHAR2,
      out_error_msg    OUT      VARCHAR2
   );

   -- This routine is used to update rep server status to Y(server is up or reachable) OR N (server is down or not reachable)
   PROCEDURE update_repsrv_status;

   PROCEDURE set_debug_mode(flag_in IN BOOLEAN);

 END BC_Check_RepServer;   --END LT_RepServer_Lab;

```
