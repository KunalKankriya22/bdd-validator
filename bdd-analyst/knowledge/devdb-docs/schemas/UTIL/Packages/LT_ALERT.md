---
tags:
  - package
  - UTIL
---
# LT_ALERT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE        "LT_ALERT" AS
/****************************************************************************\
 * LT_ERROR - Database functions used for set and get the Application
 * Username.
 * The functions get_userid should not be called before setting the userid with
 * set_userid
 ***************************************************************************
 * Version 1.0
 ***************************************************************************
 * Change History
 *
 *
 *  Ashok V    04/18/2011	v 2.0	Code modified to enable package to
 *                                      return current user in case the
 *                                      user is not set explicitly.
 *
\*****************************************************************************/


  TYPE payload_rt IS RECORD
   (
      title           VARCHAR2(500),
      message         VARCHAR2(2000),
      alert_style     VARCHAR2(200), -- Stop, Caution, Note
      button1_lbl     VARCHAR2(100),
      button2_lbl     VARCHAR2(100),
      button3_lbl     VARCHAR2(100),
      default_button  VARCHAR2(20) -- Button1, Button2, Button3
   );


   -- setter methods session variables.
   PROCEDURE init_buttons;
   PROCEDURE set_button1;
   PROCEDURE set_button2;
   PROCEDURE set_button3;

   -- getter methods for session variables.
   FUNCTION button1 RETURN BOOLEAN;
   FUNCTION button2 RETURN BOOLEAN;
   FUNCTION button3 RETURN BOOLEAN;
   FUNCTION payload RETURN payload_rt;


   PROCEDURE init_choice;
   PROCEDURE init_warn;
   PROCEDURE init_inform;
   PROCEDURE init_error;
   PROCEDURE init_alert( p_payload payload_rt);
   PROCEDURE init;
   PROCEDURE set_property(p_property IN VARCHAR2, p_value IN VARCHAR2);
   FUNCTION get_property(p_property IN VARCHAR2) RETURN VARCHAR2;
END LT_ALERT;

```
