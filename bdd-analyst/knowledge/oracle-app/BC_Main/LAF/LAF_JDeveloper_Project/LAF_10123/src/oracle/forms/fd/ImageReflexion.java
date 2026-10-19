package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GraphicsConfiguration;
import java.awt.GraphicsEnvironment;
import java.awt.Image;
import java.awt.Paint;
import java.awt.image.BufferedImage;

public class ImageReflexion {
    public ImageReflexion() {
    }
    
    /*--------------------------------------------*
     *   Reflection Image
     *   Thank to Romain Guy for this great code
     *   (from the Filthy Rich Clients book)
     *--------------------------------------------*/
    public BufferedImage createReflection(BufferedImage image) {
            int height = image.getHeight();
            
            BufferedImage result = new BufferedImage(image.getWidth(), height * 2,
                    BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2 = result.createGraphics();
            
             // Paints original image
            g2.drawImage(image, 0, 0, null);
            
            // Paints mirrored image
            g2.scale(1.0, -1.0);
            g2.drawImage(image, 0, -height - height, null);
            g2.scale(1.0, -1.0);

            // Move to the origin of the clone
            g2.translate(0, height);
            
            // Creates the alpha mask
            GradientPaint mask;
            mask = new GradientPaint(0, 0, new Color(1.0f, 1.0f, 1.0f, 0.5f),
                    0, height / 2, new Color(1.0f, 1.0f, 1.0f, 0.0f));
            Paint oldPaint = g2.getPaint();
            g2.setPaint(mask);
            
            // Sets the alpha composite
            g2.setComposite(AlphaComposite.DstIn);
            
            // Paints the mask
            g2.fillRect(0, 0, image.getWidth(), height);
     
            g2.dispose();
            return result;
        }
        
    public BufferedImage buildBufferedImage(Image image) {
       int w = image.getWidth(null);
       int h = image.getHeight(null);
       GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
       GraphicsConfiguration gc = ge.getDefaultScreenDevice().getDefaultConfiguration();

       BufferedImage bImg = gc.createCompatibleImage(w,h);
       Graphics g = bImg.getGraphics();
       g.drawImage(image, 0, 0, null);
       g.dispose();
       return bImg ;
    }

    
}
