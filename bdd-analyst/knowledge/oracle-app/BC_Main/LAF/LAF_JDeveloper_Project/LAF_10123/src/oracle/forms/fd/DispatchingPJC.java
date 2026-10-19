package oracle.forms.fd;
 
import oracle.forms.ui.VTextArea;

  
 /**
  * DispatchingPJC<br />
  * This PJC will call the dispatch function on the DispatchingBean<br />
  * when a PJC property is set, however it can be used in any possible case..
  * <br /> 
  * This method can be used to workaround that dispatching cannot
  * be done using PJCs
  * 
  * @author   Tom Cleymans
  */
  
public class DispatchingPJC extends VTextArea
{
   
   //public DispatchingBean dBean;
   public DrawLAF dBean;

   public DispatchingPJC()
   {
   }

}