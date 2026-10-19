---
tags:
  - package
  - UTIL
---
# LT_USER_SESSION

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE LT_USER_SESSION AS 
/****************************************************************************\
 * LT_USER_SESSION - Database functions used for set and get the Application 
 * Username.
 * The functions get_userid should not be called before setting the userid with
 * set_userid
 ***************************************************************************
 * Version 1.0
 ***************************************************************************
 * Change History
 *   Fatih Acikgoz 22/MAR/2011 - Creation
 *
 *  Arun Samuel    04/18/2011	v 2.0	Code modified to enable package to 
 *                                      return current user in case the
 *                                      user is not set explicitly.
   Basker Edwinb   04/11/2016 V 3.0 Added more global values settings

   Ashok           10/14/2016 v04   timeout settings added to user session package.

   Ashok           01/18/2017 V05   get_tzone_offset signature modified to return VARCHAR2

   Ashok           05/29/2023 V06   tout_exit methods added
 *
\*****************************************************************************/

 PROCEDURE set_userid(p_user_id             IN VARCHAR2);
 PROCEDURE set_chapter_id(p_chapter_id      IN VARCHAR2);
 PROCEDURE set_warehouse_id(p_warehouse_id  IN VARCHAR2);
 PROCEDURE set_tzone_flag(p_tzone_flag      IN VARCHAR2);
 PROCEDURE set_tzone_offset(p_tzone_offset  IN VARCHAR2);


  -- Setter methods for timeout.
 PROCEDURE set_toutIdle(p_toutIdle          IN NUMBER);
 PROCEDURE set_toutWarn(p_toutWarn          IN NUMBER);
 PROCEDURE set_toutHtml(p_toutHtml          IN VARCHAR2);


 FUNCTION  get_userid return VARCHAR2;
 FUNCTION  get_chapter_id return VARCHAR2;
 FUNCTION  get_warehouse_id return VARCHAR2; 
 FUNCTION  get_tzone_flag return VARCHAR2;
 FUNCTION  get_tzone_offset return VARCHAR2; -- V05

 -- getter methods for timeout;
 FUNCTION get_toutIdle RETURN NUMBER;
 FUNCTION get_toutWarn RETURN NUMBER;
 FUNCTION get_toutHtml RETURN VARCHAR2;

 -- tout Exit methods. -- V06
 PROCEDURE set_toutExitImmediate(p_toutExit IN BOOLEAN);
 FUNCTION toutExitImmediate RETURN BOOLEAN;

 --Package Variable keeps the Value during the complete Oracle Session
 gv_userid         VARCHAR2(30);
 gv_chapter_id     VARCHAR2(4);
 gv_warehouse_id   VARCHAR2(2);
 gv_tzone_flag     VARCHAR2(1);
 gv_tzone_offset   VARCHAR2(15);
 gv_exit_session    BOOLEAN;

END LT_USER_SESSION;

```
