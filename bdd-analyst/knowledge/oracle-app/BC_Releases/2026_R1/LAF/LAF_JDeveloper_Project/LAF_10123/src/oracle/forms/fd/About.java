package oracle.forms.fd;

import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;

import java.net.*;

import javax.swing.*;

/**
 * About box
 * 
 * @author   Francois Degrelle
 * creation  february 2007
 * @version  1.2
 * 
 */
public class

About extends JFrame {
    public About(Frame owner) {
        super("\"About\" Forms Look&Feel");
        AboutBox dlg = new AboutBox(owner);
        dlg.setSize(420, 240);
        StringBuffer sAutors = 
            new StringBuffer("<html><body><p style='font-familly: verdana; font-size: 14pt; color: #0064C8;'>");
        for (int z = 0; z < DrawLAF.AUTHORS.length; z++) {
            if (z > 0)
                sAutors.append("<br>");
            sAutors.append("&nbsp;").append(DrawLAF.AUTHORS[z]);
        }
        sAutors.append("</p></body></html>");
        ScrollPanel sp = new ScrollPanel(100, 30, 80, 70, 310, 80);
        sp.setBorderPanel("loweredbevel", Color.black, 1);
        sp.setPanelColor(DrawLAF.Current_Color_Light);
        //sp.setPanelOpaque(false);
        sp.setContent(sAutors.toString());
        sp.setLocation(80, 70);
        sp.setSize(new Dimension(310, 80));
        dlg.add(sp);
        sp.startTimer();
        dlg.setVisible(true);
    }

}

class AboutBox extends JDialog {
    private URL m_codeBase;
    private Image img;
    private String sJversion = 
        "JVM version " + System.getProperty("java.version");
    private String sBy = "by " + System.getProperty("java.vendor");

    public AboutBox(Frame owner) {

        super(owner, "About Forms' LAF", true);
        ImageIcon im = new ImageIcon(getClass().getResource("/target-64.gif"));
        img = im.getImage();
        this.getContentPane().setLayout(null);
        WindowListener wl = new WindowAdapter() {
                public void windowClosed(WindowEvent e) {
                    dispose();
                }
            };
        addWindowListener(wl);

        pack();
        setResizable(false);
        setLocationRelativeTo(owner);
    }

    public void paint(Graphics g) {
        float fX = 85f;
        int is = 25, ie = 50;
        Color c1 = Color.white;
        Color c2 = new Color(0, 100, 200);
        Graphics2D g2 = (Graphics2D)g;
        Rectangle r = this.getBounds();
        String s = "";
        GradientPaint gp = 
            new GradientPaint(0, 0, DrawLAF.Current_Color_Light, r.width, 0, 
                              DrawLAF.Current_Color);
        g2.setPaint(gp);
        g2.fill(new RoundRectangle2D.Double(0, 0, r.width, r.height, 5, 5));
        if (img != null)
            g2.drawImage(img, 10, 40, this);
        g2.setFont(new Font("Verdana", Font.BOLD, 16));

        g2.setColor(Color.red);
        s = "Forms Look and Feel";
        g2.drawString(s, fX - 1, 49f);
        g2.drawString(s, fX + 1, 49f);
        g2.drawString(s, fX - 2, 49f);
        g2.drawString(s, fX + 2, 49f);
        g2.drawString(s, fX - 1, 51f);
        g2.drawString(s, fX + 1, 51f);
        g2.drawString(s, fX - 2, 51f);
        g2.drawString(s, fX + 2, 51f);
        g2.setColor(Color.yellow);
        g2.drawString(s, fX, 50f);

        g2.setFont(new Font("Verdana", Font.BOLD, 14));
        s = "version : " + DrawLAF.VERSION;
        g2.setColor(c1);
        g2.drawString(s, fX - 1, 70f);
        g2.drawString(s, fX + 1, 70f);
        g2.drawString(s, fX - 1, 72f);
        g2.drawString(s, fX + 1, 72f);
        g2.setColor(c2);
        g2.drawString(s, fX, 71f);

        g2.setFont(new Font("Verdana", Font.BOLD, 14));
        s = "Authors : ";
        g2.setColor(c1);
        g2.drawString(s, fX - 1, 99f);
        g2.drawString(s, fX + 1, 99f);
        g2.drawString(s, fX - 1, 101f);
        g2.drawString(s, fX + 1, 101f);
        g2.setColor(c2);
        g2.drawString(s, fX, 100f);

        float iY = 200f;

        g2.setFont(new Font("Verdana", Font.BOLD, 12));

        s = sJversion;
        g2.setColor(c1);
        g2.drawString(s, fX - 1, iY);
        g2.drawString(s, fX + 1, iY);
        g2.drawString(s, fX - 1, iY + 2f);
        g2.drawString(s, fX + 1, iY + 2f);
        g2.setColor(c2);
        g2.drawString(s, fX, iY + 1f);
        iY += 20f;

        s = sBy;
        g2.setColor(c1);
        g2.drawString(s, fX - 1, iY);
        g2.drawString(s, fX + 1, iY);
        g2.drawString(s, fX - 1, iY + 2f);
        g2.drawString(s, fX + 1, iY + 2f);
        g2.setColor(c2);
        g2.drawString(s, fX, iY + 1f);
        iY += 20f;
    }

    public void update(Graphics g) {
        paint(g);
    }

}
