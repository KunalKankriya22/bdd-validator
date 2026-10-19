---
tags:
  - package
  - SBCSYS
---
# LT_REPSERVER_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "LT_REPSERVER_LAB"
AUTHID CURRENT_USER
IS
     /*-----------------------------------------------------------------------------
     PACKAGE     :  LT_REP_SERVER_CHECK_DONOR
     PURPOSE     :  Get Report server that has least active jobs and get report server URL.
     DEVELOPER   :  Ashok Vardhan
     DEV. DATE   :  04/11/2012
     NOTES       :  Initial version.
     Ver         :  02

     Modification History
     -------------------------------------------------------------------------------
     Modified by    on    Version  Remarks
     -------------------------------------------------------------------------------
     Ashok   08/20/2018   03       get_reports_url modified
                                   update_repsrv_status and set_debug_mode routines added.
     -----------------------------------------------------------------------------
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
END LT_RepServer_Lab;

```
