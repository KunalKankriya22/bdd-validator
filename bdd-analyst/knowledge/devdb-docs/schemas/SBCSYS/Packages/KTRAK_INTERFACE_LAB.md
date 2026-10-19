---
tags:
  - package
  - SBCSYS
---
# KTRAK_INTERFACE_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "KTRAK_INTERFACE_LAB"
/*-----------------------------------------------------------------------------
PACKAGE		:	Knowledge Trak Interface for LAB Application
PURPOSE   	:	Interface to Knowlege Trak application
DEVELOPER 	:	Ashok Vardhan
DEV. DATE 	:	03 Feb 2012
NOTES     	:	Similar to KTrak_Interface.pkg for Donor - Only change is master_codes table. Error Codes used: 9400 to 9405
Ver       	:	01  -- Same as ver 03 for KTrak_Interface in Donor Package

Modification History
-------------------------------------------------------------------------------
Modified by	 |     on		|	   Version	  |  Remarks
-------------------------------------------------------------------------------
Ashok		 |  02/16/2012		|	 	02	  |	1) IM:6751--Sysdate converted to local date in get_KT_api_url;
-------------------------------------------------------------------------------
Ashok		 |  02/22/2012		|	 	03	  |	1) IM:6992 - KTRAK master code is under MASTR.  For donor it is under CODTP.
									2) Passing userid without 'OPS$' part to LIFETRACK_TIMEZONE_CONVERT.GET_CHAPTERid_DB;
-----------------------------------------------------------------------------*/
AUTHID CURRENT_USER
AS

SUBTYPE name_t IS VARCHAR2 (32767);
TYPE xml_nodes_t IS TABLE OF VARCHAR2(100) INDEX BY name_t;

PROCEDURE get_KT_api_url(
	cmd_name IN VARCHAR2,
	encoded_url OUT VARCHAR2,
	errcde OUT VARCHAR2,
	errmsg OUT VARCHAR2
 );

PROCEDURE get_url_response (
   p_url      IN    VARCHAR2,
   p_cmd      IN    VARCHAR2,
   url_resp   OUT   VARCHAR2,
   errcde     OUT   VARCHAR2,
   errmsg     OUT   VARCHAR2
);

PROCEDURE XML_PARSER(
	xmlpayload IN VARCHAR2,
	errcde	   OUT VARCHAR2,
	errmsg OUT VARCHAR2
);

FUNCTION get_xmlnode_value(
	node_name_in IN name_t
) RETURN VARCHAR2;

PROCEDURE call_api_cmd (
    in_cmd        IN    VARCHAR2,
    out_string    OUT   VARCHAR2,
    out_errcde	  OUT   VARCHAR2,
    out_errmsg	  OUT   VARCHAR2
);
END KTrak_Interface_Lab;

```
