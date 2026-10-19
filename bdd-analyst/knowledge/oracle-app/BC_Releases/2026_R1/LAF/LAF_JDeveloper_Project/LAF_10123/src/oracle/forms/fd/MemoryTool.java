package oracle.forms.fd;

public class MemoryTool {
    public MemoryTool() {
    }
    
   /*-----------------------------------*
    *  get and print the system memory
    *-----------------------------------*/
   public void printMemory(String sClassname, String sText)
   {
      int i ;
      long lTotalMemory   = Runtime.getRuntime().totalMemory() ;
      long lFreeMemory    = Runtime.getRuntime().freeMemory() ;
      long lUsedMemory    = lTotalMemory - lFreeMemory ;
    
      System.out.println("*------- L&F Java memory report [" + sText + "] -------*") ;
      System.out.println("*----------> " + sClassname+"  total: " + lTotalMemory+ "  used: " + lUsedMemory + "   free:"+lFreeMemory);
      /*
      System.out.println("  total memory\t" + lTotalMemory);
      System.out.println("  used memory\t"  + lUsedMemory);
      System.out.println("  free memory\t"  + lFreeMemory);      
      */
   }
   
}

