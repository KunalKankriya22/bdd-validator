---
tags:
  - package
  - UTIL
---
# LIFETRACK_TIMEZONE_CONVERT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lifetrack_timezone_convert AS
/*-----------------------------------------------------------------------------
PROCEDURE : Lifetrack_timezone_convert
PURPOSE   : Converting time zone from GMT to Local and Local to GMT time
PARAMETERS: Warehouse_id
DEVELOPER : Akthar Hussain
DEV. DATE : Jan 2011
NOTES     : Initial package creation.
Ver       : 01

Revision History
-------------------------------------------------------------------------------
Author		Date    Version	Remarks
-------------------------------------------------------------------------------
Arun	03-22-2011	  02	Changed the lookup table to
                            LT_APPLICATION_CONFIG to ensure
                            consistency , on March 22, 2011
Kishore	05/17/2011    03	Added two new functions to get
                            local time and GMT time
Arun	02/24/2012    04    Added new function (is_current_date) to find
                            validity of a passed in date
Arun	03/02/2012    05	Logic error in new function (is_current_date)
                            fixed.  (IM 7173)
Edwin   04/23/2012    06    chnages in the is_current_date check
Ashok	10/31/2013    07    IM:9443, 9445; Unable to use boolean return
                            function timezone_enabled in SQL query,
                            so added timezone_enabled_yn function i
                            wrapper for timezone_enabled which returns 'Y' or 'N';
Ashok   06/04/2015   08     IM 15, LT2013R3, get_lcl_time function added
Ashok   11/09/2017   09     LT2018 (Terminated chapter is causing issue in reports query.
Ashok   06/29/2021   10     New wrapper routine added to get local sysdate.(for Onsite .NET) (MLT-4389)
-----------------------------------------------------------------------------*/

/* Below procedure convert GMT time to Local time  based on chapter
timezone*/

    PROCEDURE get_local_time (
        p_chapter_id  IN   VARCHAR2,
        p_gmt_time    IN   DATE,
        p_local_time  OUT  DATE
    );

/* Below procedure convert local time to GMT standard time  based on chapter
	timezone*/

    PROCEDURE get_gmt_time (
        p_chapter_id  IN   VARCHAR2,
        p_local_time  IN   DATE,
        p_gmt_time    OUT  DATE
    );

      /* Below function convert local time to GMT standard time i
         based on chapter timezone*/

      -- Added by Kishore on 05/07/2011. IM 5356

    FUNCTION get_gmt_time (
        p_chapter_id  IN  VARCHAR2,
        p_local_time  IN  DATE
    ) RETURN DATE;

      /* Below function convert GMT time to Local time  based on chapter
	timezone*/

      -- Added by Kishore on 05/07/2011. IM 5356

    FUNCTION get_local_time (
        p_chapter_id  IN  VARCHAR2,
        p_gmt_time    IN  DATE
    ) RETURN DATE;

    /**
    Get local time for SYSDATE.

    --@param   in_chapter  Chapter ID to get the local time.
    --@return  datetime   Local chapter datetime for SYSDATE.
    --@throws

    <b>Call Example:</b>
    <pre>
       select lifetrack_timezone_convert.get_local_time('DAL') from dual;
    </pre>
    */

    FUNCTION get_local_time (
        in_chapter IN VARCHAR2
    ) RETURN DATE;

	/* Below procedure convert GMT time to Local standard time  and
           returns the date and time based on chapter timezone*/

    FUNCTION get_report_local_time (
        p_chapter_id IN VARCHAR2
    ) RETURN DATE;

	/* Function to check if time zone is enabled	*/
    FUNCTION is_timezone_enabled RETURN BOOLEAN;

	/* Function to check if time zone is enabled	*/
    FUNCTION timezone_enabled_yn RETURN VARCHAR2;

	/* Function to retrieve chapter id	*/

    FUNCTION get_chapter_id_db (
        p_user_id IN VARCHAR2
    ) RETURN VARCHAR2;

     /* Below function added on 06/04/2015. IM 15 (LT2013R3).
        Detailed notes are in the pkg body*/

    FUNCTION get_lcl_time (
        p_tz_enabled  IN  VARCHAR2,
        p_tz_offset   IN  VARCHAR2,
        p_gmt_time    IN  DATE
    ) RETURN DATE;

	/* Function to validate passed in date */
    FUNCTION is_current_date (
        chpid       IN  VARCHAR2,
        v_effd      IN  DATE,
        v_termd     IN  DATE,
        v_check_dt  IN  DATE DEFAULT sysdate
    ) RETURN VARCHAR2;

END lifetrack_timezone_convert;
```
