CREATE OR REPLACE FORCE EDITIONABLE VIEW "UTIL"."USER_MENU" ( "APPL_ID",
"FCN_ID",
"MENU_ID",
"DESCRIP",
"SEQUENCE",
"ACC_LVL",
"P1_VALUE",
"P2_VALUE",
"P3_VALUE",
"MNEMONIC",
"ITEM_HIDE",
"FCN_TYPE",
"EXEC_NAME",
"HOST_CMD",
"P1_NAME",
"P2_NAME",
"P3_NAME",
"REMARKS",
"USER_ID" ) AS
    SELECT
        mi.appl_id,
        mi.fcn_id,
        mi.menu_id,
        mi.descrip,
        mi.sequence,
        mi.acc_lvl,
        mi.p1_value,
        mi.p2_value,
        mi.p3_value,
        mi.mnemonic,
        mi.item_hide,
        fcn.fcn_type,
        fcn.exec_name,
        fcn.host_cmd,
        fcn.p1_name,
        fcn.p2_name,
        fcn.p3_name,
        nvl(mi.remarks, fcn.remarks) remarks,
        fgp.user_id
    FROM
        menu_item    mi,
        menu_item    mmi,
        fcn,
        fcn_grp_priv fgp
    WHERE
            fcn.fcn_id = mi.fcn_id
        AND fcn.appl_id = mi.appl_id
        AND mmi.appl_id (+) = mi.appl_id
        AND mmi.fcn_id (+) = mi.menu_id
        AND fgp.appl_id = mi.appl_id
        AND nvl(substr(mi.acc_lvl,
                       TO_NUMBER(substr(fgp.grp_id, 4, 2)) + 1,
                       1),
                '9') <= to_char(fgp.acc_priv)
        AND substr(mi.acc_lvl,
                   TO_NUMBER(substr(fgp.grp_id, 4, 2)) + 1,
                   1) NOT IN ( '0', ' ' )
        AND fgp.user_id = lt_user_session.get_userid
        AND nvl(mi.item_hide, 'N') != 'Y'
        AND to_char(fgp.acc_priv) >= (
            SELECT
                nvl(MAX(TO_NUMBER(nvl(decode(substr(pi.acc_lvl,
                                                    TO_NUMBER(substr(fgp.grp_id, 4, 2)) + 1,
                                                    1),
                                             ' ',
                                             '10',
                                             '0',
                                             '10',
                                             substr(pi.acc_lvl,
                                                    TO_NUMBER(substr(fgp.grp_id, 4, 2)) + 1,
                                                    1)),
                                      '10'))),
                    1)
            FROM
                menu_item pi
            WHERE
                pi.appl_id = mi.appl_id
            CONNECT BY
                pi.fcn_id = PRIOR menu_id
            START WITH pi.mnemonic = mmi.mnemonic
        );

GRANT DELETE ON "UTIL"."USER_MENU" TO "DONSYS";

GRANT DELETE ON "UTIL"."USER_MENU" TO "LTAPI";

GRANT DELETE ON "UTIL"."USER_MENU" TO "LTWEB";

GRANT DELETE ON "UTIL"."USER_MENU" TO "SBCSYS";

GRANT DELETE ON "UTIL"."USER_MENU" TO "SRVSYS";

GRANT DELETE ON "UTIL"."USER_MENU" TO "VISTA";

GRANT DELETE ON "UTIL"."USER_MENU" TO "DBADMN";

GRANT DELETE ON "UTIL"."USER_MENU" TO "LTRAK_ROLE";

GRANT INSERT ON "UTIL"."USER_MENU" TO "DONSYS";

GRANT INSERT ON "UTIL"."USER_MENU" TO "LTAPI";

GRANT INSERT ON "UTIL"."USER_MENU" TO "LTWEB";

GRANT INSERT ON "UTIL"."USER_MENU" TO "SBCSYS";

GRANT INSERT ON "UTIL"."USER_MENU" TO "SRVSYS";

GRANT INSERT ON "UTIL"."USER_MENU" TO "VISTA";

GRANT INSERT ON "UTIL"."USER_MENU" TO "DBADMN";

GRANT INSERT ON "UTIL"."USER_MENU" TO "LTRAK_ROLE";

GRANT SELECT ON "UTIL"."USER_MENU" TO "DONSYS";

GRANT SELECT ON "UTIL"."USER_MENU" TO "LTAPI";

GRANT SELECT ON "UTIL"."USER_MENU" TO "LTWEB";

GRANT SELECT ON "UTIL"."USER_MENU" TO "SBCSYS";

GRANT SELECT ON "UTIL"."USER_MENU" TO "SRVSYS";

GRANT SELECT ON "UTIL"."USER_MENU" TO "VISTA";

GRANT SELECT ON "UTIL"."USER_MENU" TO "DBADMN";

GRANT SELECT ON "UTIL"."USER_MENU" TO "LTRAK_ROLE";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "DONSYS";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "LTAPI";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "LTWEB";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "SBCSYS";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "SRVSYS";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "VISTA";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "DBADMN";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "LTRAK_ROLE";

GRANT UPDATE ON "UTIL"."USER_MENU" TO "BLOODC_ROLE";

GRANT SELECT ON "UTIL"."USER_MENU" TO "BLOODC_ROLE";

GRANT INSERT ON "UTIL"."USER_MENU" TO "BLOODC_ROLE";

GRANT DELETE ON "UTIL"."USER_MENU" TO "BLOODC_ROLE";