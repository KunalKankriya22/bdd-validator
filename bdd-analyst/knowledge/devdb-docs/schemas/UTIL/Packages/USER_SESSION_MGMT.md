---
tags:
  - package
  - UTIL
---
# USER_SESSION_MGMT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE        "USER_SESSION_MGMT"
/*-----------------------------------------------------------------------------
PACKAGE		:	User_Session_Mgmt
PURPOSE   	:	To enable DBA to identify user sessions, in the absence of
				individual DB users
DEVELOPER 	:	Arun Samuel
DEV. DATE 	:	28 May 2011
NOTES     	:	Initial version.
Ver       	:	01

Modification History
-------------------------------------------------------------------------------
Modified by		on		Version	Remarks
-------------------------------------------------------------------------------

-----------------------------------------------------------------------------*/
AS
	PROCEDURE grab_session_info;
	PROCEDURE  kill_user_session(
									i_sid 		IN NUMBER
									,i_serno	IN NUMBER
									,i_Rks		IN VARCHAR2
								)
	;
END user_session_mgmt;

```
