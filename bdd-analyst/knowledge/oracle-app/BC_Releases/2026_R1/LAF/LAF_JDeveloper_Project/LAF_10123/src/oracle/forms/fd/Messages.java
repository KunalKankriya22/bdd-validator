package oracle.forms.fd;
    
    /**
     * Class that stores event message information
     * 
     * @author   Francois Degrelle
     * creation  february 2007
     * @version  1.0
     * 
     */
public class Messages extends Object {

    public oracle.forms.properties.ID Id ;
    public String sValue= "" ;
     
    public Messages ( oracle.forms.properties.ID p, String s )

  {
     this .Id    = p ;
     this.sValue = s ;
  }
}