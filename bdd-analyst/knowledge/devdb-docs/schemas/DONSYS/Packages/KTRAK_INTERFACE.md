---
tags:
  - package
  - DONSYS
---
# KTRAK_INTERFACE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "KTRAK_INTERFACE"
/*-----------------------------------------------------------------------------
PACKAGE		:	Knowledge Trak Interface
PURPOSE   	:	Interface to Knowlege Trak application
DEVELOPER 	:	Ashok Vardhan
DEV. DATE 	:	22 Dec 2011
NOTES     	:	Initial version.
Ver       	:	01

Modification History
-------------------------------------------------------------------------------
Modified by	 |     on	  |	   Version	  |  Remarks
-------------------------------------------------------------------------------
Ashok		 |  01/18/2012	  |	 	02	  |	1) xml_nodes_t type modified to table of varchar2(100) from Number.
			 				  				  	   (xml string can have string like "Invalid User ID");
												2) get_xmlnode_value (spec and body) function return value modified to varchar2 from pls_integer.
												3) call_api_cmd procedure -  variables api_url and xml_string size increased to VARCHAR2(4000);
												4) xml_parser procedure - variable node_value datatype modified to varchar2 from pls_interger.
												5) get_url_response procedure - Code added to handle errors like -
												   "You do not have permission to view this directory or page using the credentials you supplied"
												6) get_url_response procedure - v_msg varchar2 size increased to 4000 from 80.
-------------------------------------------------------------------------------
Ashok		 |  02/03/2012	  |	 	03	  |	1) Error Codes range 24000-24005 moved to 9400-9405;
-------------------------------------------------------------------------------
Ashok		 |  02/16/2012	  |	 	04	  |	1) IM:6751--Sysdate converted to local date in get_KT_api_url;
-------------------------------------------------------------------------------
Ashok		 |  06/03/2024	  |	 	05	  |	1) MLT-6882 (use wallet if ssl is enabled) - QC integration.
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
END KTrak_Interface;


```
