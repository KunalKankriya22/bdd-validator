---
tags:
  - package
  - UTIL
---
# PRINT_UTIL

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package print_util as 
/* ************************************************************
  Name              : PRINT_UTIL.pkg
  Created By        : Ashok
  Date Of Creation  : 03/10/2021
  Purpose           : This is a label print utility package that replaces
                      lblprt.x c program.
  Pre-Req           : 1) Network ACL must be setup for TCP communication with
                      printer socket.
                      2) DB Server must be able to ping hematrax print server.

  Version History

  Date         Version  Description
  --------------------------------------------------------------------
  03/10/2021   01       POC - Initial development to replace lblprt.x c program.
  12/15/2021   01       Updated pkg to add log file creation in LOGDR.
  12/16/2021   01       Updated pkg to add submit_async_regular_job and
                        submit_async_job (IN_MEMORY_FULL option
                        is used as per oracle recommendation for frequently 
                        running jobs that take less time to run).
                        -- IN_MEMORY_FULL type requires 
                        GRANT EXECUTE ON SYS.DEFAULT_IN_MEMORY_JOB_CLASS TO util;
                        -- MLT 4745
 **********************************************************************   */

  /*
    Routine to submit print job to print server. Opens tcp connection
    and sends data to the print server.
  */
  procedure submit_job( p_host_in    IN VARCHAR2, 
                        p_port_in    IN VARCHAR2, 
                        p_data_in    IN VARCHAR2,
                        p_user_in    IN VARCHAR2
                      );
  /* 
    Submits a one time dbms scheduler regular type job. This routine is not used
     as the team has decided to use IN_MEMORY_FULL option(check submit_async_job)
  */ 
  procedure submit_async_regular_job(p_host_in    IN VARCHAR2, 
                                     p_port_in    IN VARCHAR2, 
                                     p_data_in    IN VARCHAR2,
                                     p_user_in    IN VARCHAR2);

  /* 
    Submits a one time dbms scheduler IN_MEMORY_FULL lightweight job. 
    Called from sbclib.pll, LAIRESCH, LAIPPPRD, LAICDISB
    -- MLT 4745
  */ 
  procedure submit_async_job(p_host_in    IN VARCHAR2, 
                             p_port_in    IN VARCHAR2, 
                             p_data_in    IN VARCHAR2,
                             p_user_in    IN VARCHAR2);
end print_util;
```
