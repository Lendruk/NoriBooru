import os
import sys

auth_key = sys.argv[1]
port = 5000

if len(sys.argv) > 2:
    port = int(sys.argv[2])
    print(f"Using port {port} from command line argument")


base_storage_path = sys.argv[3] if len(sys.argv) > 3 else '../sd-server/.cache'
checkpoint_path = base_storage_path + '/checkpoints/'
lora_path = base_storage_path + '/loras/'
huggingface_path = base_storage_path + '/huggingface/'

# Setting the cache directory for Hugging Face before importing diffusers
os.environ["HF_HOME"] = huggingface_path
from flask import Flask, request, jsonify
from diffusers import EulerAncestralDiscreteScheduler, StableDiffusionXLPipeline, EulerDiscreteScheduler, HeunDiscreteScheduler, UniPCMultistepScheduler, DPMSolverMultistepScheduler, DDIMScheduler
import torch
from io import BytesIO
import base64
from typing import cast
from diffusers.pipelines.stable_diffusion.convert_from_ckpt import download_from_original_stable_diffusion_ckpt

app = Flask('sd-client')
loaded_models_dict = {}

available_schedulers = {
    'ddim': { 
        'name': 'DDIM',
        'description': 'Deterministic and relatively fast\nGood balance between speed and quality'
    },
    'dpm_solver_multistep': {
        'name': 'DPM Solver Multistep',
        'description': 'Very fast and high-quality\nOne of the most commonly used schedulers for SDXL'
    },
    'euler_discrete': {
        'name': 'Euler Discrete',
        'description': 'Often preferred for artistic generations'
    },
    'euler_ancestral': {
        'name': 'Euler Ancestral',
        'description': 'Can yield more diverse outputs'
    },
    'heun_discrete_scheduler': {
        'name': 'Heun Discrete',
        'description': 'Similar to Euler with minor differences in trajectory computation'
    },
    'uni_pc_multistep': {
        'name': 'UniPC Multistep',
        'description': 'Good for high-quality generations'
    }
}

@app.route('/sd/schedulers', methods=['GET'])
def get_schedulers():
    return jsonify(available_schedulers)

@app.route('/sd/text2img', methods=['POST'])
def text2img():
    result_images = []
    if request.headers.get('Authorization') != auth_key:
        return jsonify(error='Unauthorized'), 401
    data = request.get_json()
    if not data:
        return jsonify(error='No body'), 400
    
    positive_prompt = data['positive_prompt']
    negative_prompt = data['negative_prompt']
    sd_model = os.path.expanduser(data['model'])
    steps = data['steps']
    width = data['width']
    height = data['height']
    seed = data['seed']
    loras = data['loras']
    cfg_scale = data.get('cfg_scale', 7.5)
    scheduler = data.get('scheduler', 'euler_ancestral')
    iterations = data.get('iterations', 1)
    print(f"Received model: {sd_model}")

    if not all([sd_model, steps, width, height, seed]):
        return jsonify(error='Bad Request'), 400

    try:
        # Load the model
        if sd_model in loaded_models_dict:
            print(f"Model {sd_model} already loaded, using cached version.")
            pipe = loaded_models_dict[sd_model]
        elif sd_model.lower().endswith('.safetensors'):
            # Extract the model name from the path
            model_name = os.path.basename(sd_model).replace('.safetensors', '')
            if not os.path.exists(checkpoint_path + model_name):
                print("Converting safetensors to original checkpoint format...")
                result = download_from_original_stable_diffusion_ckpt(
                    checkpoint_path_or_dict=sd_model,
                    safety_checker=None,
                    local_files_only=False,
                    load_safety_checker=False,
                    from_safetensors=True,
                    # use_peft_backend=True,
                    original_config_file='../sd-server/sd_xl_base.yaml'
                    # original_config_file='./v1-inference.yaml'
                )
                result.save_pretrained(checkpoint_path + model_name)
            print(f"Loading model from {sd_model}")
            model_path = checkpoint_path + model_name
            pipe: StableDiffusionXLPipeline  = StableDiffusionXLPipeline.from_pretrained(model_path, torch_dtype=torch.float16, use_safetensors=True, safety_checker=None)
            loaded_models_dict[sd_model] = pipe
        else:
            print('Invalid model path, must be .ckpt or .safetensors')
            return jsonify(error='Invalid model path, must be .ckpt or .safetensors'), 400


        print("Setting up scheduler...")
        pipe = cast(StableDiffusionXLPipeline, pipe)

        # Setup scheduler

        if scheduler == 'euler_ancestral': 
            pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
        elif scheduler == 'euler_discrete':
            pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config)
        elif scheduler == 'ddim':
            pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)
        elif scheduler == 'dpm_solver_multistep':
            pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        elif scheduler == 'heun_discrete_scheduler':
            pipe.scheduler = HeunDiscreteScheduler.from_config(pipe.scheduler.config)
        elif scheduler == 'uni_pc_multistep':
            pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

        pipe = pipe.to('cuda')

        # Setup loras
        for idx, lora in enumerate(loras):
            lora_path = os.path.expanduser(lora['path'])
            strength = lora['strength']
            adapter_name = f"lora_{idx}"
            print(f"Loading lora {lora_path} with strength {strength}")
            pipe.load_lora_weights(lora_path, adapter_name=adapter_name)
            pipe.set_adapters([adapter_name], adapter_weights=[strength])
        
        print("Generating image...")
        # Create the generator
        generator = torch.Generator(device='cuda').manual_seed(seed)

        generation_result = pipe(prompt=positive_prompt,
                    negative_prompt=negative_prompt,
                    width=width,
                    height=height,
                    num_inference_steps=steps,
                    generator=generator,
                    guidance_scale=cfg_scale,
                    num_images_per_prompt=iterations
                    )
        # print generation result object
        print(f"Generation result: {generation_result}")

        # Populate the result_images list with the generated images as base64 strings
        for image in generation_result.images:
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGBA')

            img_io = BytesIO()
            image.save(img_io, 'PNG')
            img_io.seek(0)
            # Convert the image to base64
            img_base64 = base64.b64encode(img_io.read()).decode('utf-8')
            result_images.append(img_base64)

        pipe.unload_lora_weights()

    except Exception as e:
        print(f"Error: {e.with_traceback()}")
        return jsonify(error=str(e)), 500

    return jsonify(images=result_images)

app.run(host='127.0.0.1', port=port)