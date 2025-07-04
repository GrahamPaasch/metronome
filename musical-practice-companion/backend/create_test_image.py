#!/usr/bin/env python3
"""
Create a simple test sheet music image for testing the OMR system.
"""

from PIL import Image, ImageDraw
import sys

def create_sheet_music_image():
    """Create a simple sheet music image"""
    # Create a white canvas
    img = Image.new('RGB', (800, 600), 'white')
    draw = ImageDraw.Draw(img)
    
    # Title
    # Note: Since we don't have font files, we'll skip text and focus on musical elements
    
    # Draw staff lines (5 lines)
    staff_top = 150
    line_spacing = 25
    staff_left = 50
    staff_right = 750
    
    for i in range(5):
        y = staff_top + i * line_spacing
        draw.line([(staff_left, y), (staff_right, y)], fill='black', width=2)
    
    # Draw treble clef (simplified circle with a line)
    clef_x = 80
    clef_y = staff_top + 2 * line_spacing
    draw.ellipse([clef_x-15, clef_y-40, clef_x+15, clef_y+20], outline='black', width=3)
    draw.line([(clef_x+15, clef_y-30), (clef_x+15, clef_y+50)], fill='black', width=3)
    
    # Draw time signature (4/4) - simplified as rectangles
    time_x = 130
    # "4" on top
    draw.rectangle([time_x, staff_top, time_x+20, staff_top+40], outline='black', width=2)
    # "4" on bottom  
    draw.rectangle([time_x, staff_top+60, time_x+20, staff_top+100], outline='black', width=2)
    
    # Draw some note heads and stems
    notes = [
        (200, staff_top + 2*line_spacing),  # C (middle line)
        (260, staff_top + 1*line_spacing),  # E (second space)
        (320, staff_top + 0*line_spacing),  # G (top line)
        (380, staff_top + 1*line_spacing),  # E
        (440, staff_top + 2*line_spacing),  # C
        (500, staff_top + 3*line_spacing),  # A (third line)
        (560, staff_top + 4*line_spacing),  # F (bottom line)
        (620, staff_top + 2*line_spacing),  # C
    ]
    
    for x, y in notes:
        # Note head (filled circle)
        draw.ellipse([x-8, y-4, x+8, y+4], fill='black')
        # Stem (if not on middle line, add stem)
        if y != staff_top + 2*line_spacing:
            if y < staff_top + 2*line_spacing:  # Notes above middle line
                draw.line([(x+8, y), (x+8, y+40)], fill='black', width=2)
            else:  # Notes below middle line
                draw.line([(x-8, y), (x-8, y-40)], fill='black', width=2)
    
    # Draw bar lines
    bar_positions = [180, 340, 500, 660]
    for x in bar_positions:
        draw.line([(x, staff_top), (x, staff_top + 4*line_spacing)], fill='black', width=2)
    
    # Draw double bar line at the end
    end_x = 700
    draw.line([(end_x, staff_top), (end_x, staff_top + 4*line_spacing)], fill='black', width=3)
    draw.line([(end_x+5, staff_top), (end_x+5, staff_top + 4*line_spacing)], fill='black', width=3)
    
    # Add some chord symbols above the staff (simplified as rectangles)
    chord_positions = [(200, staff_top-40), (340, staff_top-40), (500, staff_top-40)]
    for x, y in chord_positions:
        draw.rectangle([x-10, y-10, x+30, y+10], outline='black', width=1)
    
    return img

def main():
    """Create and save test image"""
    print("Creating test sheet music image...")
    
    img = create_sheet_music_image()
    
    # Save the image
    output_path = "test_sheet_music.png"
    img.save(output_path, "PNG")
    
    print(f"Test sheet music saved as: {output_path}")
    print("You can now upload this file to test the OMR system!")

if __name__ == "__main__":
    main()
