

"""
🎯 PWA Icon Generator for Habit Tracker
Generates all required icon sizes from emoji
"""

from PIL import Image ,ImageDraw ,ImageFont 
import os 

def create_icon (size ,output_path ):
    """Create a single icon with gradient and emoji"""

    img =Image .new ('RGB',(size ,size ))
    draw =ImageDraw .Draw (img )


    for y in range (size ):
        ratio =y /size 
        r =int (102 +(118 -102 )*ratio )
        g =int (126 +(75 -126 )*ratio )
        b =int (234 +(162 -234 )*ratio )
        draw .rectangle ([(0 ,y ),(size ,y +1 )],fill =(r ,g ,b ))


    try :

        font_size =int (size *0.6 )
        font =ImageFont .truetype ("seguiemj.ttf",font_size )
    except :
        try :

            font =ImageFont .truetype ("arial.ttf",int (size *0.5 ))
        except :

            font =ImageFont .load_default ()


    text ="🎯"


    bbox =draw .textbbox ((0 ,0 ),text ,font =font )
    text_width =bbox [2 ]-bbox [0 ]
    text_height =bbox [3 ]-bbox [1 ]


    x =(size -text_width )//2 -bbox [0 ]
    y =(size -text_height )//2 -bbox [1 ]


    draw .text ((x +2 ,y +2 ),text ,font =font ,fill =(0 ,0 ,0 ,128 ))
    draw .text ((x ,y ),text ,font =font ,fill =(255 ,255 ,255 ))


    img .save (output_path ,'PNG',optimize =True )
    print (f"✅ Created {output_path }")

def main ():
    """Generate all icon sizes"""
    print ("🎯 Generating PWA Icons...")
    print ("="*50 )


    icons_dir =os .path .join (os .path .dirname (__file__ ),'icons')
    os .makedirs (icons_dir ,exist_ok =True )


    sizes =[72 ,96 ,128 ,144 ,152 ,192 ,384 ,512 ]

    for size in sizes :
        output_path =os .path .join (icons_dir ,f'icon-{size }.png')
        create_icon (size ,output_path )

    print ("="*50 )
    print (f"✅ All {len (sizes )} icons generated successfully!")
    print (f"📁 Location: {icons_dir }")
    print ("\n🚀 Your PWA is now ready to install!")

if __name__ =='__main__':
    main ()
