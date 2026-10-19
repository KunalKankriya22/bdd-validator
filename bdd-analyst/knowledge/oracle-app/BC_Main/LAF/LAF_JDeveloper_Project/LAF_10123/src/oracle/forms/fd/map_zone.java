package oracle.forms.fd;

import java.awt.Polygon;
import java.awt.Rectangle;

public class map_zone
{
  public int       x=0, y=0, w=0, h=0;
  public int       iHits, iType ;
  public String    name ;
  public String    url;
  public Polygon   p;
  public Rectangle r;
  public map_zone(Polygon p, String sName, String sUrl, Rectangle r)
  {
    this.p     = p ;
    this.name  = sName ;
    this.url   = sUrl ;    
    this.r     = r ;    
  }
  public map_zone()
  {
    this.p     = null ;
    this.name  = "" ;
    this.url   = "" ;    
    this.r     = new Rectangle(0,0,0,0);
  }  
}