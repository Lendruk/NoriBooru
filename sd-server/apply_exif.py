from PIL.PngImagePlugin import PngInfo
from PIL import Image
from io import BytesIO
import json

def apply_exif_to_image(image, positive_prompt, negative_prompt, width, height, model, sampler, seed, steps, cfg_scale):
    # Create a PngInfo object for metadata
    metadata = PngInfo()

    # Add simple tEXt metadata (compatible with exifreader)
    gen_info = {
        "positive_prompt": positive_prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "model": model,
        "sampler": sampler,
        "seed": seed,
        "steps": steps,
        "cfg_scale": cfg_scale
    }

    gen_info_json = json.dumps(gen_info)
    metadata.add_text("GenerationInfo", gen_info_json)
    # Save the image with metadata to a temporary file
    output_buffer = BytesIO()
    image.save(output_buffer, format="PNG", pnginfo=metadata)

    # Load the saved image back to return as a PIL Image
    output_buffer.seek(0)

    return output_buffer