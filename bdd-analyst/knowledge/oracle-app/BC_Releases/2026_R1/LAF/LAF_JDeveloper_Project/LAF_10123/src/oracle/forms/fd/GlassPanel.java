package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.LayoutManager;

import javax.swing.JPanel;


public class GlassPanel extends JPanel {
    private Color cBG = Color.black;
    private float fTrsp = 0.0f;
    
    public GlassPanel() {
        super();
        this.setBorder(null);
        this.setBackground(null);
        this.setOpaque(false);
    }

    public GlassPanel(boolean b) {
        super(b);
    }

    public GlassPanel(LayoutManager layoutManager) {
        super(layoutManager);
    }

    public GlassPanel(LayoutManager layoutManager, boolean b) {
        super(layoutManager, b);
    }
    
    protected void setBGColor(Color c){
        cBG = c ;
    }
    
    protected void setTrspFactor(float f){
        if(f >= 0.0f && (f <= 1.0)) {
            fTrsp = f ;
        }
    }   
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);       
        Graphics2D g2 = (Graphics2D) g.create() ;        
        g2.setColor(cBG);
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fTrsp));        
        g2.fillRect(0,0,this.getBounds().width,this.getBounds().height);
        g2.dispose();
    }
}
