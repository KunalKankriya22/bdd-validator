---
tags:
  - package
  - DONSYS
---
# DON_INTER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_INTER IS

/*  ------------- Change History------------

 Ver: 02 - Modified by Kishore on 04/19/2011. IM 4903
 Ver: 03 - Modified by Hussein on 04/19/2011. 
 Ver: 04 - Modified by Kishore on 05/03/2011.5421
 Ver: 05 - Modified by Edwin   on 05/11/2011 Used Trunc in insert stmt.
 Ver: 06 - Modified by Ashok   on 05/17/2011 5326
 Ver: 07 - Modified By Edwin   on 05/23/2011 change sysdate to local dt
 Ver: 08 - Modified By Ashok   on 05/25/2011 IM:5654- release date
                modified to local dt instead of sysdate;
 Ver: 09 - Modified by Kishore on 08/13/2014. 
               SCR 20277 - Set "term_date" to "trunc(g_sysdate)" if the 
               interdictions type is either "INFOR" or "DR".

 Ver: 10 Modified by Edwin on 06/02/2015 for IM: 58 LT_2013 R3
 Ver: 11 Modified by Edwin on 12/04/15 for case# 175209
 Ver: 12 Modiifed by Edwin on 03/10/16 (IM:214 )
 Ver: 13 Ashok  09/20/2017 IM 579
------------------------------------------------ */

   PROCEDURE compute_term_date
                        (p_sysdate              IN      date,
                         p_fixed_period         IN      varchar2,
                         p_period_type          IN      varchar2,
                         p_period_number        IN      number,
                         p_minimum_period       IN      number,
                         p_incident_date        IN      date,
                         p_term_date            IN      date,
                         p_final_term_date      OUT     date,
                         p_status               OUT     varchar2
                         );
   FUNCTION compute_max_date
                        (date1      IN       date,
                         date2      IN       date ) RETURN date;
   PROCEDURE generate_note 
                        (p_comments             IN      varchar2,
                         p_chapter_id           IN      varchar2,
                         p_program_id           IN      varchar2,
                         p_user_id              IN      varchar2,
                         p_note_id              IN OUT  varchar2,
                         p_status               OUT     varchar2
                         );
   PROCEDURE validate_parameters
                        (p_donor_id             IN      varchar2,
                         p_chapter_id           IN      varchar2,
                         p_inter_code           IN      varchar2,
                         p_user_id              IN      varchar2,
                         p_program_id           IN      varchar2,
                         p_incident_date        IN      date,
                         p_status               OUT     varchar2
                         );
 PROCEDURE INSERT_IN_DONOR_INTER(
                                 l_DONOR_ID            IN   VARCHAR2,
                                 l_CHAPTER_ID          IN   VARCHAR2,
                                 l_INTER_CODE          IN   VARCHAR2,
                                 l_EFF_DATE            IN   DATE,
                                 l_INTER_TYPE          IN   VARCHAR2,
                                 l_TRANSACTION_ID      IN   VARCHAR2,
                                 l_NOTIFICATION_STATUS IN   VARCHAR2,
                                 l_comments            IN   VARCHAR2 , --NOTE_ID
                                 l_UNIT_ID             IN   VARCHAR2 ,
                                 l_UPM_DISPOSITION     IN   VARCHAR2,
                                 l_ORIGINATED_FROM     IN   VARCHAR2 ,
                                 l_REASON_CODE         IN   VARCHAR2 ,       
                                 l_GROUP_ID            IN   VARCHAR2,
                                 l_LETTER_SEQ_NO       IN   VARCHAR2 ,
                                 l_GROUP_MODE          IN   VARCHAR2,       
                                 l_TERM_DATE           IN   DATE,
                                 l_PROGRAM_ID          IN   VARCHAR2,          
                                 l_INSERT_DATE         IN   DATE,
                                 l_INSERT_USER         IN   VARCHAR2 ,
                                 out_note_id           OUT  VARCHAR2,  
                                 ret_stat              OUT  VARCHAR2);

 PROCEDURE INSERT_IN_INTER_TRAN(
                                 l_DONOR_ID            IN   VARCHAR2,
                                 l_CHAPTER_ID          IN   VARCHAR2,
                                 l_INTER_CODE          IN   VARCHAR2,
                                 l_EFF_DATE            IN   DATE,
                                 l_INTER_TYPE          IN   VARCHAR2,
                                 l_TRANSACTION_ID      IN   VARCHAR2,
                                 l_NOTIFICATION_STATUS IN   VARCHAR2,
                                 l_note_id             IN   VARCHAR2 , --NOTE_ID
                                 l_UNIT_ID             IN   VARCHAR2 ,
                                 l_UPM_DISPOSITION     IN   VARCHAR2,
                                 l_ORIGINATED_FROM     IN   VARCHAR2 ,
                                 l_REASON_CODE         IN   VARCHAR2 ,       
                                 l_GROUP_ID            IN   VARCHAR2,
                                 l_LETTER_SEQ_NO       IN   VARCHAR2 ,
                                 l_GROUP_MODE          IN   VARCHAR2,       
                                 l_TERM_DATE           IN   DATE,
                                 l_PROGRAM_ID          IN   VARCHAR2,          
                                 l_INSERT_DATE         IN   DATE,
                                 l_INSERT_USER         IN   VARCHAR2 ,
                                 ret_stat              OUT   VARCHAR2);

  PROCEDURE inter_temp_place(
                            p_sysdate             IN              date,
                            p_DONOR_ID            IN              VARCHAR2,
                            p_CHAPTER_ID          IN              VARCHAR2,
                            p_RUN_ID              IN              VARCHAR2,
                            p_INTER_CODE          IN              VARCHAR2,
                            p_TRANSACTION_ID      IN              VARCHAR2,
                            p_NOTIFICATION_STATUS IN              VARCHAR2,
                            p_NOTE_ID             IN              VARCHAR2,
                            p_RELEASE_USER        IN              VARCHAR2,
                            p_RELEASE_DATE        IN              DATE,
                            p_INTER_TYPE          IN              VARCHAR2,
                            p_UNIT_ID             IN              VARCHAR2,
                            p_UPM_DISPOSITION     IN              VARCHAR2,
                            p_LAST_MODIFIED_DATE  IN              DATE,
                            p_ORIGINATED_FROM     IN              VARCHAR2,
                            p_REASON_CODE         IN              VARCHAR2,
                            p_GROUP_ID            IN              VARCHAR2,
                            p_GROUP_MODE          IN              VARCHAR2,
                            p_EFF_DATE            IN              DATE,
                            p_TERM_DATE           IN              DATE,
                            p_TERM_REASON         IN              VARCHAR2,
                            p_PROGRAM_ID          IN              VARCHAR2,
                            p_INSERT_DATE         IN              DATE,
                            p_INSERT_USER         IN              VARCHAR2,
                            p_status             OUT              varchar2
                           );
   PROCEDURE inter_upgrade_place
                        (P_DONOR_ID             IN      VARCHAR2,
                         p_CHAPTER_ID           IN      VARCHAR2,
                         P_UNIT_ID              IN      VARCHAR2,
                         P_TRANSACTION_ID       IN      VARCHAR2,
                         P_INTER_CODE           IN      VARCHAR2,
                         P_ORIGINATED_FROM      IN      VARCHAR2,
                         P_REASON_CODE          IN      VARCHAR2,
                         P_USER_ID              IN      VARCHAR2,
                         P_GROUP_MODE           IN      VARCHAR2,
                         P_GROUP_ID             IN      VARCHAR2,   
                         P_PROGRAM_ID           IN      VARCHAR2 ,  
                         P_INCIDENT_DATE        IN      DATE   ,  
                         P_TERM_DATE            IN      DATE   , 
                         P_COMMENTS             IN      VARCHAR2 ,
                         P_STATUS               OUT     VARCHAR2
                         );
 PROCEDURE inter_upgrade_remove
                (
                  p_DONOR_ID          IN               VARCHAR2,
                  p_CHAPTER_ID        IN               VARCHAR2,   
                  P_UNIT_ID           IN               VARCHAR2,
                  P_TRANSACTION_ID    IN               VARCHAR2,
                  P_INTER_CODE        IN               VARCHAR2,
                  P_ORIGINATED_FROM   IN               VARCHAR2,
                  P_REASON_CODE       IN               VARCHAR2,
                  P_USER_ID           IN               VARCHAR2,
                  P_GROUP_MODE        IN               VARCHAR2,
                  P_GROUP_ID          IN               VARCHAR2,
                  P_PROGRAM_ID        IN               VARCHAR2,
                  P_INCIDENT_DATE     IN               DATE,
                  P_INSERT_DATE       IN OUT           DATE,
                  P_TERM_DATE         IN               DATE,
                  P_TERM_REASON       IN               VARCHAR2,
                  P_COMMENTS          IN               VARCHAR2,
                  P_STATUS            OUT              VARCHAR2
                        );
PROCEDURE place_inter_unit 
                (
                p_unit_id               IN      VARCHAR2,
                p_deferral_id           IN      VARCHAR2,
                p_coll_date             IN      date,
                p_chapter_id            IN      varchar2,
                p_transaction_id        IN      VARCHAR2,
                p_inter_code            IN      VARCHAR2,
                p_originated_from       IN      VARCHAR2,
                p_reason_code           IN      VARCHAR2,
                p_source_code           IN      varchar2,
                p_user_id               IN      varchar2,
                p_group_mode            IN      varchar2,
                p_group_id              IN      VARCHAR2,
                p_program_id            IN      VARCHAR2,
                p_incident_date         IN      DATE,
                p_term_date             IN      DATE,
                p_status                OUT     VARCHAR2,
                p_comment               IN      VARCHAR2 := ' ' ) ;

PROCEDURE remove_inter_unit
                (
                p_unit_id               IN      VARCHAR2,
                p_deferral_id           IN      VARCHAR2,
                p_coll_date             IN      date,
                p_chapter_id            IN      varchar2,
                p_transaction_id        IN      VARCHAR2,
                p_inter_code            IN      VARCHAR2,
                p_originated_from       IN      VARCHAR2,
                p_reason_code           IN      VARCHAR2,
                p_source_code           IN      VARCHAR2,
                p_user_id               IN      varchar2,
                p_group_mode            IN      varchar2,
                p_group_id              IN      VARCHAR2,
                p_program_id            IN      VARCHAR2,
                p_incident_date         IN      DATE,
                p_term_date             IN      DATE,
                p_term_reason           IN      varchar2,
                p_status                OUT     VARCHAR2) ;

v_local_sysdate		DATE; -- Added by Kishore on 05/03/2011. IM 5421
v_timezone_active	VARCHAR2(1); -- Added by Kishore on 05/03/2011. IM 5421
END DON_INTER;
```
