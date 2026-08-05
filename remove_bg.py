import os
from rembg import remove

def remove_background(input_path, output_path):
    with open(input_path, 'rb') as i:
        input_data = i.read()
        output_data = remove(input_data)
        with open(output_path, 'wb') as o:
            o.write(output_data)

directory = r"s:\Rental_Tracking_System\public\equipment"

for filename in os.listdir(directory):
    if filename.endswith(".png"):
        input_path = os.path.join(directory, filename)
        print(f"Processing {filename}...")
        remove_background(input_path, input_path)

print("Done!")
