import sys
try:
    from PIL import Image
    import numpy as np
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "numpy"])
    from PIL import Image
    import numpy as np

img = Image.open('C:/Users/USER/.gemini/antigravity-ide/brain/34fd49f9-99f1-4bcc-8a77-02fac507183e/media__1788334321329.jpg').convert('RGBA')
data = np.array(img)

# White is roughly (230-255, 230-255, 230-255)
r, g, b, a = data.T
white_areas = (r >= 235) & (g >= 235) & (b >= 235)
data[..., :][white_areas.T] = (255, 255, 255, 0)

img2 = Image.fromarray(data)

# Find bounding box to crop the image nicely
bbox = img2.getbbox()
if bbox:
    img2 = img2.crop(bbox)

img2.save('c:/Users/USER/Desktop/study/public/logo.png')
print('Done removing background! Width:', img2.width, 'Height:', img2.height)
