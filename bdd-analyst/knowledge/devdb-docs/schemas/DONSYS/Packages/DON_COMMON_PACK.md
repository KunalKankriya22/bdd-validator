---
tags:
  - package
  - DONSYS
---
# DON_COMMON_PACK

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- [[schemas/DONSYS/Tables/VALID_LETTERS|VALID_LETTERS]] (TABLE)

## Package Specification

```plsql
PACKAGE              "DON_COMMON_PACK" IS

TYPE tblLetterId IS TABLE OF valid_letters.letter_id%TYPE
     INDEX BY BINARY_INTEGER;
  FUNCTION IS_ACCESS_ALLOWED(c_user_id varchar2,c_code_type varchar2,c_code varchar2) RETURN BOOLEAN  ;
  FUNCTION IS_ACCESS_ALLOWED_0OR1(c_user_id varchar2,c_code_type varchar2,c_code varchar2) RETURN NUMBER  ;
  PROCEDURE GENERATE_NEW_ID (PARAM_ID_TYPE IN VARCHAR2,
                           NEW_ID OUT VARCHAR2,
                           ERR_FLAG OUT VARCHAR2,
                           ERR_MSG OUT VARCHAR2) ;
  FUNCTION RPT_VALIDATE(LOC_REF_TABLE  in  VARCHAR2,
                        LOC_REF_COLUMN in VARCHAR2,
                        LOC_PARM_SELECT in VARCHAR2,
                        LOC_WILDCARD_IND  in VARCHAR2) RETURN varchar2 ;
  PROCEDURE write_user_error(
                           p_INSERT_DATS         IN     DATE,
                           p_USER_ID             IN     VARCHAR2,
                           p_PROGRAM_NAME        IN     VARCHAR2,
                           p_ERROR_CODE          IN     VARCHAR2,
                           p_UNIT_ID             IN     VARCHAR2,
                           p_COLL_DATE           IN     DATE,
                           p_CHAPTER_ID          IN     VARCHAR2,
                           p_COMPONENT_PREFIX    IN     NUMBER,
                           p_PRODUCT_CODE        IN     VARCHAR2,
                           p_status             OUT     varchar2) ;
   PROCEDURE edit_letter( psaLetterId   in  tblLetterId,
                          pnCount       in  number := 0,
                          psSearch      in  varchar2,
                          psReplace     in  varchar2,
                          psErrorNo     out varchar2,
                          psErrorMsg    out varchar2 );

   FUNCTION user_name_for_sorting ( p_user_id IN VARCHAR2 ) RETURN VARCHAR2 ;
   PRAGMA RESTRICT_REFERENCES(user_name_for_sorting, WNDS,WNPS);

--PRAGMA RESTRICT_REFERENCES(is_access_allowed,WNDS,WNPS);
PRAGMA RESTRICT_REFERENCES(is_access_allowed_0or1,WNDS,WNPS);

END DON_COMMON_PACK ;

```
